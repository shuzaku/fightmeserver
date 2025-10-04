/**
 * Migration script for existing users
 * This script helps existing users transition to the new authentication system
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Account = require('../models/accounts');
require('dotenv').config();

async function migrateExistingUsers() {
  try {
    // Connect to MongoDB
    const connectionString = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.vdh52.mongodb.net/Fighters-Edge?retryWrites=true&w=majority`;
    await mongoose.connect(connectionString);
    console.log('Connected to MongoDB');

    // Find all accounts without passwords
    const accountsWithoutPasswords = await Account.find({ 
      $or: [
        { Password: { $exists: false } },
        { Password: null },
        { Password: '' }
      ]
    });

    console.log(`Found ${accountsWithoutPasswords.length} accounts without passwords`);

    if (accountsWithoutPasswords.length === 0) {
      console.log('No accounts need migration');
      return;
    }

    // Create a temporary password for each account
    const tempPassword = 'temp_password_' + Date.now();
    const hashedTempPassword = await bcrypt.hash(tempPassword, 10);

    // Update accounts with temporary passwords
    const updatePromises = accountsWithoutPasswords.map(async (account) => {
      // Set default AccountType if not set
      if (!account.AccountType) {
        account.AccountType = 'user';
      }

      // Set temporary password
      account.Password = hashedTempPassword;
      
      // Mark as needing password reset
      account.NeedsPasswordReset = true;
      
      return account.save();
    });

    await Promise.all(updatePromises);

    console.log('✅ Migration completed successfully!');
    console.log('📧 All existing users need to reset their passwords');
    console.log('🔑 Temporary password for testing:', tempPassword);
    console.log('⚠️  Users should be notified to reset their passwords');

    // Generate password reset instructions
    console.log('\n📋 Next Steps:');
    console.log('1. Notify users to reset their passwords');
    console.log('2. Implement password reset functionality');
    console.log('3. Consider sending password reset emails');

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateExistingUsers();
}

module.exports = migrateExistingUsers;
