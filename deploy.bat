@echo off
echo 🚀 Deploying to Vercel...
echo.
echo Make sure you have set all environment variables in Vercel dashboard:
echo - FIREBASE_PROJECT_ID
echo - FIREBASE_CLIENT_EMAIL  
echo - FIREBASE_PRIVATE_KEY
echo - GEMINI_API_KEY
echo - CLIPDROP_API_KEY
echo.
pause
vercel --prod