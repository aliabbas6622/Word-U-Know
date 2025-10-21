# Production Deployment Checklist

## ✅ Pre-Deployment

- [ ] Update `.env.local` with production credentials
- [ ] Generate secure JWT_SECRET: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Change ADMIN_USERNAME and ADMIN_PASSWORD
- [ ] Verify all API keys are valid
- [ ] Test locally with production environment variables
- [ ] Run `npm run build` successfully
- [ ] Review Firebase security rules
- [ ] Check `.gitignore` includes `.env.local`

## 🔒 Security

- [ ] No hardcoded credentials in code
- [ ] All secrets in environment variables
- [ ] Security headers configured in `vercel.json`
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] HTTPS enforced
- [ ] Admin routes protected

## 🚀 Vercel Setup

- [ ] Install Vercel CLI: `npm i -g vercel`
- [ ] Login: `vercel login`
- [ ] Add all environment variables:
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
- [ ] Deploy: `vercel --prod`

## 🧪 Post-Deployment Testing

- [ ] Homepage loads correctly
- [ ] Word generation works
- [ ] Submissions can be created
- [ ] Archive displays past words
- [ ] Admin login works with new credentials
- [ ] Admin panel functions properly
- [ ] Images load correctly
- [ ] Mobile responsive
- [ ] All API endpoints respond

## 📊 Monitoring

- [ ] Enable Vercel Analytics
- [ ] Set up error tracking
- [ ] Configure uptime monitoring
- [ ] Review logs: `vercel logs`
- [ ] Monitor API usage
- [ ] Check Firebase quotas

## 🔄 Maintenance

- [ ] Document deployment date
- [ ] Save deployment URL
- [ ] Schedule dependency updates
- [ ] Plan API key rotation
- [ ] Set calendar reminder for security review

## 🆘 Emergency Contacts

- Vercel Support: https://vercel.com/support
- Firebase Console: https://console.firebase.google.com
- API Status Pages:
  - Gemini: https://status.cloud.google.com
  - ClipDrop: https://clipdrop.co

## 📝 Deployment Notes

Date: _______________
URL: _______________
Version: _______________
Deployed by: _______________
Issues: _______________
