# Authorization Strategy for Fighters Edge

## Overview

This document outlines the comprehensive authorization strategy implemented for the Fighters Edge application, supporting three distinct user roles: **Admin**, **User** (registered), and **Unregistered User**.

## User Roles & Capabilities

### 1. Admin Role
**Full system access with complete CRUD capabilities**

**Permissions:**
- ✅ All read operations (public and private content)
- ✅ Create, update, delete any content
- ✅ User management and account administration
- ✅ System configuration and maintenance
- ✅ Content moderation and approval
- ✅ Bulk operations and data export
- ✅ Tournament and event management
- ✅ Player, character, and game management

**Typical Use Cases:**
- Managing the platform
- Moderating user-generated content
- Creating and managing tournaments
- User account administration
- System maintenance

### 2. User Role (Registered)
**Authenticated users with content creation and personalization capabilities**

**Permissions:**
- ✅ Read all public content
- ✅ Create personal content (videos, combos, notes, collections)
- ✅ Update/delete own content
- ✅ Follow players, characters, and games
- ✅ Create and manage personal collections
- ✅ Create montages and articles
- ❌ Cannot manage other users' content
- ❌ Cannot access admin-only features

**Typical Use Cases:**
- Creating and sharing fighting game content
- Building personal collections
- Following favorite players and characters
- Contributing to the community

### 3. Unregistered User
**Read-only access to public content**

**Permissions:**
- ✅ Read public content (videos, characters, players, etc.)
- ✅ Search and browse content
- ❌ Cannot create any content
- ❌ Cannot save favorites or follow anything
- ❌ Cannot access personal features

**Typical Use Cases:**
- Browsing content before deciding to register
- Researching fighting game information
- Viewing public tournaments and matches

## Implementation Details

### Authentication Flow

1. **Registration/Login**: Users authenticate via `/auth/register` or `/auth/login`
2. **JWT Token**: Successful authentication returns a JWT token
3. **Token Validation**: All protected routes validate the JWT token
4. **Role Assignment**: User role is determined from the JWT payload

### Middleware Architecture

#### 1. `authenticateToken` Middleware
- Applied to all routes globally
- Validates JWT tokens from Authorization header
- Sets `req.user` and `req.role` for downstream middleware
- Allows unregistered users to access public content

#### 2. `requireRole` Middleware
- Restricts access to specific roles
- Usage: `requireRole(['admin', 'user'])`
- Returns 401 for unauthenticated users
- Returns 403 for insufficient permissions

#### 3. `requirePermission` Middleware
- Granular permission checking
- Usage: `requirePermission('CREATE_VIDEOS')`
- Based on predefined permission matrix

#### 4. `requireAdmin` Middleware
- Admin-only access
- Shorthand for `requireRole(['admin'])`

### Route Protection Examples

```javascript
// Public routes (no authentication required)
app.post('/auth/login', authController.login);
app.post('/auth/register', authController.register);

// Protected routes (authentication required)
app.get('/auth/profile', authController.getProfile);
app.put('/auth/profile', authController.updateProfile);

// Role-based routes
app.post('/characters', requireRole(['admin']), characterController.addCharacter);
app.post('/combos', requireRole(['admin', 'user']), comboController.addCombo);
app.get('/characters', characterController.getCharacters); // Public read

// Permission-based routes
app.post('/videos', requirePermission('CREATE_VIDEOS'), videoController.addVideo);
```

### Permission Matrix

| Resource | Action | Admin | User | Unregistered |
|----------|--------|-------|------|--------------|
| Characters | Read | ✅ | ✅ | ✅ |
| Characters | Create | ✅ | ❌ | ❌ |
| Characters | Update | ✅ | ❌ | ❌ |
| Characters | Delete | ✅ | ❌ | ❌ |
| Combos | Read | ✅ | ✅ | ✅ |
| Combos | Create | ✅ | ✅ | ❌ |
| Combos | Update | ✅ | ✅* | ❌ |
| Combos | Delete | ✅ | ✅* | ❌ |
| Videos | Read | ✅ | ✅ | ✅ |
| Videos | Create | ✅ | ✅ | ❌ |
| Videos | Update | ✅ | ✅* | ❌ |
| Videos | Delete | ✅ | ✅* | ❌ |
| Users | Manage | ✅ | ❌ | ❌ |

*Users can only update/delete their own content

## Security Considerations

### 1. JWT Security
- Tokens expire after 24 hours
- Secret key stored in environment variables
- Tokens include user ID, role, and email

### 2. Password Security
- Passwords hashed using bcrypt with salt rounds of 10
- Password field required for new accounts
- Password validation on login

### 3. Input Validation
- All input validated before processing
- SQL injection prevention through Mongoose ODM
- XSS protection through proper data sanitization

### 4. Error Handling
- Consistent error responses
- No sensitive information leaked in error messages
- Proper HTTP status codes

## Environment Variables

Add these to your `.env` file:

```env
JWT_SECRET=your-super-secret-jwt-key-here
DB_USERNAME=your-db-username
DB_PASSWORD=your-db-password
SMTP_USERNAME=your-smtp-username
SMTP_PASSWORD=your-smtp-password
```

## Usage Examples

### Frontend Integration

```javascript
// Login
const response = await fetch('/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { token, user } = await response.json();

// Store token for future requests
localStorage.setItem('authToken', token);

// Make authenticated requests
const authResponse = await fetch('/auth/profile', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Backend Route Protection

```javascript
// Admin-only route
app.delete('/users/:id', requireAdmin, userController.deleteUser);

// User and admin route
app.post('/videos', requireRole(['admin', 'user']), videoController.addVideo);

// Permission-based route
app.put('/videos/:id', requirePermission('UPDATE_OWN_CONTENT'), videoController.updateVideo);
```

## Migration Guide

### For Existing Accounts
1. Add password field to existing accounts (set temporary password)
2. Update AccountType enum to only allow 'admin' or 'user'
3. Migrate existing Uid values to new format if needed

### For New Features
1. Define permissions in `middleware/permissions.js`
2. Apply appropriate middleware to routes
3. Test with different user roles
4. Update frontend to handle authentication states

## Monitoring & Logging

- All authentication attempts logged
- Failed authorization attempts tracked
- User role changes audited
- Token usage monitored for security

## Future Enhancements

1. **Role Hierarchy**: Support for sub-roles (moderator, editor, etc.)
2. **Resource Ownership**: More granular ownership checks
3. **API Rate Limiting**: Prevent abuse of authenticated endpoints
4. **Two-Factor Authentication**: Enhanced security for admin accounts
5. **Session Management**: Token refresh and revocation
6. **Audit Trail**: Comprehensive logging of all actions

This authorization strategy provides a solid foundation for secure, role-based access control while maintaining flexibility for future enhancements.

