const jwt = require('jsonwebtoken');

const AUTH_SECRET = process.env.AUTH_SECRET || 'transitly-jwt-secret-key-2026';

if (process.env.NODE_ENV === 'production' && (!process.env.AUTH_SECRET || process.env.AUTH_SECRET === 'transitly-jwt-secret-key-2026' || process.env.AUTH_SECRET === 'replace_with_a_long_random_secret')) {
  throw new Error('FATAL SECURITY ERROR: AUTH_SECRET must be configured with a secure random secret in production environments.');
}

/**
 * Extract and verify JWT token from Authorization header, Cookie, or X-Auth-Token
 */
const extractToken = (req) => {
  // 1. Authorization: Bearer <jwt>
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    try {
      return jwt.verify(authHeader.slice(7), AUTH_SECRET);
    } catch (_) { /* invalid or expired */ }
  }

  // 2. Cookie: transitly_session=<jwt>
  const cookieHeader = req.headers.cookie || '';
  const cookieMatch = cookieHeader.match(/(?:^|;\s*)transitly_session=([^\s;]+)/);
  if (cookieMatch && cookieMatch[1]) {
    try {
      return jwt.verify(cookieMatch[1], AUTH_SECRET);
    } catch (_) { /* invalid or expired */ }
  }

  // 3. X-Auth-Token header
  const xAuthToken = req.headers['x-auth-token'];
  if (xAuthToken) {
    try {
      return jwt.verify(xAuthToken, AUTH_SECRET);
    } catch (_) { /* invalid or expired */ }
  }

  return null;
};

/**
 * Middleware: Require valid authentication for API routes
 */
const requireAuth = (req, res, next) => {
  const user = extractToken(req);
  if (!user) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required. Please provide a valid Bearer token or session cookie.',
      code: 401
    });
  }
  req.user = user;
  next();
};

/**
 * Middleware: Require specific role(s) for API routes
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required.',
        code: 401
      });
    }
    const userRole = req.user.role || 'CUSTOMER';
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        status: 'error',
        message: `Forbidden. Access restricted to role(s): ${allowedRoles.join(', ')}`,
        code: 403
      });
    }
    next();
  };
};

/**
 * Middleware: Optional authentication (attaches user if present, proceeds otherwise)
 */
const optionalAuth = (req, res, next) => {
  req.user = extractToken(req);
  next();
};

module.exports = {
  extractToken,
  requireAuth,
  requireRole,
  optionalAuth,
  AUTH_SECRET
};
