# Migration Guide for Existing Users

## 🚀 **How to Migrate Existing Users to New Authentication System**

### **The Problem**
Your existing users were created without passwords, but the new authorization system requires them. This guide shows you how to migrate them safely.

### **Step-by-Step Migration Process**

## **1. Run the Migration Script**

```bash
# Install new dependencies first
npm install

# Run the migration script
node scripts/migrate-existing-users.js
```

This script will:
- ✅ Find all existing users without passwords
- ✅ Set them a temporary password
- ✅ Mark them as needing password reset
- ✅ Set default AccountType to 'user' if not set

## **2. Test the Migration**

After running the migration, test with an existing user:

```bash
# Check if user needs password reset
curl "http://localhost:8081/auth/check-password-reset?email=existing-user@example.com"

# Response will show:
# {
#   "needsPasswordReset": true,
#   "hasPassword": true
# }
```

## **3. User Experience Flow**

### **For Existing Users:**
1. **Try to login** with their email and any password
2. **Get redirected** to password reset page
3. **Set new password** using the reset endpoint
4. **Login normally** with new password

### **For New Users:**
1. **Register** normally with email/password
2. **Login** immediately with credentials

## **4. Frontend Integration**

### **Login Flow with Password Reset Detection:**

```javascript
async function login(email, password) {
  try {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.needsPasswordReset) {
      // Redirect to password reset page
      window.location.href = '/reset-password?email=' + email;
      return;
    }
    
    if (data.success) {
      // Store token and redirect to dashboard
      localStorage.setItem('authToken', data.token);
      window.location.href = '/dashboard';
    }
  } catch (error) {
    console.error('Login error:', error);
  }
}
```

### **Password Reset Flow:**

```javascript
async function resetPassword(email, newPassword) {
  try {
    const response = await fetch('/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, newPassword })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Redirect to login page
      window.location.href = '/login?message=Password reset successfully';
    }
  } catch (error) {
    console.error('Password reset error:', error);
  }
}
```

## **5. API Endpoints for Migration**

### **Check if User Needs Password Reset:**
```http
GET /auth/check-password-reset?email=user@example.com
```

**Response:**
```json
{
  "needsPasswordReset": true,
  "hasPassword": true
}
```

### **Reset Password:**
```http
POST /auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com",
  "newPassword": "newSecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

## **6. User Communication Strategy**

### **Email Template for Existing Users:**

```html
Subject: Action Required - Set Your New Password

Hi [DisplayName],

We've upgraded our security system! To continue using your account, 
please set a new password by clicking the link below:

[Reset Password Link]

This is a one-time setup. After setting your password, you can 
login normally with your email and new password.

If you have any questions, please contact support.

Best regards,
The Fighters Edge Team
```

## **7. Monitoring Migration Progress**

### **Check Migration Status:**

```javascript
// Count users who still need password reset
const usersNeedingReset = await Account.countDocuments({ 
  NeedsPasswordReset: true 
});

// Count users with passwords
const usersWithPasswords = await Account.countDocuments({ 
  Password: { $exists: true, $ne: null, $ne: '' } 
});

console.log(`Users needing reset: ${usersNeedingReset}`);
console.log(`Users with passwords: ${usersWithPasswords}`);
```

## **8. Rollback Plan (If Needed)**

If you need to rollback the migration:

```javascript
// Remove passwords and reset flags
await Account.updateMany(
  { NeedsPasswordReset: true },
  { 
    $unset: { Password: 1, NeedsPasswordReset: 1 }
  }
);
```

## **9. Security Considerations**

- ✅ **Temporary passwords are hashed** using bcrypt
- ✅ **Users must reset passwords** before accessing protected content
- ✅ **No sensitive data exposed** during migration
- ✅ **Backward compatibility maintained** for existing functionality

## **10. Testing Checklist**

- [ ] Migration script runs without errors
- [ ] Existing users can check password reset status
- [ ] Password reset functionality works
- [ ] Users can login after password reset
- [ ] New user registration still works
- [ ] All existing functionality remains intact
- [ ] Admin users can still access admin features

## **11. Production Deployment**

1. **Backup your database** before running migration
2. **Test migration on staging** environment first
3. **Run migration during low-traffic** hours
4. **Monitor error logs** after deployment
5. **Send user notifications** about password reset requirement

## **12. Support for Users**

Create a help page explaining:
- Why password reset is required
- How to reset password
- What to do if they can't access their email
- Contact information for support

This migration strategy ensures a smooth transition for all existing users while maintaining security and functionality.
