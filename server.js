const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
// Serve static files but exclude index.html from root
app.use(express.static('.', { index: false }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// Check OAuth credentials
if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'your_google_client_id_here') {
    console.error('❌ GOOGLE_CLIENT_ID not set in .env file');
    process.exit(1);
}
if (!process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET === 'your_google_client_secret_here') {
    console.error('❌ GOOGLE_CLIENT_SECRET not set in .env file');
    process.exit(1);
}



// Role definitions
const ROLES = {
    ADMIN: 'admin',
    USER: 'user', 
    VIEWER: 'viewer'
};

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.NODE_ENV === 'production' 
        ? 'https://resource-allocation-lnba.onrender.com/auth/google/callback'
        : '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    const email = profile.emails[0].value;
    
    // Check user role from database
    const client = await pool.connect();
    let userRole = null;
    
    try {
        const result = await client.query('SELECT role FROM user_roles WHERE email = $1', [email]);
        if (result.rows.length > 0) {
            userRole = result.rows[0].role;
        } else {
            return done(null, false, { message: 'Access denied. Contact administrator.' });
        }
    } catch (err) {
        console.error('Error fetching user role:', err);
        return done(null, false, { message: 'Database error. Contact administrator.' });
    } finally {
        client.release();
    }
    
    const user = {
        id: profile.id,
        name: profile.displayName,
        email: email,
        photo: profile.photos[0].value,
        role: userRole
    };
    return done(null, user);
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

// Authentication middleware
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login.html');
}

// Role-based authorization middleware
function requireRole(roles) {
    return (req, res, next) => {
        if (!req.isAuthenticated()) {
            return res.redirect('/login.html');
        }
        
        const userRole = req.user.role;
        if (roles.includes(userRole)) {
            return next();
        }
        
        return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    };
}

// Admin only middleware
function requireAdmin(req, res, next) {
    return requireRole([ROLES.ADMIN])(req, res, next);
}

// User or Admin middleware
function requireUserOrAdmin(req, res, next) {
    return requireRole([ROLES.USER, ROLES.ADMIN])(req, res, next);
}

// All authenticated users (including viewer)
function requireAnyUser(req, res, next) {
    return requireRole([ROLES.USER, ROLES.ADMIN, ROLES.VIEWER])(req, res, next);
}

// Initialize PostgreSQL connection pool for Render
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
    max: 20
});

// Create tables if they don't exist
async function initializeTables() {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS employees (
                id SERIAL PRIMARY KEY,
                name TEXT,
                department TEXT,
                employeeNumber TEXT,
                email TEXT
            )
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS projects (
                id SERIAL PRIMARY KEY,
                name TEXT,
                type TEXT DEFAULT 'project'
            )
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS efforts (
                id SERIAL PRIMARY KEY,
                employeeId INTEGER,
                projectId INTEGER,
                week INTEGER,
                effort DECIMAL,
                days INTEGER,
                UNIQUE(employeeId, projectId, week)
            )
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS project_assignments (
                id SERIAL PRIMARY KEY,
                employeeId INTEGER,
                projectId INTEGER,
                UNIQUE(employeeId, projectId)
            )
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS departments (
                id SERIAL PRIMARY KEY,
                name TEXT UNIQUE
            )
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_roles (
                id SERIAL PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                role TEXT NOT NULL DEFAULT 'viewer',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
    } finally {
        client.release();
    }
}
initializeTables().catch(console.error);

// Authentication routes
app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login.html?error=access_denied' }),
    (req, res) => {
        res.redirect('/index.html');
    }
);

app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect('/login.html');
    });
});



// Redirect root to login page
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// Handle authenticated redirect from login
app.get('/home', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/index.html');
    } else {
        res.redirect('/login.html');
    }
});

app.get('/index.html', requireAnyUser, (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/workload-summary.html', requireAnyUser, (req, res) => {
    res.sendFile(__dirname + '/workload-summary.html');
});

app.get('/admin.html', requireAdmin, (req, res) => {
    res.sendFile(__dirname + '/admin.html');
});

app.get('/add-department.html', requireAnyUser, (req, res) => {
    res.sendFile(__dirname + '/add-department.html');
});

