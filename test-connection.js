// Backend-Frontend Connection Test
const fetch = require('node-fetch');

const BACKEND_URL = 'http://localhost:4000';
const FRONTEND_URL = 'http://localhost:3000';

async function testConnection() {
  console.log('🔍 Testing Backend-Frontend Connection...\n');

  // Test 1: Backend API endpoints
  console.log('1️⃣ Testing Backend API Endpoints:');
  const endpoints = [
    '/api/current',
    '/api/archive',
    '/api/submissions'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${BACKEND_URL}${endpoint}`);
      console.log(`   ✅ ${endpoint}: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.log(`   ❌ ${endpoint}: ${error.message}`);
    }
  }

  // Test 2: Frontend proxy to backend
  console.log('\n2️⃣ Testing Frontend Proxy (if running):');
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${FRONTEND_URL}${endpoint}`);
      console.log(`   ✅ ${endpoint}: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.log(`   ❌ ${endpoint}: ${error.message}`);
    }
  }

  // Test 3: Environment variables
  console.log('\n3️⃣ Checking Environment Variables:');
  const requiredVars = [
    'GEMINI_API_KEY',
    'CLIPDROP_API_KEY',
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_PROJECT_ID'
  ];

  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      console.log(`   ✅ ${varName}: Set (${value.substring(0, 10)}...)`);
    } else {
      console.log(`   ❌ ${varName}: Not set`);
    }
  }

  console.log('\n✨ Connection test complete!\n');
}

testConnection();
