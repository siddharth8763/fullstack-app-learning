# Authentication & Security Interview Notes

## Authentication Fundamentals

### Authentication vs Authorization
- **Authentication**: Who you are (verify identity)
- **Authorization**: What you can do (permissions)
- **Identity**: User's digital identity
- **Principal**: Authenticated entity (user, service)

### Authentication Factors
1. **Something you know**: Password, PIN, security questions
2. **Something you have**: Phone, token, smart card
3. **Something you are**: Biometrics (fingerprint, face)

### Multi-Factor Authentication (MFA)
```javascript
// MFA implementation example
class AuthenticationService {
  async authenticate(username, password, totpCode) {
    // Step 1: Verify username/password
    const user = await this.verifyCredentials(username, password);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Step 2: Verify TOTP if enabled
    if (user.mfaEnabled) {
      const isValid = this.verifyTOTP(user.totpSecret, totpCode);
      if (!isValid) {
        throw new Error('Invalid MFA code');
      }
    }
    
    // Step 3: Generate tokens
    return this.generateTokens(user);
  }
  
  verifyTOTP(secret, code) {
    const speakeasy = require('speakeasy');
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: code,
      window: 2 // Allow 2 steps before/after
    });
  }
}
```

## JWT (JSON Web Tokens)

### JWT Structure
```javascript
// Header
const header = {
  alg: 'HS256', // Algorithm
  typ: 'JWT'    // Type
};

// Payload
const payload = {
  sub: '1234567890',    // Subject (user ID)
  name: 'John Doe',     // User name
  iat: 1516239022,      // Issued at
  exp: 1516242622,      // Expiration
  roles: ['user', 'admin'] // User roles
};

// Example JWT generation
const jwt = require('jsonwebtoken');

function generateTokens(user) {
  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      roles: user.roles
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '15m',
      issuer: 'your-app',
      audience: 'your-app-users'
    }
  );
  
  const refreshToken = jwt.sign(
    { sub: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
}
```

### Token Validation
```javascript
// Middleware for token validation
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    
    req.user = user;
    next();
  });
}

// Refresh token endpoint
function refreshToken(req, res) {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }
  
  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }
    
    // Generate new tokens
    const tokens = generateTokens({ id: user.sub });
    res.json(tokens);
  });
}
```

## OAuth 2.0

### OAuth 2.0 Flow Types
1. **Authorization Code**: Web applications
2. **Implicit**: Single-page applications (deprecated)
3. **Client Credentials**: Service-to-service
4. **Resource Owner Password**: Trusted applications

### Google OAuth Implementation
```javascript
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Find or create user
    let user = await User.findOne({ googleId: profile.id });
    
    if (!user) {
      user = await User.create({
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        avatar: profile.photos[0].value
      });
    }
    
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// Routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication
    const tokens = generateTokens(req.user);
    res.redirect(`/dashboard?token=${tokens.accessToken}`);
  }
);
```

### OAuth 2.0 with PKCE
```javascript
// PKCE (Proof Key for Code Exchange) for mobile apps
class OAuthPKCE {
  generatePKCE() {
    const crypto = require('crypto');
    
    // Generate code verifier
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    
    // Generate code challenge
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    
    return { codeVerifier, codeChallenge };
  }
  
  async initiateAuth() {
    const { codeVerifier, codeChallenge } = this.generatePKCE();
    
    // Store code verifier in session
    req.session.codeVerifier = codeVerifier;
    
    // Redirect to OAuth provider with code challenge
    const authUrl = `https://oauth-provider.com/auth?` +
      `client_id=${process.env.CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&` +
      `code_challenge=${codeChallenge}&` +
      `code_challenge_method=S256&` +
      `response_type=code`;
    
    res.redirect(authUrl);
  }
  
  async handleCallback(code) {
    const codeVerifier = req.session.codeVerifier;
    
    // Exchange code for tokens
    const response = await fetch('https://oauth-provider.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.CLIENT_ID,
        code: code,
        redirect_uri: process.env.REDIRECT_URI,
        code_verifier: codeVerifier
      })
    });
    
    return response.json();
  }
}
```

## Session Management

### Session-based Authentication
```javascript
const express = require('express');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);

const app = express();

