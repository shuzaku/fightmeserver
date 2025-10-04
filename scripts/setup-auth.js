/**
 * Setup script for authorization system
 * Run this script to set up the initial admin account and configure the system
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Account = require('../models/accounts');
require('dotenv').config();

async function setupAuth() {
  try {
    // Connect to MongoDB
    const connectionString = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.vdh52.mongodb.net/Fighters-Edge?retryWrites=true&w=majority`;
    await mongoose.connect(connectionString);
    console.log('Connected to MongoDB');

    // Check if admin account exists
    const existingAdmin = await Account.findOne({ AccountType: 'admin' });
    if (existingAdmin) {
      console.log('Admin account already exists');
      return;
    }

    // Create admin account
    const adminPassword = await bcrypt.hash('admin123', 10); // Change this password!
    const adminAccount = new Account({
      DisplayName: 'System Administrator',
      Email: 'admin@fighters-edge.com',
      Password: adminPassword,
      IsEmailVerified: true,
      AccountType: 'admin',
      Uid: 'admin_' + Date.now(),
      FavoriteVideos: [],
      FollowedPlayers: [],
      FollowedCharacters: [],
      Collections: []
    });

    await adminAccount.save();
    console.log('Admin account created successfully');
    console.log('Email: admin@fighters-edge.com');
    console.log('Password: admin123');
    console.log('⚠️  IMPORTANT: Change the admin password immediately!');

  } catch (error) {
    console.error('Setup error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupAuth();
}

module.exports = setupAuth;
