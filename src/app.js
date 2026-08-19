const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const app = express();

// Load OpenAPI Specification
const swaggerDocument = YAML.load(path.join(__dirname, 'api/swagger.yaml'));

// Middleware & Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Static Frontend Assets
app.use(express.static(path.join(__dirname, '../public')));

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

// SPA Fallback to index.html for Frontend
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports = app;