// Session configuration
app.use(session({
  store: new RedisStore({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  const user = await authenticateUser(username, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Create session
  req.session.user = {
    id: user.id,
    username: user.username,
    roles: user.roles
  };
  
  res.json({ message: 'Logged in successfully' });
});

// Logout route
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});
```

## Authorization Patterns

### Role-Based Access Control (RBAC)
```javascript
class RBAC {
  constructor() {
    this.roles = new Map();
    this.permissions = new Map();
    this.userRoles = new Map();
    
    this.setupRoles();
  }
  
  setupRoles() {
    // Define permissions
    this.permissions.set('read:users', 'Read user data');
    this.permissions.set('write:users', 'Create/update users');
    this.permissions.set('delete:users', 'Delete users');
    this.permissions.set('read:posts', 'Read posts');
    this.permissions.set('write:posts', 'Create/update posts');
    
    // Define roles
    this.roles.set('user', ['read:posts']);
    this.roles.set('moderator', ['read:posts', 'write:posts']);
    this.roles.set('admin', ['read:users', 'write:users', 'delete:users', 'read:posts', 'write:posts']);
  }
  
  assignRole(userId, role) {
    if (!this.userRoles.has(userId)) {
      this.userRoles.set(userId, new Set());
    }
    this.userRoles.get(userId).add(role);
  }
  
  hasPermission(userId, permission) {
    const userRoles = this.userRoles.get(userId);
    if (!userRoles) return false;
    
    for (const role of userRoles) {
      const rolePermissions = this.roles.get(role);
      if (rolePermissions && rolePermissions.includes(permission)) {
        return true;
      }
    }
    
    return false;
  }
}

// Middleware for RBAC
function requirePermission(permission) {
  return (req, res, next) => {
    const userId = req.user.id;
    
    if (!rbac.hasPermission(userId, permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
}

// Usage
app.get('/users', authenticateToken, requirePermission('read:users'), getUsers);
app.post('/users', authenticateToken, requirePermission('write:users'), createUser);
```

### Attribute-Based Access Control (ABAC)
```javascript
class ABAC {
  constructor() {
    this.policies = [];
    this.setupPolicies();
  }
  
  setupPolicies() {
    // Policy: Users can read their own data
    this.policies.push({
      id: 'read-own-data',
      effect: 'Allow',
      actions: ['read'],
      resources: ['user'],
      conditions: {
        'user.id': 'resource.id'
      }
    });
    
    // Policy: Admins can read all data
    this.policies.push({
      id: 'admin-read-all',
      effect: 'Allow',
      actions: ['read'],
      resources: ['*'],
      conditions: {
        'user.roles': ['admin']
      }
    });
    
    // Policy: Users can edit posts in their department
    this.policies.push({
      id: 'edit-department-posts',
      effect: 'Allow',
      actions: ['write'],
      resources: ['post'],
      conditions: {
        'user.department': 'resource.department'
      }
    });
  }
  
  evaluate(user, action, resource) {
    for (const policy of this.policies) {
      if (this.matchesPolicy(user, action, resource, policy)) {
        return policy.effect === 'Allow';
      }
    }
    
    return false; // Default deny
  }
  
  matchesPolicy(user, action, resource, policy) {
    if (!policy.actions.includes(action)) return false;
    if (!policy.resources.includes('*') && !policy.resources.includes(resource.type)) return false;
    
    for (const [key, expectedValue] of Object.entries(policy.conditions)) {
      const actualValue = this.getValue(user, resource, key);
      if (!this.matchesCondition(actualValue, expectedValue)) {
        return false;
      }
    }
    
    return true;
  }
  
  getValue(user, resource, path) {
    const parts = path.split('.');
    let value = path.startsWith('user.') ? user : resource;
    
    for (const part of parts.slice(1)) {
      value = value[part];
    }
    
    return value;
  }
  
  matchesCondition(actual, expected) {
    if (Array.isArray(expected)) {
      return expected.includes(actual);
    }
    return actual === expected;
  }
}
```

## Security Best Practices

### Password Security
```javascript
const bcrypt = require('bcrypt');

class PasswordService {
  async hashPassword(password) {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }
  
  async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }
  
  validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const errors = [];
    
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (!hasUpperCase) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumbers) {
      errors.push('Password must contain at least one number');
    }
    if (!hasSpecialChar) {
      errors.push('Password must contain at least one special character');
    }
    
    return errors;
  }
}
```

### Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

// General rate limiting
const generalLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for auth endpoints
const authLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient
  }),
  windowMs: 15 * 60 * 1000,
  max: 5, // limit each IP to 5 requests per windowMs
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts, please try again later',
});

app.use('/api/', generalLimiter);
app.post('/auth/login', authLimiter);
app.post('/auth/register', authLimiter);
```

### Input Validation and Sanitization
```javascript
const expressValidator = require('express-validator');
const xss = require('xss');
const DOMPurify = require('isomorphic-dompurify');

// Validation middleware
const validateUser = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  // Sanitize input
  body('name').customSanitizer(value => {
    return DOMPurify.sanitize(value);
  }),
  
  // Handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  }
];

// SQL Injection prevention
const mysql = require('mysql2/promise');

async function getUserById(userId) {
  const connection = await mysql.createConnection(dbConfig);
  
  // Use parameterized queries
  const [rows] = await connection.execute(
    'SELECT * FROM users WHERE id = ?',
    [userId]
  );
  
  await connection.end();
  return rows[0];
}
```

## Common Interview Questions

### Q: What is the difference between authentication and authorization?
A: 
**Authentication**: Verifying identity (who you are)
- Methods: Passwords, biometrics, tokens
- Examples: Login with username/password, fingerprint scan

**Authorization**: Verifying permissions (what you can do)
- Methods: RBAC, ABAC, ACLs
- Examples: Admin can delete users, user can only read posts

### Q: How does JWT work and what are its advantages?
A: JWT (JSON Web Token):
- **Structure**: Header + Payload + Signature
- **Stateless**: No server-side session storage
- **Self-contained**: Contains user information
- **Portable**: Works across different domains

**Advantages**:
- Scalability (no session storage)
- Mobile-friendly
- Cross-domain support
- Decentralized authentication

### Q: What is OAuth 2.0 and when would you use it?
A: OAuth 2.0 is an authorization framework:
- **Purpose**: Delegate access without sharing credentials
- **Use cases**: Third-party integrations, mobile apps
- **Flow types**: Authorization Code, Client Credentials, etc.
- **Components**: Client, Resource Owner, Authorization Server, Resource Server

### Q: How do you prevent common security vulnerabilities?
A: Common vulnerabilities and prevention:
- **SQL Injection**: Parameterized queries, ORMs
- **XSS**: Input sanitization, CSP headers
- **CSRF**: CSRF tokens, same-site cookies
- **Password breaches**: Hashing, salting, rate limiting
- **Session hijacking**: Secure cookies, HTTPS

### Q: What is the difference between RBAC and ABAC?
A: 
**RBAC (Role-Based Access Control)**:
- Based on user roles
- Static permissions
- Simple to implement
- Example: Admin, User, Moderator roles

**ABAC (Attribute-Based Access Control)**:
- Based on attributes and policies
- Dynamic permissions
- More flexible and granular
- Example: User can edit posts in their department

## Advanced Topics

### Zero Trust Architecture
```javascript
// Zero Trust: Never trust, always verify
class ZeroTrustAuth {
  async verifyRequest(req) {
    // Verify device
    const device = await this.verifyDevice(req.headers['user-agent'], req.ip);
    if (!device.trusted) {
      throw new Error('Untrusted device');
    }
    
    // Verify location
    const location = await this.verifyLocation(req.ip);
    if (location.anomalous) {
      await this.triggerMFA(req.user.id);
    }
    
    // Verify behavior
    const behavior = await this.analyzeBehavior(req.user.id, req);
    if (behavior.suspicious) {
      await this.blockRequest(req);
    }
    
    return true;
  }
}
```

### WebAuthn (Passwordless Authentication)
```javascript
// WebAuthn implementation
const { Fido2Lib } = require('@fidobox/fido2-lib');

class WebAuthnService {
  constructor() {
    this.fido2 = new Fido2Lib({
      rpName: 'Your App',
      rpID: 'yourapp.com',
      rpIcon: 'https://yourapp.com/icon.png',
      authenticatorAttachment: 'platform',
      userVerification: 'required'
    });
  }
  
  async registerChallenge(userId, username) {
    const challenge = await this.fido2.attestationOptions();
    challenge.user = {
      id: Buffer.from(userId),
      name: username,
      displayName: username
    };
    
    // Store challenge in session
    req.session.challenge = challenge.challenge;
    
    return challenge;
  }
  
  async verifyRegistration(attestationResponse, challenge) {
    const result = await this.fido2.attestationResult(attestationResponse, {
      challenge,
      origin: 'https://yourapp.com'
    });
    
    // Store credential
    await this.storeCredential(result.authnrData.get('credentialId'), result);
    
    return result;
  }
}
```

### Security Headers
```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: 'no-referrer' }
}));
```

## Additional Topics

### CORS (Cross-Origin Resource Sharing)
- Browsers block requests from a different origin (domain, port, or protocol) by default.
- The server must explicitly allow cross-origin requests via response headers.
- **Preflight request**: For non-simple requests (PUT, DELETE, custom headers), the browser sends an `OPTIONS` request first to check if the actual request is allowed.

```javascript
const cors = require('cors');

// Simple: Allow all origins (NOT recommended for production)
app.use(cors());

// Production: Whitelist specific origins
app.use(cors({
  origin: ['https://myapp.com', 'https://admin.myapp.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,   // Allow cookies to be sent
  maxAge: 86400        // Cache preflight response for 24 hours
}));
```

### HTTPS and TLS Handshake
- **HTTPS** = HTTP over TLS (Transport Layer Security).
- **TLS Handshake** (simplified):
  1. Client sends `ClientHello` (supported cipher suites, TLS version).
  2. Server responds with `ServerHello` (chosen cipher, server certificate).
  3. Client verifies the certificate against trusted Certificate Authorities (CAs).
  4. Client and server exchange keys to establish a shared symmetric key.
  5. All subsequent data is encrypted with the symmetric key.
- **Why symmetric?**: Asymmetric encryption (RSA) is slow. It's only used during the handshake. The actual data transfer uses faster symmetric encryption (AES).

### Cookie Security Attributes
| Attribute | Purpose |
|---|---|
| **`HttpOnly`** | Cookie cannot be accessed by JavaScript (`document.cookie`). Prevents XSS from stealing session cookies. |
| **`Secure`** | Cookie is only sent over HTTPS connections. |
| **`SameSite=Strict`** | Cookie is never sent with cross-site requests. Strongest CSRF protection. |
| **`SameSite=Lax`** | Cookie is sent with top-level navigations (clicking a link) but NOT with cross-site POST/AJAX. Default in modern browsers. |
| **`SameSite=None`** | Cookie is sent with all cross-site requests. Requires `Secure` flag. Used for third-party cookies. |
| **`Domain`** | Which domains the cookie is sent to. |
| **`Path`** | Which URL paths the cookie is sent to. |
| **`Max-Age` / `Expires`** | Cookie lifetime. Without it, cookie is a session cookie (deleted when browser closes). |

### CSRF (Cross-Site Request Forgery) Protection
- An attacker tricks a logged-in user into making unwanted requests.
- **Prevention**:
  - **CSRF Tokens**: Server generates a unique token per session, embedded in forms. Server validates the token on submission.
  - **SameSite Cookies**: Modern browsers block cross-site cookie sending by default.
  - **Double Submit Cookie**: Token in both a cookie and a request header; server verifies they match.

## Additional Interview Questions

### Q: What is the difference between Symmetric and Asymmetric encryption?
A:
- **Symmetric** (AES): Same key for encryption and decryption. Fast. Challenge: securely sharing the key.
- **Asymmetric** (RSA): Two keys — public (encrypt) and private (decrypt). Slower but solves key distribution. Used in TLS handshake, digital signatures.

### Q: How do you store JWT tokens securely on the client?
A:
- **HttpOnly cookie** (recommended): Not accessible by JavaScript, preventing XSS theft. Vulnerable to CSRF, but mitigated with `SameSite` attribute.
- **In-memory variable**: Safest from persistence attacks, but lost on page refresh.
- **localStorage/sessionStorage** (NOT recommended): Accessible by JavaScript, vulnerable to XSS.

### Q: What is the difference between hashing and encryption?
A:
- **Hashing** (bcrypt, SHA-256): One-way. Cannot be reversed. Used for password storage, data integrity.
- **Encryption** (AES, RSA): Two-way. Can be decrypted with the correct key. Used for data in transit and at rest.
