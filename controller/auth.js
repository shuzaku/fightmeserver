const Account = require("../models/accounts");
const { generateToken } = require("../middleware/auth");
const bcrypt = require('bcryptjs');

/**
 * Login user and return JWT token
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Email and password are required'
      });
    }

    // Find account by email
    const account = await Account.findOne({ Email: email });
    if (!account) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Check if account has a password
    if (!account.Password) {
      return res.status(401).json({
        error: 'Password reset required',
        message: 'Please reset your password to continue',
        needsPasswordReset: true
      });
    }

    // Verify password using bcrypt
    const isValidPassword = await bcrypt.compare(password, account.Password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Generate JWT token
    const token = generateToken(account);

    res.json({
      success: true,
      token,
      user: {
        id: account._id,
        displayName: account.DisplayName,
        email: account.Email,
        role: account.AccountType,
        isEmailVerified: account.IsEmailVerified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred during login'
    });
  }
}

/**
 * Register new user
 */
async function register(req, res) {
  try {
    const { displayName, email, password } = req.body;

    if (!displayName || !email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Display name, email, and password are required'
      });
    }

    // Check if account already exists
    const existingAccount = await Account.findOne({ Email: email });
    if (existingAccount) {
      return res.status(409).json({
        error: 'Account exists',
        message: 'An account with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new account
    const newAccount = new Account({
      DisplayName: displayName,
      Email: email,
      Password: hashedPassword, // Add password field to model
      IsEmailVerified: false,
      AccountType: 'user',
      Uid: generateUid(), // Generate unique UID
      FavoriteVideos: [],
      FollowedPlayers: [],
      FollowedCharacters: [],
      Collections: []
    });

    await newAccount.save();

    // Generate JWT token
    const token = generateToken(newAccount);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: newAccount._id,
        displayName: newAccount.DisplayName,
        email: newAccount.Email,
        role: newAccount.AccountType,
        isEmailVerified: newAccount.IsEmailVerified
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred during registration'
    });
  }
}

/**
 * Get current user profile
 */
async function getProfile(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Not authenticated',
        message: 'You must be logged in to view your profile'
      });
    }

    res.json({
      success: true,
      user: {
        id: req.user._id,
        displayName: req.user.DisplayName,
        email: req.user.Email,
        role: req.user.AccountType,
        isEmailVerified: req.user.IsEmailVerified,
        favoriteVideos: req.user.FavoriteVideos,
        followedPlayers: req.user.FollowedPlayers,
        followedCharacters: req.user.FollowedCharacters,
        collections: req.user.Collections
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while fetching profile'
    });
  }
}

/**
 * Update user profile
 */
async function updateProfile(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Not authenticated',
        message: 'You must be logged in to update your profile'
      });
    }

    const { displayName, email } = req.body;
    const updates = {};

    if (displayName) updates.DisplayName = displayName;
    if (email) updates.Email = email;

    const updatedAccount = await Account.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedAccount._id,
        displayName: updatedAccount.DisplayName,
        email: updatedAccount.Email,
        role: updatedAccount.AccountType,
        isEmailVerified: updatedAccount.IsEmailVerified
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while updating profile'
    });
  }
}

/**
 * Reset password for existing user
 */
async function resetPassword(req, res) {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email and new password are required'
      });
    }

    // Find account by email
    const account = await Account.findOne({ Email: email });
    if (!account) {
      return res.status(404).json({
        error: 'Account not found',
        message: 'No account found with this email address'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update account
    account.Password = hashedPassword;
    account.NeedsPasswordReset = false;
    await account.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred during password reset'
    });
  }
}

/**
 * Check if user needs password reset
 */
async function checkPasswordReset(req, res) {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        error: 'Email required',
        message: 'Email parameter is required'
      });
    }

    const account = await Account.findOne({ Email: email });
    if (!account) {
      return res.status(404).json({
        error: 'Account not found',
        message: 'No account found with this email address'
      });
    }

    res.json({
      needsPasswordReset: account.NeedsPasswordReset || !account.Password,
      hasPassword: !!account.Password
    });
  } catch (error) {
    console.error('Password reset check error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while checking password status'
    });
  }
}

/**
 * Generate unique UID
 */
function generateUid() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

module.exports = {
  login,
  register,
  getProfile,
  updateProfile,
  resetPassword,
  checkPasswordReset
};

