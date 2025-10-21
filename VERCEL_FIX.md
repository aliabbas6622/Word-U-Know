# Fix for 500 Internal Server Error

## Problem
API routes were using client-side Firebase SDK which doesn't work in Vercel serverless functions.

## Solution Applied
✅ Replaced `firebase/app` and `firebase/firestore` with `firebase-admin` in all API routes
✅ Added `firebase-admin` to package.json

## Required Steps

### 1. Get Firebase Admin Credentials
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `imposing-ace-451518-s9`
3. Click ⚙️ Settings > Project Settings > Service Accounts
4. Click "Generate New Private Key" button
5. Save the downloaded JSON file

### 2. Add Environment Variables to Vercel

```bash
# Add Firebase Admin credentials
vercel env add FIREBASE_CLIENT_EMAIL
# Paste: firebase-adminsdk-xxxxx@imposing-ace-451518-s9.iam.gserviceaccount.com
# (from the JSON file: "client_email" field)

vercel env add FIREBASE_PRIVATE_KEY
# Paste the entire private_key value from JSON including -----BEGIN/END PRIVATE KEY-----
# Keep the \n characters as-is

vercel env add FIREBASE_PROJECT_ID
# Enter: imposing-ace-451518-s9
```

### 3. Install Dependencies & Deploy

```bash
npm install
vercel --prod
```

## Verify Fix
After deployment, check:
- https://your-domain.vercel.app/api/current (should return word data or null)
- https://your-domain.vercel.app/api/archive (should return array)
- https://your-domain.vercel.app/api/submissions (should return array)

## Files Modified
- `/api/current.js` - Now uses firebase-admin
- `/api/archive.js` - Now uses firebase-admin  
- `/api/submissions.js` - Now uses firebase-admin
- `/package.json` - Added firebase-admin dependency
