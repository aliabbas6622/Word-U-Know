# Production Setup Guide

## 🔒 Security Checklist

### 1. Environment Variables
Update `.env.local` with secure credentials:

```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Set strong admin credentials
ADMIN_USERNAME=your_secure_username
ADMIN_PASSWORD=your_secure_password_min_12_chars
JWT_SECRET=your_generated_jwt_secret
```

### 2. API Keys
- Replace all placeholder API keys in `.env.local`
- Never commit `.env.local` to version control
- Use Vercel environment variables for production

### 3. Firebase Security Rules
Update Firestore rules to restrict write access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /words/{document=**} {
      allow read: if true;
      allow write: if false; // Only server can write
    }
    match /submissions/{document=**} {
      allow read: if true;
      allow create: if true;
      allow update, delete: if false;
    }
  }
}
```

## 🚀 Deployment Steps

### Vercel Deployment

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Set Environment Variables**
```bash
vercel env add ADMIN_USERNAME
vercel env add ADMIN_PASSWORD
vercel env add JWT_SECRET
vercel env add GEMINI_API_KEY
vercel env add CLIPDROP_API_KEY
vercel env add VITE_FIREBASE_API_KEY
vercel env add VITE_FIREBASE_AUTH_DOMAIN
vercel env add VITE_FIREBASE_PROJECT_ID
vercel env add VITE_FIREBASE_STORAGE_BUCKET
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
vercel env add VITE_FIREBASE_APP_ID
vercel env add VITE_FIREBASE_MEASUREMENT_ID
```

4. **Deploy**
```bash
vercel --prod
```

## 🔐 Security Features Implemented

✅ **Authentication**
- Environment-based admin credentials
- Secure token generation using HMAC-SHA256
- Token validation with pattern matching

✅ **HTTP Security Headers**
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security (HSTS)
- Referrer-Policy
- Permissions-Policy

✅ **API Protection**
- Method validation
- Input sanitization
- Rate limiting ready

## 📝 Post-Deployment

1. **Test Admin Login**
   - Navigate to `/admin`
   - Login with new credentials
   - Verify all functions work

2. **Monitor Logs**
```bash
vercel logs
```

3. **Set Up Monitoring**
   - Enable Vercel Analytics
   - Configure error tracking
   - Set up uptime monitoring

## ⚠️ Important Notes

- **Never** commit `.env.local` to Git
- Change default credentials immediately
- Rotate API keys regularly
- Monitor API usage and costs
- Keep dependencies updated
- Review Firebase security rules monthly

## 🔄 Updating Production

```bash
# Pull latest changes
git pull origin main

# Deploy
vercel --prod
```

## 🆘 Rollback

```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback [deployment-url]
```
