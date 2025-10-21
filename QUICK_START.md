# 🚀 Quick Start Guide

## 1. Get Firebase Service Account (2 minutes)

```bash
npm run setup:firebase
```

Follow the link, download the JSON file, and copy the credentials to `.env.local`.

## 2. Test Connection

```bash
npm run test:firebase
```

## 3. Run Locally

```bash
npm run dev
```

## 4. Deploy to Production

```bash
# Set environment variables in Vercel dashboard first
deploy.bat
```

## API Endpoints Ready

- ✅ `/api/current` - Get current word
- ✅ `/api/archive` - Get archived words  
- ✅ `/api/submissions` - Get submissions
- ✅ `/api/generate` - Generate new word
- ✅ `/api/admin/login` - Admin login
- ✅ `/api/admin/verify` - Admin verification

## Environment Variables for Vercel

Copy from `PRODUCTION_READY.md` to your Vercel dashboard.

**Everything is ready - just get your Firebase service account key!**