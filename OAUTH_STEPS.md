# Fix OAuth Error 401: invalid_client

## Step 1: Get Your Credentials
1. Go to https://console.cloud.google.com/
2. Select your project
3. Go to "APIs & Services" > "Credentials"
4. Find your OAuth 2.0 Client ID
5. Copy the **Client ID** and **Client secret**

## Step 2: Update .env File
Replace the placeholder values in `.env`:
```
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_actual_secret_here
SESSION_SECRET=resource_allocation_secret_key_2024
```

## Step 3: Verify Redirect URI
In Google Console, make sure you have this exact URI:
```
http://localhost:5000/auth/google/callback
```

## Step 4: Restart Server
```
node server.js
```

If credentials are missing, server will show error and exit.