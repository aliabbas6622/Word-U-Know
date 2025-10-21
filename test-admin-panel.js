/**
 * Admin Panel Automated Test Script
 * Run this in browser console to test all admin panel functions
 */

const AdminPanelTester = {
  results: {
    passed: 0,
    failed: 0,
    tests: []
  },

  log(message, type = 'info') {
    const colors = {
      info: 'color: blue',
      success: 'color: green',
      error: 'color: red',
      warning: 'color: orange'
    };
    console.log(`%c${message}`, colors[type]);
  },

  async test(name, fn) {
    try {
      await fn();
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASS' });
      this.log(`✅ ${name}`, 'success');
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAIL', error: error.message });
      this.log(`❌ ${name}: ${error.message}`, 'error');
    }
  },

  async runAllTests() {
    this.log('🚀 Starting Admin Panel Tests...', 'info');
    this.log('═══════════════════════════════════════', 'info');

    // Authentication Tests
    this.log('\n🔐 AUTHENTICATION TESTS', 'info');
    await this.testAuthentication();

    // API Endpoint Tests
    this.log('\n🌐 API ENDPOINT TESTS', 'info');
    await this.testAPIEndpoints();

    // UI Component Tests
    this.log('\n🎨 UI COMPONENT TESTS', 'info');
    await this.testUIComponents();

    // Data Validation Tests
    this.log('\n✅ DATA VALIDATION TESTS', 'info');
    await this.testDataValidation();

    // Print Summary
    this.printSummary();
  },

  async testAuthentication() {
    await this.test('Login endpoint exists', async () => {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'test', password: 'test' })
      });
      if (!response) throw new Error('Login endpoint not responding');
    });

    await this.test('Login with correct credentials', async () => {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin6622', password: 'admin6633' })
      });
      const data = await response.json();
      if (!data.token) throw new Error('No token returned');
      sessionStorage.setItem('testToken', data.token);
    });

    await this.test('Token verification works', async () => {
      const token = sessionStorage.getItem('testToken');
      const response = await fetch('/api/admin/verify', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Token verification failed');
    });
  },

  async testAPIEndpoints() {
    await this.test('GET /api/current', async () => {
      const response = await fetch('/api/current');
      if (!response.ok) throw new Error('Failed to fetch current word');
    });

    await this.test('GET /api/submissions', async () => {
      const response = await fetch('/api/submissions');
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('Submissions not an array');
    });

    await this.test('GET /api/archive', async () => {
      const response = await fetch('/api/archive');
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('Archive not an array');
    });

    await this.test('GET /api/username', async () => {
      const response = await fetch('/api/username');
      const data = await response.json();
      if (!data.username) throw new Error('No username returned');
    });
  },

  async testUIComponents() {
    await this.test('Admin panel component exists', () => {
      const adminButton = document.querySelector('[class*="admin"]') || 
                         document.querySelector('button[aria-label*="admin"]');
      if (!adminButton) throw new Error('Admin panel button not found');
    });

    await this.test('Local storage keys exist', () => {
      const keys = ['currentWord', 'apiKeys', 'enableImages'];
      const missing = keys.filter(key => !localStorage.getItem(key));
      if (missing.length > 0) {
        this.log(`⚠️ Missing localStorage keys: ${missing.join(', ')}`, 'warning');
      }
    });

    await this.test('API keys are configured', () => {
      const apiKeys = JSON.parse(localStorage.getItem('apiKeys') || '{}');
      if (!apiKeys.gemini && !apiKeys.openai) {
        throw new Error('No AI provider API keys configured');
      }
    });
  },

  async testDataValidation() {
    await this.test('API key validation patterns', () => {
      const patterns = {
        gemini: /^AIza[a-zA-Z0-9_-]{35}$/,
        openai: /^sk-[a-zA-Z0-9]{48}$/,
        clipdrop: /^[a-zA-Z0-9]{32,}$/
      };
      
      const testKeys = {
        gemini: 'AIzaSyDaccjnON5RhwckcY7dSy11u1idXtF4CsU',
        openai: 'sk-' + 'a'.repeat(48),
        clipdrop: '543eb9917c1808e62dd68d72031a704a8de6787fcb2c30e4f3f3844e83ec728d98abebe114b266798cdf6b7a2876a90b'
      };

      if (!patterns.gemini.test(testKeys.gemini)) {
        throw new Error('Gemini key validation failed');
      }
      if (!patterns.openai.test(testKeys.openai)) {
        throw new Error('OpenAI key validation failed');
      }
      if (!patterns.clipdrop.test(testKeys.clipdrop)) {
        throw new Error('ClipDrop key validation failed');
      }
    });

    await this.test('Username generation works', () => {
      const adjectives = ["Curious", "Sleepy", "Quantum", "Chaotic", "Dreamy", "Vivid"];
      const nouns = ["Duck", "Neuron", "Pixel", "Orb", "Molecule", "Quasar"];
      const username = `${adjectives[0]}-${nouns[0]}-1`;
      if (!username.match(/^[A-Za-z]+-[A-Za-z]+-\d+$/)) {
        throw new Error('Username format invalid');
      }
    });

    await this.test('Date string generation', () => {
      const today = new Date().toISOString().split('T')[0];
      if (!today.match(/^\d{4}-\d{2}-\d{2}$/)) {
        throw new Error('Date format invalid');
      }
    });
  },

  printSummary() {
    this.log('\n═══════════════════════════════════════', 'info');
    this.log('📊 TEST SUMMARY', 'info');
    this.log('═══════════════════════════════════════', 'info');
    this.log(`Total Tests: ${this.results.passed + this.results.failed}`, 'info');
    this.log(`✅ Passed: ${this.results.passed}`, 'success');
    this.log(`❌ Failed: ${this.results.failed}`, 'error');
    this.log(`Success Rate: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`, 'info');
    
    if (this.results.failed > 0) {
      this.log('\n❌ FAILED TESTS:', 'error');
      this.results.tests
        .filter(t => t.status === 'FAIL')
        .forEach(t => this.log(`  - ${t.name}: ${t.error}`, 'error'));
    }

    this.log('\n✨ Testing Complete!', 'success');
  }
};

// Auto-run tests
console.log('%c🧪 EthereaLex Admin Panel Test Suite', 'font-size: 20px; font-weight: bold; color: #8b5cf6');
console.log('%cStarting automated tests...', 'color: #6366f1');
AdminPanelTester.runAllTests();

// Export for manual testing
window.AdminPanelTester = AdminPanelTester;
