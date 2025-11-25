# Google OAuth Setup Guide

## Prerequisites
- Google Cloud Console account
- API Response Manager backend running

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API** or **Google Identity Services**

## Step 2: Configure OAuth Consent Screen

1. Navigate to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type
3. Fill in required fields:
   - App name: `API Response Manager`
   - User support email: Your email
   - Developer contact: Your email
4. Add scopes:
   - `openid`
   - `email`
   - `profile`
5. Add test users (for development)
6. Save and continue

## Step 3: Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Choose **Web application**
4. Configure:
   - **Name**: `API Response Manager`
   - **Authorized JavaScript origins**:
     ```
     http://localhost:5173
     http://localhost:3000
     ```
   - **Authorized redirect URIs** (IMPORTANT - Add ALL of these):
     ```
     http://localhost:5173/auth/google/callback
     http://localhost:5173/device
     ```

5. Click **Create**
6. Copy the **Client ID** and **Client Secret**

## Step 4: Configure Backend

Edit `backend/.env`:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

## Step 5: Configure Frontend

Edit `frontend/.env`:

```env
# Google OAuth (Client ID only - no secret!)
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

## Step 6: Restart Services

```bash
# Restart backend
npm start --prefix backend

# Restart frontend (if running)
npm run dev --prefix frontend
```

## Testing

### Test Web UI Login
1. Go to http://localhost:5173/login
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Should redirect to dashboard

### Test CLI Login
```bash
arm login --provider google
```

Should:
1. Generate device code
2. Open browser to http://localhost:5173/device
3. Prompt for Google login
4. Return token to CLI

## Troubleshooting

### Error: "The OAuth client was not found"
**Cause:** Client ID mismatch or not configured in Google Cloud Console

**Solution:**
1. Verify `GOOGLE_CLIENT_ID` in both `backend/.env` and `frontend/.env`
2. Ensure it matches the Client ID in Google Cloud Console
3. Check redirect URIs are exactly as listed above

### Error: "redirect_uri_mismatch"
**Cause:** Redirect URI not authorized in Google Cloud Console

**Solution:**
1. Go to Google Cloud Console > Credentials
2. Edit your OAuth client
3. Add both redirect URIs:
   - `http://localhost:5173/auth/google/callback`
   - `http://localhost:5173/device`

### Error: "Access blocked: This app's request is invalid"
**Cause:** OAuth consent screen not configured or app not verified

**Solution:**
1. Complete OAuth consent screen setup
2. Add your email as a test user
3. For production, submit app for verification

### White screen after Google login
**Cause:** Backend not handling OAuth code correctly

**Solution:**
1. Check backend logs for errors
2. Verify `GOOGLE_CLIENT_SECRET` is set in `backend/.env`
3. Restart backend server

## Production Setup

For production deployment:

1. **Update redirect URIs** in Google Cloud Console:
   ```
   https://yourdomain.com/auth/google/callback
   https://yourdomain.com/device
   ```

2. **Update environment variables**:
   ```env
   FRONTEND_URL=https://yourdomain.com
   ```

3. **Verify OAuth consent screen**:
   - Submit for verification if needed
   - Update privacy policy and terms of service URLs

## Security Best Practices

- ✅ Never commit `.env` files to git
- ✅ Use different credentials for dev/staging/production
- ✅ Rotate secrets regularly
- ✅ Monitor OAuth usage in Google Cloud Console
- ✅ Restrict API keys by IP/domain in production
- ✅ Enable 2FA on Google Cloud account

## References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Sign-In for Web](https://developers.google.com/identity/sign-in/web)
- [OAuth 2.0 Device Flow](https://developers.google.com/identity/protocols/oauth2/native-app)
