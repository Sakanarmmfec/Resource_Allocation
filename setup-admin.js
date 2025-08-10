const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
    host: '127.0.0.1',
    port: 1433,
    database: 'resource_allocation',
    user: 'postgres',
    password: '070681642Horwang@',
    ssl: false,
    connectionTimeoutMillis: 10000
});

async function setupAdmin() {
    const client = await pool.connect();
    
    try {
        console.log('Setting up admin user...');
        
        // Create user_roles table if it doesn't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_roles (
                id SERIAL PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                role TEXT NOT NULL DEFAULT 'viewer',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Add admin users (you can modify these emails)
        const adminEmails = [
            'mfecdemo1@gmail.com',
            'pattaraphol@mfec.co.th',
            'sakan_pu@mfec.co.th',
            'sakan_pu@mfec.com'
        ];
        
        for (const email of adminEmails) {
            await client.query(`
                INSERT INTO user_roles (email, role) 
                VALUES ($1, 'admin') 
                ON CONFLICT (email) 
                DO UPDATE SET role = 'admin', updated_at = CURRENT_TIMESTAMP
            `, [email]);
            console.log(`✅ Set ${email} as admin`);
        }
        
        console.log('\n🎉 Admin setup complete!');
        console.log('Admin users can now access the admin panel at /admin.html');
        
    } catch (error) {
        console.error('❌ Error setting up admin:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

setupAdmin();