# Vercel Firebase Setup Guide

## Firebase Admin Service Account Setup

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `imposing-ace-451518-s9`
3. **Navigate to Project Settings** → **Service Accounts**
4. **Click "Generate new private key"**
5. **Download the JSON file** (keep it secure!)

## Required Vercel Environment Variables

Set these in your Vercel dashboard under Project Settings → Environment Variables:

### API Keys
```
GEMINI_API_KEY=your_gemini_api_key_here
CLIPDROP_API_KEY=your_clipdrop_api_key_here
```

### Firebase Client SDK (Frontend)
```
VITE_FIREBASE_API_KEY=AIzaSyBJZR-nq9s31-5LSGuc_t_-JwH6cFlpyig
VITE_FIREBASE_AUTH_DOMAIN=imposing-ace-451518-s9.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=imposing-ace-451518-s9
VITE_FIREBASE_STORAGE_BUCKET=imposing-ace-451518-s9.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=603536810725
VITE_FIREBASE_APP_ID=1:603536810725:web:b5f7cceab0e4a3bc92aa0c
VITE_FIREBASE_MEASUREMENT_ID=G-EVZD3NZSB1
```

### Firebase Admin SDK (API Routes)
```
FIREBASE_PROJECT_ID=imposing-ace-451518-s9
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@imposing-ace-451518-s9.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

### Admin & Security
```
ADMIN_USERNAME=guy789
ADMIN_PASSWORD=789guy
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
NODE_ENV=production
```

## CRITICAL: FIREBASE_PRIVATE_KEY Formatting

⚠️ **IMPORTANT**: The private key must be formatted correctly in Vercel:

1. **Copy the entire private key** from your service account JSON file
2. **Include the quotes** around the entire key
3. **Keep the `\n` characters** (do NOT replace with actual newlines)
4. **Example format**:
   ```
   "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
   ```

## Deployment Steps

1. **Set all environment variables** in Vercel dashboard
2. **Deploy**: `vercel --prod`
3. **Test API endpoints**:
   - `/api/current`
   - `/api/archive`
   - `/api/submissions`

## Troubleshooting

### "UNAUTHENTICATED" Error
- Check that `FIREBASE_PRIVATE_KEY` is properly formatted with `\n` characters
- Verify `FIREBASE_CLIENT_EMAIL` matches your service account
- Ensure `FIREBASE_PROJECT_ID` is correct

### "Missing credentials" Error
- All three Firebase Admin variables must be set
- Check for typos in variable names
- Verify the service account has Firestore permissions

## Testing Locally

```bash
# Copy your production environment variables to .env.local
# Then run:
npm run dev
```

Test the API endpoints at:
- http://localhost:3000/api/current
- http://localhost:3000/api/archive
- http://localhost:3000/api/submissions