app.get('/add-employee.html', requireAnyUser, (req, res) => {
    res.sendFile(__dirname + '/add-employee.html');
});

app.get('/add-project.html', requireAnyUser, (req, res) => {
    res.sendFile(__dirname + '/add-project.html');
});

app.get('/project-mapping.html', requireAnyUser, (req, res) => {
    res.sendFile(__dirname + '/project-mapping.html');
});

app.get('/api/user', ensureAuthenticated, (req, res) => {
    res.json(req.user);
});

app.get('/api/roles', ensureAuthenticated, (req, res) => {
    res.json(Object.values(ROLES));
});

app.post('/api/employees', requireUserOrAdmin, async (req, res) => {
    console.log('Received employee data:', req.body);
    const { name, email, department, employeeNumber } = req.body;
    
    if (!name || !department) {
        console.log('Missing name or department');
        return res.status(400).json({ error: 'Name and department are required' });
    }
    
    const client = await pool.connect();
    try {
        const result = await client.query(
            'INSERT INTO employees (name, email, department, employeeNumber) VALUES ($1, $2, $3, $4) RETURNING id',
            [name, email, department, employeeNumber]
        );
        console.log('Employee created with ID:', result.rows[0].id);
        res.json({ id: result.rows[0].id, success: true });
    } catch (err) {
        console.log('Database error:', err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

app.get('/api/employees', requireAnyUser, async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT id, name, email, department, employeeNumber as "employeeNumber" FROM employees');
        res.json(result.rows);
    } catch (err) {
        res.status(500).send(err.message);
    } finally {
        client.release();
    }
});

app.post('/api/projects', requireUserOrAdmin, async (req, res) => {
    const { name, type } = req.body;
    const client = await pool.connect();
    try {
        const result = await client.query(
            'INSERT INTO projects (name, type) VALUES ($1, $2) RETURNING id',
            [name, type || 'project']
        );
        res.json({ id: result.rows[0].id });
    } catch (err) {
        res.status(500).send(err.message);
    } finally {
        client.release();
    }
});

app.get('/api/projects', requireAnyUser, async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT * FROM projects');
        res.json(result.rows);
    } catch (err) {
        res.status(500).send(err.message);
    } finally {
        client.release();
    }
});

app.post('/api/efforts', requireUserOrAdmin, async (req, res) => {
    const { employeeId, projectId, week, effort, days } = req.body;
    console.log('Saving effort:', { employeeId, projectId, week, effort, days });
    
    const client = await pool.connect();
    try {
        await client.query(`
            INSERT INTO efforts (employeeId, projectId, week, effort, days) 
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (employeeId, projectId, week) 
            DO UPDATE SET effort = $4, days = $5
        `, [employeeId, projectId, week, effort, days]);
        
        console.log('Effort saved successfully');
        res.json({ success: true });
    } catch (err) {
        console.log('Database error:', err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

app.get('/api/efforts', requireAnyUser, async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT id, employeeId as "employeeId", projectId as "projectId", week, effort, days FROM efforts');
        res.json(result.rows);
    } catch (err) {
        res.status(500).send(err.message);
    } finally {
        client.release();
    }
});

app.post('/api/project-assignments', requireUserOrAdmin, async (req, res) => {
    const { employeeId, projectId } = req.body;
    const client = await pool.connect();
    try {
        await client.query(
            'INSERT INTO project_assignments (employeeId, projectId) VALUES ($1, $2) ON CONFLICT (employeeId, projectId) DO NOTHING',
            [employeeId, projectId]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).send(err.message);
    } finally {
        client.release();
    }
});

app.delete('/api/project-assignments', async (req, res) => {
    const { employeeId, projectId } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM efforts WHERE employeeId = $1 AND projectId = $2', [employeeId, projectId]);
        await client.query('DELETE FROM project_assignments WHERE employeeId = $1 AND projectId = $2', [employeeId, projectId]);
        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).send(err.message);
    } finally {
        client.release();
    }
});

app.get('/api/project-assignments', requireAnyUser, async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT id, employeeId as "employeeId", projectId as "projectId" FROM project_assignments');
        res.json(result.rows);
    } catch (err) {
        res.status(500).send(err.message);
    } finally {
        client.release();
    }
});

