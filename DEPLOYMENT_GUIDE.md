# EthereaLex - Deployment Guide

## 🚀 Quick Deploy to Vercel

### Prerequisites
- Node.js 18+ installed
- Vercel account
- API keys ready (Gemini, ClipDrop, Firebase)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Deploy
```bash
vercel
```

### Step 3: Configure Environment Variables
Go to your Vercel project dashboard → Settings → Environment Variables

Add the following:

```env
GEMINI_API_KEY=<your_gemini_api_key>
CLIPDROP_API_KEY=<your_clipdrop_api_key>
VITE_FIREBASE_API_KEY=<your_firebase_api_key>
VITE_FIREBASE_AUTH_DOMAIN=<your_firebase_auth_domain>
VITE_FIREBASE_PROJECT_ID=<your_firebase_project_id>
VITE_FIREBASE_STORAGE_BUCKET=<your_firebase_storage_bucket>
VITE_FIREBASE_MESSAGING_SENDER_ID=<your_firebase_sender_id>
VITE_FIREBASE_APP_ID=<your_firebase_app_id>
VITE_FIREBASE_MEASUREMENT_ID=<your_firebase_measurement_id>
ALLOWED_ORIGIN=https://your-project.vercel.app
```

### Step 4: Production Deploy
```bash
vercel --prod
```

## 🔧 Local Development

### Setup
```bash
npm install
cp .env.example .env.local
# Edit .env.local with your credentials
```

### Run
```bash
# Option 1: Use start script
npm run start

# Option 2: Run separately
npm run server  # Terminal 1
npm run dev     # Terminal 2
```

## ✅ Pre-Deployment Checklist

- [x] All API keys configured
- [x] Firebase integration tested
- [x] Error boundaries in place
- [x] Responsive design verified
- [x] Cross-browser compatibility checked
- [x] Security headers configured
- [x] Environment variables secured
- [x] Build process tested

## 🎯 Features

- ✨ AI-powered word generation (Gemini)
- 🖼️ Abstract image generation (ClipDrop)
- 🔥 Real-time Firebase sync
- 💬 Community submissions & voting
- 📦 Archive system
- 🎨 Responsive design
- 🔒 Admin panel with authentication

## 📝 Notes

- Firebase credentials are safe to expose (public by design)
- Backend API keys must be kept secret in Vercel environment
- Update `ALLOWED_ORIGIN` after first deployment
- Admin credentials should be configured separately

## 🆘 Troubleshooting

**Build fails:**
- Check all dependencies are installed
- Verify Node.js version (18+)

**API errors:**
- Verify all environment variables are set
- Check API key validity

**Firebase errors:**
- Confirm Firebase project is active
- Verify Firestore rules are configured

## 📞 Support

For issues, check the documentation files:
- `FIREBASE_INTEGRATION.md`
- `VERCEL_DEPLOY.md`
- `README.md`
