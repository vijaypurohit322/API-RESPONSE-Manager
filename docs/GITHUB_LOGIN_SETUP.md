# GitHub OAuth Login Setup Guide

Complete step-by-step guide to configure GitHub login for API Response Manager.

## 📋 Step 1: Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"OAuth Apps"** in the left sidebar
3. Click **"New OAuth App"** button

## 📝 Step 2: Fill in Application Details

### Application Name
```
API Response Manager
```

### Homepage URL
For development:
```
http://localhost:5173
```

For production:
```
https://yourdomain.com
```

### Application Description (Optional)
```
Tunnel, webhook, and API testing platform
```

### Authorization Callback URL
**This is critical - must match exactly!**

For development:
```
http://localhost:5173/auth/github/callback
```

For production:
```
https://yourdomain.com/auth/github/callback
```

## 🔑 Step 3: Get Client Credentials

After creating the app:

1. You'll see your **Client ID** - copy this
2. Click **"Generate a new client secret"**
3. Copy the **Client Secret** immediately (you won't see it again!)

## ⚙️ Step 4: Configure Environment Variables

### Backend Configuration

Edit your `.env` file in the `backend` folder:

```env
# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
```

**Example:**
```env
GITHUB_CLIENT_ID=Iv1.a1b2c3d4e5f6g7h8
GITHUB_CLIENT_SECRET=1234567890abcdef1234567890abcdef12345678
```

### Frontend Configuration

Create/edit `.env` file in the `frontend` folder:

```env
# GitHub OAuth
VITE_GITHUB_CLIENT_ID=your_github_client_id_here
```

**Example:**
```env
VITE_GITHUB_CLIENT_ID=Iv1.a1b2c3d4e5f6g7h8
```

**Note:** Only the Client ID goes in the frontend, NOT the secret!

## 🚀 Step 5: Restart Services

### If using Docker:
```bash
docker-compose restart backend frontend
```

### If running locally:
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 🧪 Step 6: Test GitHub Login

1. Open your app: `http://localhost:5173/login`
2. Click the **GitHub** button
3. You'll be redirected to GitHub
4. Click **"Authorize"** to allow access
5. You'll be redirected back and logged in!

## 🔍 Troubleshooting

### Error: "The redirect_uri MUST match the registered callback URL"

**Solution:** Check that your callback URL in GitHub OAuth app settings exactly matches:
```
http://localhost:5173/auth/github/callback
```

### Error: "Bad credentials"

**Solution:** 
- Verify Client ID and Secret are correct
- Make sure there are no extra spaces
- Regenerate the client secret if needed

### Error: "Email not provided by GitHub"

**Solution:** 
- Go to GitHub Settings → Emails
- Make at least one email public, OR
- Grant email permission scope (already included in the code)

### GitHub login button doesn't work

**Solution:**
- Check browser console for errors
- Verify `VITE_GITHUB_CLIENT_ID` is set in frontend `.env`
- Restart frontend dev server after adding env variables

### User is redirected but not logged in

**Solution:**
- Check backend logs for errors
- Verify `GITHUB_CLIENT_SECRET` is set in backend `.env`
- Ensure backend is running on port 5000

## 📱 Production Setup

When deploying to production:

1. **Update OAuth App Settings:**
   - Homepage URL: `https://yourdomain.com`
   - Callback URL: `https://yourdomain.com/auth/github/callback`

2. **Update Environment Variables:**
   ```env
   # Backend .env
   GITHUB_CLIENT_ID=your_production_client_id
   GITHUB_CLIENT_SECRET=your_production_client_secret
   
   # Frontend .env
   VITE_GITHUB_CLIENT_ID=your_production_client_id
   ```

3. **Or create a separate OAuth app for production** (recommended)

## 🔐 Security Best Practices

1. ✅ **Never commit** `.env` files to git
2. ✅ **Use different OAuth apps** for development and production
3. ✅ **Rotate secrets** periodically
4. ✅ **Keep client secret** secure (backend only)
5. ✅ **Use HTTPS** in production

## 📊 What Data GitHub Provides

When a user logs in with GitHub, we receive:
- Username (login)
- Display name
- Email address
- Avatar URL
- GitHub user ID

This data is used to create/update the user account in your database.

## 🔗 Useful Links

- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps)
- [GitHub OAuth Apps Settings](https://github.com/settings/developers)

## 📞 Need Help?

If you encounter issues:
1. Check the browser console (F12)
2. Check backend logs
3. Verify all environment variables are set
4. Ensure callback URL matches exactly
5. Try regenerating the client secret

## ✅ Checklist

- [ ] Created GitHub OAuth App
- [ ] Copied Client ID
- [ ] Generated and copied Client Secret
- [ ] Added `GITHUB_CLIENT_ID` to backend `.env`
- [ ] Added `GITHUB_CLIENT_SECRET` to backend `.env`
- [ ] Added `VITE_GITHUB_CLIENT_ID` to frontend `.env`
- [ ] Restarted backend service
- [ ] Restarted frontend service
- [ ] Tested login flow
- [ ] Successfully logged in with GitHub

---

**That's it!** GitHub login should now be working. Users can sign up or log in using their GitHub account. 🎉
