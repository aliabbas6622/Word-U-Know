# 🚀 Render Deployment Guide

## ✅ Pre-Deployment Checklist

### 1. **Service Configuration**
- **Service Type**: Web Service ✅
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment**: Node.js

### 2. **Environment Variables** (Add to Render Dashboard)

#### Frontend (Vite) Variables:
```
VITE_FIREBASE_API_KEY=AIzaSyBJZR-nq9s31-5LSGuc_t_-JwH6cFlpyig
VITE_FIREBASE_AUTH_DOMAIN=imposing-ace-451518-s9.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=imposing-ace-451518-s9
VITE_FIREBASE_STORAGE_BUCKET=imposing-ace-451518-s9.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=603536810725
VITE_FIREBASE_APP_ID=1:603536810725:web:b5f7cceab0e4a3bc92aa0c
VITE_FIREBASE_MEASUREMENT_ID=G-EVZD3NZSB1
```

#### Backend Variables:
```
GEMINI_API_KEY=AIzaSyDaccjnON5RhwckcY7dSy11u1idXtF4CsU
OPENAI_API_KEY=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
CLIPDROP_API_KEY=543eb9917c1808e62dd68d72031a704a8de6787fcb2c30e4f3f3844e83ec728d98abebe114b266798cdf6b7a2876a90b
```

#### Firebase Admin SDK:
```
FIREBASE_PROJECT_ID=imposing-ace-451518-s9
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@imposing-ace-451518-s9.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDcOlCiaQvbItRr\nTbq/N6XztE+brFfO5jGrpxy89r+sROWQsiC35CxnffLra4qeGKRl8LfbLZ302g0G\nZ67HHtzBVHY+MuhbKrBeIu056FIBxoFkI6KE5BqYKcTXt/6AvCnbwiei02mcUqqe\nJREiD/01aCxjkPFnN+WOjTXZOSLGSVQsOp4fsh3YX2Ajr1ms+JiwPQHlAsHgw9fA\nef3AEaexhY2VosfFwBUz9K4xscVzr61MLEo0V7y+j+IODeRYIufzMZhbJY0/QAw/\nRboBvIzuGZ8LlOiUu793zBesnh2w633y98stOStx2cy14S37iQAA/E64UlKSh/sV\n57VqvaMnAgMBAAECggEAFcGzFqBvGeqSdrlaoipyvCVLmhMIJ7oJHS6owahU3kV+\nMnHOlqw1kNHaDlT1AFJp52JFH6Odj8N89u2GUEilwXnBJrrrxpnsi5hCvG5Nr7w3\nKzf0BdHtKKwztKYKQBiWwA2p0cW2EMn/7hi2XRmcR8rvW7TFjI9yn8cmkzu4SkNk\nXe9i7PaLupBIEHki+v8qIiIAw5kS/v4KEcxur2tp0KnRlj6ZjvV/dJ0t7DgSc7S1\nZ5W2k6/hZRlvaI1Hz0qDaDqdd3Ockc7k9qEYaUUH+AHYrtHoAMzKyftWJDnUpYaq\nbAfLZFzKu4vqRpP142BCIXok9Xp0O8BgtRqydBVc4QKBgQDzbu8DiR2zmq994+ii\nLLPmJQ7syDExgUlAAnXtne8p4as3nQbjYc5b8Ia+GOfTK5WXqMDWl722DY+0FjW4\nhf2rqc5tuVhP7bxOHovUIBAroWv7mzpFFdj88Hf6m8hASuYJf6hn5G3Hil0hGzL6\nG+NnJFs8u+fCi5Zp0elrwDlfIQKBgQDnmLYH0popEz2g8G6LhxA+Kp5cEAituoSI\n15kWwxjasA7BcAgFdouiromJAEExBSyvAFpsYUEUCXAi0YXf6+mfG02M4rkNvEsI\nL1BidPD96jY9nhQHFoxr3dEYAJDff/JwNkCQQS0ClWWL7uQJjYRdG6UG2chr61Ia\n9qM5uHEhRwKBgFLD4sum8MxByWzZ8hxBaqDS9LIYlnEobckvjPzO96ObsGTmJJNm\ni4zCyG0VdqxbYy7/FyFe0gd1sOgfrQAhvk+BGkg//gCe6aj9xbjHdff/mAEhk7wt\nY2sMLx6rnHgPfwq3toAsMA7pwiQhZUGX/cbxm3uYv4FriCZOUjhqUJdBAoGAb1Ka\nfRwgegoDn66ylGLxzdASmtIiOc/kERsBPU2+TrA+B4Fgea/H4wTem3oB3BxOpDgZ\nPutoqsb2neX04fO2MoKfPk9lAFM4BdEoZIsto//G3stzeQy/psHS1iS/fo8z6/hI\nBI8voYRKcX79IhJiQ5ccNjTNAAL3Tnqrbv1Xc9UCgYEAmonjdU99/LqzJdx1HC2z\ntmegqMCE0TtZfcouETQbPN97G9nbLfFIwqUrbmY34ykNS5ihcHEbYM5zJKcWt3FN\n1Jk0OLyH7Bi123YjDABhrBf6mQDrQd8la4dvzXbqVquDFNDKicskmDTAfjGw2c6V\nJPT/ZbdiNCP6PHGsenBUsgs=\n-----END PRIVATE KEY-----\n
```

#### Admin Credentials:
```
ADMIN_USERNAME=guy789
ADMIN_PASSWORD=789guy
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

### 3. **Deployment Steps**

1. **Connect Repository**: Link your GitHub repo to Render
2. **Configure Service**:
   - Name: `word-u-know`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
3. **Add Environment Variables**: Copy all variables above
4. **Deploy**: Click "Manual Deploy → Clear Cache & Deploy"

### 4. **Post-Deployment Verification**

✅ **Check these endpoints**:
- `https://your-app.onrender.com/` - Frontend loads
- `https://your-app.onrender.com/api/current` - API responds
- `https://your-app.onrender.com/api/archive` - Firebase connection

### 5. **Troubleshooting**

**If deployment fails**:
1. Check build logs for missing dependencies
2. Verify all environment variables are set
3. Ensure FIREBASE_PRIVATE_KEY has proper `\n` formatting
4. Try "Clear Cache & Deploy" again

**Common Issues**:
- **Static files not loading**: Server now serves from `/dist`
- **API not working**: Check environment variables
- **Firebase errors**: Verify FIREBASE_PRIVATE_KEY formatting

## 🎉 Success Indicators

- ✅ Build completes without errors
- ✅ Server starts on assigned port
- ✅ Frontend loads at root URL
- ✅ API endpoints respond correctly
- ✅ Firebase connection established
- ✅ Environment variables accessible

Your app should now be live on Render! 🚀