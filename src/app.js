const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const compression = require('compression');

const app = express();

// Load OpenAPI Specification
const swaggerDocument = YAML.load(path.join(__dirname, 'api/swagger.yaml'));

// Gzip / Brotli Compression for instant TTFB & payload reduction
app.use(compression({
  threshold: 1024,
  level: 6
}));

// Middleware & Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));
app.use(morgan('dev'));

// Block direct .html file access to prevent auth bypass (e.g., /tracking.html)
// All HTML pages must be served through our explicit route handlers with auth middleware.
app.use((req, res, next) => {
  if (req.path.endsWith('.html')) {
    return res.redirect(req.path.replace(/\.html$/, ''));
  }
  next();
});

// Static Frontend Assets (JS, CSS, images — NOT HTML page routes)
// index: false prevents express.static from auto-serving index.html for '/',
// ensuring all HTML page routes go through our explicit route handlers with auth middleware.
app.use(express.static(path.join(__dirname, '../public'), {
  etag: false,
  lastModified: false,
  index: false,
  setHeaders: (res, filePath) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    if (filePath.endsWith('.mmd')) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    }
  }
}));

// OpenAPI / Swagger Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: 'Transitly API Documentation',
  customCss: '.swagger-ui .topbar { display: none }'
}));

// Basic health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// API Routes
app.use('/api/v1', require('./api/routes/apiRoutes'));
app.use('/api/v1/tracking', require('./modules/tracking/telemetryRoutes'));

// 404 Handler for API
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Endpoint Not Found' });
});

// SEO & Crawler Directives — SVG Vector & Mermaid Text Sitemaps
const publicDir = path.join(__dirname, '../public');
const pagesDir = path.join(publicDir, 'pages');

app.get('/sitemap.svg', (req, res) => {
  res.sendFile(path.join(publicDir, 'sitemap.svg'), {
    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' }
  });
});
app.get(['/sitemap.mmd', '/sitemap.txt', '/sitemap/mermaid'], (req, res) => {
  const content = fs.readFileSync(path.join(publicDir, 'sitemap.mmd'), 'utf8');
  res.type('text/plain').send(content);
});
// Legacy XML sitemap redirect to modern SVG vector sitemap
app.get('/sitemap.xml', (req, res) => {
  res.redirect(301, '/sitemap.svg');
});
app.get('/robots.txt', (req, res) => {
  res.header('Content-Type', 'text/plain');
  res.sendFile(path.join(publicDir, 'robots.txt'));
});

// =========================================================================
// Authorization Middleware — Server-Side Route Protection
// =========================================================================
const jwt = require('jsonwebtoken');
const AUTH_SECRET = process.env.AUTH_SECRET || 'transitly-jwt-secret-key-2026';

/**
 * Parse the session token from cookies or Authorization header.
 * Returns decoded JWT payload if valid, null otherwise.
 */
const extractSessionToken = (req) => {
  // 1. Check cookie: transitly_session=<jwt>
  const cookieHeader = req.headers.cookie || '';
  const cookieMatch = cookieHeader.match(/(?:^|;\s*)transitly_session=([^\s;]+)/);
  if (cookieMatch && cookieMatch[1]) {
    try {
      return jwt.verify(cookieMatch[1], AUTH_SECRET);
    } catch (e) { /* expired or invalid */ }
  }
  // 2. Check Authorization: Bearer <jwt>
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    try {
      return jwt.verify(authHeader.slice(7), AUTH_SECRET);
    } catch (e) { /* expired or invalid */ }
  }
  return null;
};

/**
 * Middleware: Require authentication for protected page routes.
 * Redirects unauthenticated visitors to /login?redirect=<original_path>
 */
const requirePageAuth = (req, res, next) => {
  const decoded = extractSessionToken(req);
  if (decoded) {
    req.user = decoded;
    return next();
  }
  // Redirect to login with the attempted URL as redirect param
  const redirectPath = encodeURIComponent(req.originalUrl);
  return res.redirect(`/login?redirect=${redirectPath}`);
};

/**
 * Strict Role-Based Route Gatekeeper:
 * Hard-codes complete separation between Customer and Delivery Partner sections.
 */
const requireRole = (allowedRole, redirectFallback) => {
  return (req, res, next) => {
    // Check cookie fallback if not in token
    let userRole = req.user?.role;
    if (!userRole) {
      const cookieHeader = req.headers.cookie || '';
      const match = cookieHeader.match(/(?:^|;\s*)transitly_user_role=([^;]+)/);
      if (match && match[1]) userRole = decodeURIComponent(match[1]);
    }
    userRole = userRole || 'CUSTOMER';

    if (userRole !== allowedRole) {
      return res.redirect(redirectFallback);
    }
    next();
  };
};

