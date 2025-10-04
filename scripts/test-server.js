/**
 * Test server to verify authorization endpoints
 * This runs a minimal server to test the auth system
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Import our auth controller
const authController = require('../controller/auth');

const app = express();
const PORT = 3001; // Different port to avoid conflicts

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Test routes
app.post('/auth/login', (req, res) => authController.login(req, res));
app.post('/auth/register', (req, res) => authController.register(req, res));
app.get('/auth/profile', (req, res) => authController.getProfile(req, res));
app.put('/auth/profile', (req, res) => authController.updateProfile(req, res));
app.post('/auth/reset-password', (req, res) => authController.resetPassword(req, res));
app.get('/auth/check-password-reset', (req, res) => authController.checkPasswordReset(req, res));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Test server running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🧪 Test server running on http://localhost:${PORT}`);
  console.log('\n📋 Available endpoints:');
  console.log(`  POST http://localhost:${PORT}/auth/register`);
  console.log(`  POST http://localhost:${PORT}/auth/login`);
  console.log(`  GET  http://localhost:${PORT}/auth/profile`);
  console.log(`  PUT  http://localhost:${PORT}/auth/profile`);
  console.log(`  POST http://localhost:${PORT}/auth/reset-password`);
  console.log(`  GET  http://localhost:${PORT}/auth/check-password-reset`);
  console.log(`  GET  http://localhost:${PORT}/health`);
  
  console.log('\n🔧 Test commands:');
  console.log('  # Test health check');
  console.log('  curl http://localhost:3001/health');
  console.log('');
  console.log('  # Test registration');
  console.log('  curl -X POST http://localhost:3001/auth/register \\');
  console.log('    -H "Content-Type: application/json" \\');
  console.log('    -d \'{"displayName":"Test User","email":"test@example.com","password":"password123"}\'');
  console.log('');
  console.log('  # Test login');
  console.log('  curl -X POST http://localhost:3001/auth/login \\');
  console.log('    -H "Content-Type: application/json" \\');
  console.log('    -d \'{"email":"test@example.com","password":"password123"}\'');
  console.log('');
  console.log('  # Test password reset check');
  console.log('  curl "http://localhost:3001/auth/check-password-reset?email=test@example.com"');
});

module.exports = app;
