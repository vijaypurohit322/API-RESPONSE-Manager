# Social Authentication Setup Guide

Complete guide to enable Google, GitHub, and Microsoft OAuth login for API Response Manager.

## 🚀 Features Implemented

- ✅ Google OAuth 2.0 Sign-In
- ✅ GitHub OAuth
- ✅ Microsoft OAuth
- ✅ Automatic user creation/linking
- ✅ Social login buttons on Login/Register pages
- ✅ OAuth callback handlers

## 📋 Prerequisites

You need to create OAuth applications for each provider you want to support.

## 🔧 Setup Instructions

### 1. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen
6. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Authorized JavaScript origins:
     - `http://localhost:5173` (development)
     - `https://yourdomain.com` (production)
   - Authorized redirect URIs:
     - `http://localhost:5173` (development)
     - `https://yourdomain.com` (production)
7. Copy **Client ID** and **Client Secret**

**Add to `.env` file:**
```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Add to frontend `.env` file:**
```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### 2. GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in the details:
   - Application name: `API Response Manager`
   - Homepage URL: `http://localhost:5173` (or your domain)
   - Authorization callback URL: `http://localhost:5173/auth/github/callback`
4. Click **Register application**
5. Copy **Client ID**
6. Generate a new **Client Secret**

**Add to `.env` file:**
```env
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

**Add to frontend `.env` file:**
```env
VITE_GITHUB_CLIENT_ID=your-github-client-id
```

### 3. Microsoft OAuth Setup

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Fill in the details:
   - Name: `API Response Manager`
   - Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**
   - Redirect URI: `http://localhost:5173/auth/microsoft/callback`
5. Click **Register**
6. Copy **Application (client) ID**
7. Go to **Certificates & secrets** → **New client secret**
8. Copy the secret value

**Add to `.env` file:**
```env
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_REDIRECT_URI=http://localhost:5173/auth/microsoft/callback
```

**Add to frontend `.env` file:**
```env
VITE_MICROSOFT_CLIENT_ID=your-microsoft-client-id
```

## 📁 Files Created/Modified

### Backend Files
- ✅ `backend/routes/socialAuth.js` - OAuth routes
- ✅ `backend/models/User.js` - Updated with social auth fields
- ✅ `backend/server.js` - Added social auth routes

### Frontend Files
- ✅ `frontend/src/components/SocialLogin.jsx` - Social login buttons
- ✅ `frontend/src/pages/OAuthCallback.jsx` - OAuth callback handler
- ✅ `frontend/src/pages/LoginPage.jsx` - Added social login
- ✅ `frontend/src/pages/RegisterPage.jsx` - Added social login
- ✅ `frontend/src/App.jsx` - Added OAuth callback routes
- ✅ `frontend/index.html` - Added Google Sign-In script

## 🔐 API Endpoints

### Social Authentication
```
POST /api/auth/social/google     - Google OAuth login
POST /api/auth/social/github     - GitHub OAuth login
POST /api/auth/social/microsoft  - Microsoft OAuth login
```

### Request/Response Format

**Google:**
```json
POST /api/auth/social/google
{
  "token": "google-id-token"
}

Response:
{
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "https://..."
  }
}
```

**GitHub:**
```json
POST /api/auth/social/github
{
  "code": "github-authorization-code"
}

Response: Same as Google
```

**Microsoft:**
```json
POST /api/auth/social/microsoft
{
  "code": "microsoft-authorization-code"
}

Response: Same as Google
```

## 🎨 UI Components

### Social Login Buttons
The `SocialLogin` component displays three social login buttons:
- Google (with Google logo)
- GitHub (with GitHub logo)
- Microsoft (with Microsoft logo)

Each button shows a loading spinner when authentication is in progress.

### OAuth Flow
1. User clicks social login button
2. Redirects to provider's OAuth page
3. User authorizes the application
4. Provider redirects back to callback URL
5. Frontend exchanges code for JWT token
6. User is logged in and redirected to dashboard

## 🔄 User Model Updates

The User model now includes:
```javascript
{
  name: String,           // User's display name
  email: String,          // Email (unique)
  password: String,       // Password (random for social users)
  avatar: String,         // Profile picture URL
  provider: String,       // 'local', 'google', 'github', 'microsoft'
  providerId: String,     // Provider's user ID
  emailVerified: Boolean, // Email verification status
  createdAt: Date
}
```

## 🧪 Testing

### Test Google Login
1. Start the application
2. Go to login page
3. Click Google button
4. Sign in with Google account
5. Should redirect to dashboard

### Test GitHub Login
1. Click GitHub button
2. Authorize the application
3. Should redirect to dashboard

### Test Microsoft Login
1. Click Microsoft button
2. Sign in with Microsoft account
3. Should redirect to dashboard

## 🚨 Important Notes

### Security
- Never commit OAuth secrets to version control
- Use environment variables for all sensitive data
- Secrets are stored in `.env` files (gitignored)

### Email Linking
- If a user signs up with email, then logs in with social account using same email, the accounts are automatically linked
- Provider info is added to existing user account

### Production Setup
1. Update OAuth redirect URIs to production domain
2. Update frontend environment variables
3. Ensure HTTPS is enabled
4. Update CORS settings if needed

## 📝 Environment Variables Summary

### Backend `.env`
```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_REDIRECT_URI=http://localhost:5173/auth/microsoft/callback
```

### Frontend `.env`
```env
# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-google-client-id

# GitHub OAuth
VITE_GITHUB_CLIENT_ID=your-github-client-id

# Microsoft OAuth
VITE_MICROSOFT_CLIENT_ID=your-microsoft-client-id
```

## 🔗 Useful Links

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Microsoft OAuth Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)

## 🐛 Troubleshooting

### Google Login Not Working
- Check if Google Sign-In script is loaded
- Verify Client ID in frontend .env
- Check browser console for errors

### GitHub Login Not Working
- Verify callback URL matches exactly
- Check if Client ID is correct
- Ensure user's email is accessible

### Microsoft Login Not Working
- Verify redirect URI in Azure Portal
- Check if Client ID and Secret are correct
- Ensure proper account types are selected

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check backend logs
3. Verify all environment variables are set
4. Ensure OAuth apps are properly configured

## 📄 License

MIT License
