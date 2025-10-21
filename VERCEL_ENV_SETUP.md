# Vercel Environment Variables Setup

Run these commands to add all required environment variables to Vercel:

```bash
# Admin Credentials
vercel env add ADMIN_USERNAME
# Enter: guy789

vercel env add ADMIN_PASSWORD
# Enter: 789guy

vercel env add JWT_SECRET
# Enter: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2

# API Keys
vercel env add GEMINI_API_KEY
# Enter: AIzaSyDaccjnON5RhwckcY7dSy11u1idXtF4CsU

vercel env add CLIPDROP_API_KEY
# Enter: 543eb9917c1808e62dd68d72031a704a8de6787fcb2c30e4f3f3844e83ec728d98abebe114b266798cdf6b7a2876a90b

# Firebase (with VITE_ prefix for frontend)
vercel env add VITE_FIREBASE_API_KEY
# Enter: AIzaSyBJZR-nq9s31-5LSGuc_t_-JwH6cFlpyig

vercel env add VITE_FIREBASE_AUTH_DOMAIN
# Enter: imposing-ace-451518-s9.firebaseapp.com

vercel env add VITE_FIREBASE_PROJECT_ID
# Enter: imposing-ace-451518-s9

vercel env add VITE_FIREBASE_STORAGE_BUCKET
# Enter: imposing-ace-451518-s9.firebasestorage.app

vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
# Enter: 603536810725

vercel env add VITE_FIREBASE_APP_ID
# Enter: 1:603536810725:web:b5f7cceab0e4a3bc92aa0c

vercel env add VITE_FIREBASE_MEASUREMENT_ID
# Enter: G-EVZD3NZSB1

# Firebase (without VITE_ prefix for API routes)
vercel env add FIREBASE_API_KEY
# Enter: AIzaSyBJZR-nq9s31-5LSGuc_t_-JwH6cFlpyig

vercel env add FIREBASE_AUTH_DOMAIN
# Enter: imposing-ace-451518-s9.firebaseapp.com

vercel env add FIREBASE_PROJECT_ID
# Enter: imposing-ace-451518-s9

vercel env add FIREBASE_STORAGE_BUCKET
# Enter: imposing-ace-451518-s9.firebasestorage.app

vercel env add FIREBASE_MESSAGING_SENDER_ID
# Enter: 603536810725

vercel env add FIREBASE_APP_ID
# Enter: 1:603536810725:web:b5f7cceab0e4a3bc92aa0c

# Firebase Admin SDK (for API routes)
vercel env add FIREBASE_CLIENT_EMAIL
# Enter: firebase-adminsdk-xxxxx@imposing-ace-451518-s9.iam.gserviceaccount.com
# Get from Firebase Console > Project Settings > Service Accounts

vercel env add FIREBASE_PRIVATE_KEY
# Enter: -----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----
# Get from Firebase Console > Project Settings > Service Accounts > Generate New Private Key
# IMPORTANT: Keep the \n characters in the key
```

After adding all variables, redeploy:
```bash
vercel --prod
```
