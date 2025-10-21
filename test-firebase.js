import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { db } from './lib/firebaseAdmin.js';

async function testFirebase() {
  try {
    console.log('🔥 Testing Firebase Admin connection...');
    console.log('Environment check:');
    console.log('- PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✅' : '❌');
    console.log('- CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? '✅' : '❌');
    console.log('- PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? '✅' : '❌');
    
    // Test connection
    const testDoc = await db.collection('_test').doc('connection').get();
    console.log('✅ Firebase Admin connected successfully');
    
    // Test collections
    const collections = ['archive', 'submissions', 'words'];
    for (const collection of collections) {
      try {
        const snapshot = await db.collection(collection).limit(1).get();
        console.log(`✅ Collection '${collection}' accessible (${snapshot.size} docs)`);
      } catch (error) {
        console.log(`❌ Collection '${collection}' error:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Firebase connection failed:', error.message);
    process.exit(1);
  }
}

testFirebase();