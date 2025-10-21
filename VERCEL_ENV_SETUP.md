# Vercel Environment Variables Setup

## 🔧 Add These to Vercel Dashboard

Go to: https://vercel.com/aliabbas6622s-projects/word-u-know/settings/environment-variables

Add each variable below:

### Required Variables

```bash
VITE_FIREBASE_API_KEY=AIzaSyBJZR-nq9s31-5LSGuc_t_-JwH6cFlpyig
VITE_FIREBASE_AUTH_DOMAIN=imposing-ace-451518-s9.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=imposing-ace-451518-s9
VITE_FIREBASE_STORAGE_BUCKET=imposing-ace-451518-s9.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=603536810725
VITE_FIREBASE_APP_ID=1:603536810725:web:b5f7cceab0e4a3bc92aa0c
VITE_FIREBASE_MEASUREMENT_ID=G-EVZD3NZSB1

GEMINI_API_KEY=AIzaSyDaccjnON5RhwckcY7dSy11u1idXtF4CsU
CLIPDROP_API_KEY=543eb9917c1808e62dd68d72031a704a8de6787fcb2c30e4f3f3844e83ec728d98abebe114b266798cdf6b7a2876a90b
```

### Optional
```bash
OPENAI_API_KEY=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
NODE_ENV=production
```

## 📝 Steps

1. Go to Vercel project settings
2. Click "Environment Variables"
3. Add each variable (Name + Value)
4. Select "Production", "Preview", and "Development"
5. Click "Save"
6. Redeploy: `vercel --prod`

## ⚡ Quick CLI Method

```bash
vercel env add VITE_FIREBASE_API_KEY production
# Paste: AIzaSyBJZR-nq9s31-5LSGuc_t_-JwH6cFlpyig

vercel env add VITE_FIREBASE_PROJECT_ID production
# Paste: imposing-ace-451518-s9

vercel env add VITE_FIREBASE_AUTH_DOMAIN production
# Paste: imposing-ace-451518-s9.firebaseapp.com

vercel env add VITE_FIREBASE_STORAGE_BUCKET production
# Paste: imposing-ace-451518-s9.firebasestorage.app

vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID production
# Paste: 603536810725

vercel env add VITE_FIREBASE_APP_ID production
# Paste: 1:603536810725:web:b5f7cceab0e4a3bc92aa0c

vercel env add VITE_FIREBASE_MEASUREMENT_ID production
# Paste: G-EVZD3NZSB1

vercel env add GEMINI_API_KEY production
# Paste: AIzaSyDaccjnON5RhwckcY7dSy11u1idXtF4CsU

vercel env add CLIPDROP_API_KEY production
# Paste: 543eb9917c1808e62dd68d72031a704a8de6787fcb2c30e4f3f3844e83ec728d98abebe114b266798cdf6b7a2876a90b
```

After adding all variables, redeploy:
```bash
vercel --prod
```