app.delete('/api/efforts', async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query('DELETE FROM efforts');
        res.json({ success: true, deleted: result.rowCount });
    } catch (err) {
        res.status(500).send(err.message);
    } finally {
        client.release();
    }
});

app.delete('/api/efforts/clear-view', async (req, res) => {
    const { employeeIds, weekValues } = req.body;
    
    if (!employeeIds || !weekValues) {
        return res.status(400).json({ error: 'Missing employeeIds or weekValues' });
    }
    
    const client = await pool.connect();
    try {
        const employeePlaceholders = employeeIds.map((_, i) => `$${i + 1}`).join(',');
        const weekPlaceholders = weekValues.map((_, i) => `$${i + employeeIds.length + 1}`).join(',');
        const query = `DELETE FROM efforts WHERE employeeId IN (${employeePlaceholders}) AND week IN (${weekPlaceholders})`;
        
        const result = await client.query(query, [...employeeIds, ...weekValues]);
        res.json({ success: true, deleted: result.rowCount });
    } catch (err) {
        res.status(500).send(err.message);
    } finally {
        client.release();
    }
});

app.put('/api/employees/:id', requireUserOrAdmin, async (req, res) => {
    const employeeId = req.params.id;
    const { name, email, department, employeeNumber } = req.body;
    
    const client = await pool.connect();
    try {
        // Build dynamic update query based on provided fields
        const updates = [];
        const values = [];
        let paramCount = 1;
        
        if (name !== undefined) {
            updates.push(`name = $${paramCount}`);
            values.push(name);
            paramCount++;
        }
        if (email !== undefined) {
            updates.push(`email = $${paramCount}`);
            values.push(email);
            paramCount++;
        }
        if (department !== undefined) {
            updates.push(`department = $${paramCount}`);
            values.push(department);
            paramCount++;
        }
        if (employeeNumber !== undefined) {
            updates.push(`employeeNumber = $${paramCount}`);
            values.push(employeeNumber);
            paramCount++;
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        
        values.push(employeeId);
        const query = `UPDATE employees SET ${updates.join(', ')} WHERE id = $${paramCount}`;
        
        const result = await client.query(query, values);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        
        res.json({ success: true, updated: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

app.delete('/api/employees/:id', requireUserOrAdmin, async (req, res) => {
    const employeeId = req.params.id;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM efforts WHERE employeeId = $1', [employeeId]);
        await client.query('DELETE FROM project_assignments WHERE employeeId = $1', [employeeId]);
        const result = await client.query('DELETE FROM employees WHERE id = $1', [employeeId]);
        await client.query('COMMIT');
        res.json({ success: true, deleted: result.rowCount });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

app.put('/api/projects/:id', async (req, res) => {
    const projectId = req.params.id;
    const { name, type } = req.body;
    const client = await pool.connect();
    try {
        const result = await client.query(
            'UPDATE projects SET name = $1, type = $2 WHERE id = $3',
            [name, type || 'project', projectId]
        );
        res.json({ success: true, updated: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// Department endpoints
app.post('/api/departments', async (req, res) => {
    const { name } = req.body;
    
    if (!name) {
        return res.status(400).json({ error: 'Department name is required' });
    }
    
    const client = await pool.connect();
    try {
        const result = await client.query(
            'INSERT INTO departments (name) VALUES ($1) RETURNING id',
            [name]
        );
        res.json({ id: result.rows[0].id, success: true });
    } catch (err) {
        if (err.code === '23505') { // Unique constraint violation
            res.status(400).json({ error: 'Department name already exists' });
        } else {
            res.status(500).json({ error: err.message });
        }
    } finally {
        client.release();
    }
});

app.get('/api/departments', requireAnyUser, async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT * FROM departments ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

app.put('/api/departments/:id', async (req, res) => {
    const departmentId = req.params.id;
    const { name } = req.body;
    
    if (!name) {
        return res.status(400).json({ error: 'Department name is required' });
    }
    
    const client = await pool.connect();
    try {
        const result = await client.query(
            'UPDATE departments SET name = $1 WHERE id = $2',
            [name, departmentId]
        );
        res.json({ success: true, updated: result.rowCount });
    } catch (err) {
        if (err.code === '23505') { // Unique constraint violation
            res.status(400).json({ error: 'Department name already exists' });
        } else {
            res.status(500).json({ error: err.message });
        }
    } finally {
        client.release();
    }
});

app.delete('/api/departments/:id', async (req, res) => {
    const departmentId = req.params.id;
    const client = await pool.connect();
    
    try {
        const result = await client.query('DELETE FROM departments WHERE id = $1', [departmentId]);
        res.json({ success: true, deleted: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// SQL Query endpoint for AI chat
app.post('/api/query', requireUserOrAdmin, async (req, res) => {
    const { query } = req.body;
    const client = await pool.connect();
    
    try {
        console.log('Executing SQL query:', query);
        const result = await client.query(query);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('SQL query error:', err.message);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// Workload analysis endpoint for AI chat
app.post('/api/workload-analysis', requireUserOrAdmin, async (req, res) => {
    const { query } = req.body;
    
    try {
        console.log('🤖 Processing AI workload query:', query);
        
        // Try OpenAI API first
        try {
            const openAIResponse = await callOpenAI(query);
            if (openAIResponse && openAIResponse.trim()) {
                console.log('✅ OpenAI API response received');
                res.json({ success: true, analysis: openAIResponse });
                return;
            }
        } catch (apiError) {
            console.log('⚠️ OpenAI API failed:', apiError.message);
        }
        
        // Fallback to intelligent local responses
        console.log('🔄 Using intelligent fallback response');
        const aiResponse = generateIntelligentResponse(query);
        
        res.json({ success: true, analysis: aiResponse });
    } catch (err) {
        console.error('❌ Workload analysis error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// OpenAI API call function
async function callOpenAI(userQuery) {
    try {
        const response = await fetch('https://gpt.mfec.co.th/litellm/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer sk-2G0DcuqjvJmYToAGXdiEiA'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{
                    role: 'system',
                    content: 'You are an AI assistant for a Resource Allocation System. Help users with workload management, employee assignments, and project planning. Provide practical, actionable advice.'
                }, {
                    role: 'user',
                    content: userQuery
                }],
                max_tokens: 500,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.choices && data.choices[0] && data.choices[0].message) {
            return data.choices[0].message.content.trim();
        }
        
        throw new Error('Invalid response format from OpenAI API');
        
    } catch (error) {
        console.error('OpenAI API call failed:', error.message);
        throw error;
    }
}

// Intelligent fallback response generator
function generateIntelligentResponse(query) {
    const lowerQuery = query.toLowerCase();
    
    // Greeting responses
    if (lowerQuery.includes('hello') || lowerQuery.includes('hi') || lowerQuery.includes('hey')) {
        const greetings = [
            "Hello! I'm your AI-powered Workload Assistant. I can help you analyze resource allocation, manage team capacity, and optimize project assignments. What would you like to know about your team's workload?",
            "Hi there! Welcome to your intelligent resource allocation assistant. I'm here to help you optimize team workloads and project assignments. How can I assist you today?",
            "Hey! Ready to optimize your team's workload? I can help you find available capacity, manage overloaded employees, and balance project assignments. What's on your mind?"
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    // Resource availability queries
    if (lowerQuery.includes('available') || lowerQuery.includes('capacity') || lowerQuery.includes('free')) {
        const responses = [
            "🔍 Finding Available Capacity:\\n\\n• Look for employees with <5 days weekly workload in the 'Underutilized' section\\n• Use filters to view specific departments or time periods\\n• Check the workload visualization charts for quick capacity overview\\n• Consider redistributing tasks from overloaded team members\\n• Monitor department-level capacity to identify bottlenecks\\n\\n💡 Pro Tip: Maintain 10-15% buffer capacity for urgent requests.",
            "👥 Available Team Capacity Analysis:\\n\\n• Review the 'Underutilized' employees in your dashboard\\n• Filter by department to find specific skill sets\\n• Use the bar chart to visually identify capacity gaps\\n• Cross-reference with project timelines for optimal allocation\\n• Consider skill development opportunities for available staff\\n\\n✨ Smart Tip: Available capacity is your competitive advantage!"
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Overload management queries
    if (lowerQuery.includes('overload') || lowerQuery.includes('busy') || lowerQuery.includes('too much work')) {
        const responses = [
            "⚠️ Managing Overloaded Employees (>5 days/week):\\n\\n1. Identify Root Causes: Check which projects are causing the overload\\n2. Redistribute Tasks: Move non-critical work to available team members\\n3. Timeline Adjustment: Consider extending project deadlines if possible\\n4. Priority Review: Discuss project priorities with stakeholders\\n5. Trend Monitoring: Track workload patterns to prevent future overloads\\n\\n🎯 Goal: Aim for sustainable 5-day weekly allocations across your team.",
            "🚀 Overload Resolution Strategy:\\n\\n• Immediate Action: Identify tasks that can be delayed or delegated\\n• Resource Rebalancing: Move work to team members with capacity\\n• Process Optimization: Look for inefficiencies in current workflows\\n• Stakeholder Communication: Set realistic expectations with clients\\n• Prevention Planning: Implement early warning systems for future overloads\\n\\n📊 Remember: Sustainable workloads lead to better quality and team satisfaction."
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Project assignment queries
    if (lowerQuery.includes('project') && (lowerQuery.includes('assign') || lowerQuery.includes('allocation'))) {
        return "📋 Optimal Project Allocation Strategy:\\n\\n• Skill Matching: Align employee expertise with project requirements\\n• Load Balancing: Distribute work evenly (target: 5 days/week per person)\\n• Cross-functional Planning: Consider department capacity for multi-team projects\\n• Progress Tracking: Monitor project advancement and adjust allocations\\n• Visibility Maintenance: Keep all stakeholders informed of assignments\\n\\n🔄 Remember: Regular rebalancing ensures optimal resource utilization.";
    }
    
    // Team management queries
    if (lowerQuery.includes('team') || lowerQuery.includes('department') || lowerQuery.includes('manage')) {
        return "👥 Effective Team Workload Management:\\n\\n• Regular Monitoring: Review individual and department capacity weekly\\n• Data-Driven Decisions: Use dashboard insights for workload balancing\\n• Mentorship Opportunities: Leverage high-performers to guide others\\n• Seasonal Planning: Anticipate and prepare for workload variations\\n• Clear Communication: Maintain transparency about capacity and priorities\\n\\n📊 Use the dashboard filters and reports to get detailed team insights.";
    }
    
    // Specific employee queries
    if (lowerQuery.includes('who is working') || lowerQuery.includes('which employees') || lowerQuery.includes('project team')) {
        return "👤 Finding Project Team Members:\\n\\n• Detailed Reports: Use the reports section to see project assignments\\n• Project Filtering: Filter by project name to view all team members\\n• Effort Levels: Check individual contribution levels and time allocation\\n• Visual Charts: Use workload visualization for graphical team overview\\n• Department View: See cross-departmental project involvement\\n\\n🔍 Navigate to the detailed reports section for comprehensive project team data.";
    }
    
    // Planning and optimization queries
    if (lowerQuery.includes('plan') || lowerQuery.includes('optimize') || lowerQuery.includes('improve')) {
        return "🎯 Resource Planning Best Practices:\\n\\n1. Historical Analysis: Study past workload patterns for future predictions\\n2. Buffer Capacity: Maintain 10-15% spare capacity for urgent work\\n3. Cross-Training: Develop versatile team members for flexibility\\n4. Hiring Insights: Use workload data to inform recruitment decisions\\n5. Priority Management: Regularly review and adjust project importance\\n\\n📈 Continuous optimization leads to better team performance and satisfaction.";
    }
    
    // Workload analysis queries
    if (lowerQuery.includes('workload') || lowerQuery.includes('analysis') || lowerQuery.includes('summary')) {
        return "📊 Workload Analysis Insights:\\n\\n• Dashboard Metrics: Review team capacity utilization patterns\\n• Balance Assessment: Compare overloaded vs. underutilized employees\\n• Department Analysis: Identify resource gaps across teams\\n• Project Distribution: Ensure balanced assignment across initiatives\\n• Project Types: Consider both paid and non-paid work in planning\\n\\n💡 Use the time period filters to analyze trends and make informed decisions.";
    }
    
    // Specific data queries
    if (lowerQuery.includes('highest workload') || lowerQuery.includes('most busy')) {
        return "📈 Finding Highest Workload:\\n\\n• Employee View: Sort employees by total workload in the detailed reports\\n• Department Comparison: Check department-level workload summaries\\n• Project Analysis: Identify which projects require the most resources\\n• Time Period: Use filters to analyze specific weeks, months, or quarters\\n• Visual Charts: Bar charts show workload distribution clearly\\n\\n🔍 Check the workload visualization section for immediate insights.";
    }
    
    // Help and guidance queries
    if (lowerQuery.includes('help') || lowerQuery.includes('how to') || lowerQuery.includes('guide')) {
        return "🤖 AI Workload Assistant Help:\\n\\nI can assist you with:\\n• Employee Availability: Find team members with spare capacity\\n• Overload Management: Strategies for managing busy employees\\n• Project Assignments: Optimal allocation recommendations\\n• Team Analysis: Department and individual workload insights\\n• Planning Advice: Best practices for resource management\\n\\n❓ Try asking specific questions like:\\n• 'Which employees have available capacity?'\\n• 'How can I manage overloaded team members?'\\n• 'What's the workload by department?'";
    }
    
    // Random varied default responses
    const defaultResponses = [
        "🤖 AI Workload Assistant Ready!\\n\\nI'm here to help you optimize your team's resource allocation. I can provide insights on:\\n\\n• 👥 Employee availability and capacity\\n• ⚠️ Managing overloaded team members\\n• 📋 Project assignment strategies\\n• 🏢 Department workload analysis\\n• 🎯 Team management best practices\\n\\n💬 Ask me anything about your team's workload!",
        "🚀 Resource Optimization Assistant Active!\\n\\nI specialize in helping you:\\n\\n• 🔍 Identify available team capacity\\n• ⚖️ Balance workloads across projects\\n• 📈 Analyze department performance\\n• 📊 Track resource utilization trends\\n• 🎯 Optimize project assignments\\n\\n💡 What resource challenge can I help you solve today?",
        "🌟 Smart Workload Management at Your Service!\\n\\nI can help you with:\\n\\n• 👥 Team capacity planning and analysis\\n• 📋 Strategic project resource allocation\\n• 📉 Workload distribution optimization\\n• 🏢 Cross-department resource insights\\n• ⚡ Quick solutions for resource bottlenecks\\n\\n🚀 Ready to maximize your team's potential?"
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

// Admin API endpoints for user role management
app.get('/api/admin/users', requireAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query(`
            SELECT email, role, created_at, updated_at 
            FROM user_roles 
            ORDER BY email
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

app.post('/api/admin/users', requireAdmin, async (req, res) => {
    const { email, role } = req.body;
    
    if (!email || !role || !Object.values(ROLES).includes(role)) {
        return res.status(400).json({ error: 'Valid email and role are required' });
    }
    
    const client = await pool.connect();
    try {
        const result = await client.query(
            'INSERT INTO user_roles (email, role) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET role = $2, updated_at = CURRENT_TIMESTAMP RETURNING *',
            [email, role]
        );
        res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

app.put('/api/admin/users/:email', requireAdmin, async (req, res) => {
    const { email } = req.params;
    const { role } = req.body;
    
    if (!role || !Object.values(ROLES).includes(role)) {
        return res.status(400).json({ error: 'Valid role is required' });
    }
    
    const client = await pool.connect();
    try {
        const result = await client.query(
            'UPDATE user_roles SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2 RETURNING *',
            [role, email]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

app.delete('/api/admin/users/:email', requireAdmin, async (req, res) => {
    const { email } = req.params;
    
    const client = await pool.connect();
    try {
        const result = await client.query('DELETE FROM user_roles WHERE email = $1', [email]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ success: true, deleted: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Chat AI endpoints available at:`);
    console.log(`- POST /api/query (SQL queries)`);
    console.log(`- POST /api/workload-analysis (AI analysis)`);
});