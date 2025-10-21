#!/usr/bin/env node

console.log(`
🔥 Firebase Service Account Setup

1. Go to: https://console.firebase.google.com/project/imposing-ace-451518-s9/settings/serviceaccounts/adminsdk

2. Click "Generate new private key"

3. Download the JSON file

4. Copy the values to your .env.local:
   - project_id → FIREBASE_PROJECT_ID
   - client_email → FIREBASE_CLIENT_EMAIL  
   - private_key → FIREBASE_PRIVATE_KEY (keep the \\n characters!)

5. For Vercel deployment, set these same variables in your Vercel dashboard.

⚠️  IMPORTANT: Keep the private key format exactly as:
"-----BEGIN PRIVATE KEY-----\\nYOUR_KEY_HERE\\n-----END PRIVATE KEY-----\\n"
`);