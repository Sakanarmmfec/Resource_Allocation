# Google OAuth Setup Instructions

## 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set Application type to "Web application"
6. Add these URLs:
   - Authorized JavaScript origins: `http://localhost:5000`
   - Authorized redirect URIs: `http://localhost:5000/auth/google/callback`

## 2. Configure Environment Variables

Create a `.env` file in your project root:

```
GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
```

## 3. Install Dependencies

Run this command to install the new packages:

```bash
npm install
```

## 4. Start the Server

```bash
npm start
```

## 5. Access the Application

- Visit: `http://localhost:5000`
- You'll be redirected to login page
- Click "Continue with Google" to authenticate
- After successful login, you'll be redirected to the main application

## Security Notes

- Change the session secret in production
- Use HTTPS in production
- Store credentials securely using environment variables
- Consider implementing user roles and permissions