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

// Static Frontend Assets (Prevent aggressive caching during development)
app.use(express.static(path.join(__dirname, '../public'), {
  etag: false,
  lastModified: false,
  setHeaders: (res, filePath) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
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

// SEO & Crawler Directives
const publicDir = path.join(__dirname, '../public');
app.get('/sitemap.xml', (req, res) => {
  res.header('Content-Type', 'application/xml');
  res.sendFile(path.join(publicDir, 'sitemap.xml'));
});
app.get('/robots.txt', (req, res) => {
  res.header('Content-Type', 'text/plain');
  res.sendFile(path.join(publicDir, 'robots.txt'));
});

// Frontend Screen Routes
app.get(['/', '/deliver'], (req, res) => res.sendFile(path.join(publicDir, 'index.html')));
app.get('/tracking', (req, res) => res.sendFile(path.join(publicDir, 'tracking.html')));
app.get('/services', (req, res) => res.sendFile(path.join(publicDir, 'services.html')));
app.get('/history', (req, res) => res.sendFile(path.join(publicDir, 'history.html')));
app.get('/profile', (req, res) => res.sendFile(path.join(publicDir, 'profile.html')));
app.get('/saved-addresses', (req, res) => res.sendFile(path.join(publicDir, 'saved-addresses.html')));
app.get('/payment-methods', (req, res) => res.sendFile(path.join(publicDir, 'payment-methods.html')));
app.get('/settings', (req, res) => res.sendFile(path.join(publicDir, 'settings.html')));
app.get('/help-support', (req, res) => res.sendFile(path.join(publicDir, 'help-support.html')));
app.get(['/faq', '/faqs'], (req, res) => res.sendFile(path.join(publicDir, 'faq.html')));
app.get(['/privacy', '/privacy-policy'], (req, res) => res.sendFile(path.join(publicDir, 'privacy-policy.html')));
app.get(['/terms', '/terms-and-conditions', '/terms-of-use'], (req, res) => res.sendFile(path.join(publicDir, 'terms.html')));
app.get('/notifications', (req, res) => res.sendFile(path.join(publicDir, 'notifications.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(publicDir, 'admin.html')));

// Custom 404 Handler for Unmatched Routes (Prevents Soft 404 SEO penalties)
app.use((req, res) => {
  res.status(404);
  if (req.accepts('html')) {
    res.sendFile(path.join(publicDir, '404.html'));
  } else if (req.accepts('json')) {
    res.json({ error: 'Route Not Found', code: 404 });
  } else {
    res.type('txt').send('404 Route Not Found');
  }
});

module.exports = app;
