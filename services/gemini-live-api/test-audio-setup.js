#!/usr/bin/env node

/**
 * Test script to verify the audio testing setup
 * Run this to check if everything is configured correctly
 */

const http = require('http');

console.log('🧪 Testing Gemini Live Audio Testing Setup...\n');

// Test 1: Check if server is running
function testServerConnection() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:8082/api/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.status === 'ok') {
            console.log('✅ Server is running on port 8082');
            resolve(true);
          } else {
            console.log('❌ Server health check failed');
            reject(new Error('Health check failed'));
          }
        } catch (e) {
          console.log('❌ Invalid JSON response from server');
          reject(e);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Server not running on port 8082');
      console.log('   Start the server with: npm run dev');
      reject(err);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ Server connection timeout');
      reject(new Error('Connection timeout'));
    });
  });
}

// Test 2: Check Gemini connection
function testGeminiConnection() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:8082/api/test/gemini-connection', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.success) {
            console.log('✅ Gemini Live API connection successful');
            console.log('   Project ID:', response.configuration?.projectId);
            console.log('   Model:', response.configuration?.model);
            resolve(true);
          } else {
            console.log('❌ Gemini connection failed:', response.error);
            reject(new Error(response.error));
          }
        } catch (e) {
          console.log('❌ Invalid response from Gemini test');
          reject(e);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Failed to test Gemini connection');
      reject(err);
    });
  });
}

// Test 3: Check if test interfaces are accessible
function testTestInterfaces() {
  return new Promise((resolve, reject) => {
    const interfaces = [
      { name: 'Audio Test Interface', path: '/test-audio-interface.html' },
      { name: 'Text Test Interface', path: '/test-interface.html' }
    ];
    
    let completed = 0;
    let success = true;
    
    interfaces.forEach(interface => {
      const req = http.get(`http://localhost:8082${interface.path}`, (res) => {
        if (res.statusCode === 200) {
          console.log(`✅ ${interface.name} is accessible`);
        } else {
          console.log(`❌ ${interface.name} returned status ${res.statusCode}`);
          success = false;
        }
        completed++;
        
        if (completed === interfaces.length) {
          if (success) {
            resolve(true);
          } else {
            reject(new Error('Some interfaces are not accessible'));
          }
        }
      });
      
      req.on('error', (err) => {
        console.log(`❌ ${interface.name} is not accessible`);
        success = false;
        completed++;
        
        if (completed === interfaces.length) {
          reject(err);
        }
      });
    });
  });
}

// Main test function
async function runTests() {
  try {
    await testServerConnection();
    await testGeminiConnection();
    await testTestInterfaces();
    
    console.log('\n🎉 All tests passed! Audio testing setup is ready.');
    console.log('\n📱 Open your browser and go to:');
    console.log('   • Audio Test: http://localhost:8082/test-audio-interface.html');
    console.log('   • Text Test:  http://localhost:8082/test-interface.html');
    console.log('\n🎤 Start testing with real-time microphone input!');
    
  } catch (error) {
    console.log('\n❌ Setup test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure the server is running: npm run dev');
    console.log('   2. Check Google Cloud credentials are set up');
    console.log('   3. Verify environment variables are configured');
    console.log('   4. Check the server logs for detailed errors');
    
    process.exit(1);
  }
}

// Run tests
runTests(); 