// =========================================================================
// Public Routes — Accessible Without Authentication
// =========================================================================
// Login, Signup, and Verification pages (must be accessible unauthenticated)
app.get(['/login', '/auth', '/signin', '/verify'], (req, res) => res.sendFile(path.join(pagesDir, 'login.html')));
app.get(['/signup', '/register', '/create-account'], (req, res) => res.sendFile(path.join(pagesDir, 'signup.html')));

// Legal & Informational pages (publicly accessible for SEO and compliance)
app.get(['/privacy', '/privacy-policy'], (req, res) => res.sendFile(path.join(pagesDir, 'privacy-policy.html')));
app.get(['/terms', '/terms-and-conditions', '/terms-of-use'], (req, res) => res.sendFile(path.join(pagesDir, 'terms.html')));
app.get(['/faq', '/faqs'], (req, res) => res.sendFile(path.join(pagesDir, 'faq.html')));
app.get(['/visual-sitemap', '/sitemap'], (req, res) => res.sendFile(path.join(pagesDir, 'visual-sitemap.html')));

// =========================================================================
// Protected Routes — Strict Role-Isolated Domains
// =========================================================================
// 1. Customer Parcel Logistics Domain (Delivery Partners strictly prohibited)
app.get(['/', '/deliver'], requirePageAuth, requireRole('CUSTOMER', '/rider-dashboard'), (req, res) => res.sendFile(path.join(pagesDir, 'index.html')));
app.get('/tracking', requirePageAuth, requireRole('CUSTOMER', '/rider-dashboard'), (req, res) => res.sendFile(path.join(pagesDir, 'tracking.html')));
app.get('/services', requirePageAuth, requireRole('CUSTOMER', '/rider-dashboard'), (req, res) => res.sendFile(path.join(pagesDir, 'services.html')));
app.get('/history', requirePageAuth, requireRole('CUSTOMER', '/rider-dashboard'), (req, res) => res.sendFile(path.join(pagesDir, 'history.html')));
app.get('/profile', requirePageAuth, requireRole('CUSTOMER', '/rider-dashboard'), (req, res) => res.sendFile(path.join(pagesDir, 'profile.html')));
app.get('/saved-addresses', requirePageAuth, requireRole('CUSTOMER', '/rider-dashboard'), (req, res) => res.sendFile(path.join(pagesDir, 'saved-addresses.html')));
app.get('/payment-methods', requirePageAuth, requireRole('CUSTOMER', '/rider-dashboard'), (req, res) => res.sendFile(path.join(pagesDir, 'payment-methods.html')));
app.get('/settings', requirePageAuth, requireRole('CUSTOMER', '/rider-dashboard'), (req, res) => res.sendFile(path.join(pagesDir, 'settings.html')));
app.get('/help-support', requirePageAuth, requireRole('CUSTOMER', '/rider-dashboard'), (req, res) => res.sendFile(path.join(pagesDir, 'help-support.html')));
app.get('/notifications', requirePageAuth, requireRole('CUSTOMER', '/rider-dashboard'), (req, res) => res.sendFile(path.join(pagesDir, 'notifications.html')));

// 2. Delivery Partner Cockpit Domain (Customers strictly prohibited)
app.get('/rider-dashboard', requirePageAuth, requireRole('DELIVERY_PARTNER', '/'), (req, res) => res.sendFile(path.join(pagesDir, 'rider-dashboard.html')));
app.get('/rider-map-trips', requirePageAuth, requireRole('DELIVERY_PARTNER', '/'), (req, res) => res.sendFile(path.join(pagesDir, 'rider-map-trips.html')));
app.get('/rider-requests', requirePageAuth, requireRole('DELIVERY_PARTNER', '/'), (req, res) => res.sendFile(path.join(pagesDir, 'rider-requests.html')));
app.get('/rider-earnings', requirePageAuth, requireRole('DELIVERY_PARTNER', '/'), (req, res) => res.sendFile(path.join(pagesDir, 'rider-earnings.html')));
app.get('/rider-profile', requirePageAuth, requireRole('DELIVERY_PARTNER', '/'), (req, res) => res.sendFile(path.join(pagesDir, 'rider-profile.html')));
app.get('/delivery-partner', requirePageAuth, requireRole('DELIVERY_PARTNER', '/'), (req, res) => res.sendFile(path.join(pagesDir, 'delivery-partner.html')));

// React Single Page Application Entry (/app/*splat)
app.get(['/app', '/app/*splat'], (req, res) => {
  const distHtml = path.join(publicDir, 'dist/index.html');
  if (fs.existsSync(distHtml)) {
    res.sendFile(distHtml);
  } else {
    res.sendFile(path.join(pagesDir, 'index.html'));
  }
});

// Custom 404 Handler for Unmatched Routes (Prevents Soft 404 SEO penalties)
app.use((req, res) => {
  res.status(404);
  if (req.accepts('html')) {
    res.sendFile(path.join(pagesDir, '404.html'));
  } else if (req.accepts('json')) {
    res.json({ error: 'Route Not Found', code: 404 });
  } else {
    res.type('txt').send('404 Route Not Found');
  }
});

module.exports = app;
