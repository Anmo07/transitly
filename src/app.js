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

// Frontend Screen Routes (Clean URL mapping for all 9 Google Stitch screens)
const publicDir = path.join(__dirname, '../public');
app.get(['/', '/deliver'], (req, res) => res.sendFile(path.join(publicDir, 'index.html')));
app.get('/tracking', (req, res) => res.sendFile(path.join(publicDir, 'tracking.html')));
app.get('/services', (req, res) => res.sendFile(path.join(publicDir, 'services.html')));
app.get('/history', (req, res) => res.sendFile(path.join(publicDir, 'history.html')));
app.get('/profile', (req, res) => res.sendFile(path.join(publicDir, 'profile.html')));
app.get('/saved-addresses', (req, res) => res.sendFile(path.join(publicDir, 'saved-addresses.html')));
app.get('/payment-methods', (req, res) => res.sendFile(path.join(publicDir, 'payment-methods.html')));
app.get('/settings', (req, res) => res.sendFile(path.join(publicDir, 'settings.html')));
app.get('/help-support', (req, res) => res.sendFile(path.join(publicDir, 'help-support.html')));

// Fallback to index.html
app.use((req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

module.exports = app;
