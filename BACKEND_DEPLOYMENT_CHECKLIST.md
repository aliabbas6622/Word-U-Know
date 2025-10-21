# Backend Deployment Checklist

## ✅ Completed
- [x] API routes configured in vercel.json
- [x] Serverless functions created with Firebase integration
- [x] Security headers configured
- [x] CSRF protection in generate.js

## ⚠️ Required Before Deployment

### 1. Environment Variables (Set in Vercel Dashboard)
```bash
# API Keys
GEMINI_API_KEY=your_gemini_key
CLIPDROP_API_KEY=your_clipdrop_key

# Firebase Config
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Admin Credentials
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_secure_password
ADMIN_TOKEN=your_secure_token

# Security
ALLOWED_ORIGIN=https://your-domain.vercel.app
NODE_ENV=production
```

### 2. Firebase Setup
- [ ] Create Firestore collections:
  - `words` (with document `current`)
  - `submissions`
  - `archive`
- [ ] Configure Firestore rules
- [ ] Enable Firebase Authentication (if needed)

### 3. Vercel Configuration
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### 4. Post-Deployment Testing
- [ ] Test `/api/current` endpoint
- [ ] Test `/api/generate` endpoint
- [ ] Test `/api/submissions` endpoint
- [ ] Test `/api/archive` endpoint
- [ ] Verify Firebase connection
- [ ] Test admin authentication

## 📝 Notes

### API Endpoints
- `GET /api/current` - Fetch current word
- `POST /api/generate` - Generate new word (protected)
- `GET /api/submissions` - Fetch all submissions
- `GET /api/archive` - Fetch archived words

### Local vs Production
- **Local**: Uses Express server (`npm run server`)
- **Production**: Uses Vercel serverless functions (`/api/*.js`)

### Important
- The `server/index.mjs` file is for LOCAL development only
- Vercel uses the `/api` folder for serverless functions
- All data is stored in Firebase (no local data.json in production)
