/*
 * Basic test script to verify API endpoints
 * Run this with: node test/api-test.js
 * Ensure the server is running on the specified port
 */

const fetch = require('node-fetch');

// API base URL (adjust if server is running on a different port or domain)
const API_BASE_URL = 'http://localhost:3000';

async function testEndpoint(endpoint, description) {
  try {
    console.log(`Testing ${description} (${endpoint})...`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    console.log(`✅ Success: ${description} returned ${Array.isArray(data) ? data.length : 'data'} item(s)`);
    return data;
  } catch (error) {
    console.error(`❌ Error testing ${description}:`, error.message);
    return null;
  }
}

async function testAdminEndpoint(endpoint, apiKey, description) {
  try {
    console.log(`Testing ${description} (${endpoint})...`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey || 'test-key', // Replace with actual key or set in env
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    console.log(`✅ Success: ${description} - ${data.message}`);
    return data;
  } catch (error) {
    console.error(`❌ Error testing ${description}:`, error.message);
    return null;
  }
}

async function runTests() {
  console.log('Starting API endpoint tests for Ultra Black Backend...\n');

  await testEndpoint('/api/products', 'Products List Endpoint');
  await testEndpoint('/api/products/test-id', 'Single Product Endpoint');
  await testEndpoint('/api/runclubs', 'Run Clubs List Endpoint');
  await testEndpoint('/api/wellness', 'Wellness Events List Endpoint');
  await testEndpoint('/api/scholarship', 'Scholarship Details Endpoint');
  await testEndpoint('/api/pages/about', 'Static Page (About) Endpoint');

  // Test admin endpoint (replace 'your-admin-key' with actual key or set in env)
  await testAdminEndpoint('/api/admin/refresh-cache', process.env.ADMIN_API_KEY || 'your-admin-key', 'Admin Cache Refresh Endpoint');

  console.log('\nAPI tests completed.');
}

// Add node-fetch dependency if not already in package.json
try {
  runTests();
} catch (err) {
  console.error('Test script error:', err);
  console.log('Ensure "node-fetch" is installed. Run: npm install node-fetch');
}
