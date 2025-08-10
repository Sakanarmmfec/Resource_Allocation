# Google OAuth Setup Guide

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URI: `http://localhost:5000/auth/google/callback`

## Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env`
2. Fill in your Google OAuth credentials:
   ```
   GOOGLE_CLIENT_ID=your_actual_client_id
   GOOGLE_CLIENT_SECRET=your_actual_client_secret
   SESSION_SECRET=random_string_for_sessions
   ```

## Step 3: Install Dependencies

```bash
npm install dotenv
```

## Step 4: Restart Server

```bash
node server.js
```

Your Google OAuth login should now work at `http://localhost:5000/login.html`