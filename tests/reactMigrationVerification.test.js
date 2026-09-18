const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../src/app');

describe('React Migration & Unified Architecture Verification Suite', () => {
  const publicDir = path.join(__dirname, '../public');
  const pagesDir = path.join(publicDir, 'pages');
  const distDir = path.join(publicDir, 'dist');

  test('1. Verify all 23 HTML templates are organized inside public/pages/', () => {
    const expectedPages = [
      '404.html',
      'delivery-partner.html',
      'faq.html',
      'help-support.html',
      'history.html',
      'index.html',
      'login.html',
      'notifications.html',
      'payment-methods.html',
      'privacy-policy.html',
      'profile.html',
      'rider-dashboard.html',
      'rider-earnings.html',
      'rider-map-trips.html',
      'rider-profile.html',
      'rider-requests.html',
      'saved-addresses.html',
      'services.html',
      'settings.html',
      'signup.html',
      'terms.html',
      'tracking.html',
      'visual-sitemap.html'
    ];

    expect(fs.existsSync(pagesDir)).toBe(true);
    const discoveredFiles = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));
    expect(discoveredFiles.length).toBe(23);

    expectedPages.forEach((page) => {
      expect(discoveredFiles).toContain(page);
      expect(fs.statSync(path.join(pagesDir, page)).size).toBeGreaterThan(100);
    });
  });

  test('2. Verify React SPA build artifacts exist in public/dist/', () => {
    const distIndex = path.join(distDir, 'index.html');
    expect(fs.existsSync(distIndex)).toBe(true);

    const htmlContent = fs.readFileSync(distIndex, 'utf8');
    expect(htmlContent).toContain('<div id="root"></div>');
    expect(htmlContent).toContain('/dist/assets/index-');
    expect(htmlContent).toContain('/css/3d-core-layouts.css');
  });

  test('3. Verify GET /app serves the compiled React SPA', async () => {
    const res = await request(app).get('/app');
    expect(res.status).toBe(200);
    expect(res.text).toContain('<div id="root"></div>');
    expect(res.headers['content-type']).toMatch(/html/);
  });

  test('4. Verify GET /app/*splat deep link serves the compiled React SPA', async () => {
    const res = await request(app).get('/app/services');
    expect(res.status).toBe(200);
    expect(res.text).toContain('<div id="root"></div>');

    const res2 = await request(app).get('/app/rider-dashboard');
    expect(res2.status).toBe(200);
    expect(res2.text).toContain('<div id="root"></div>');
  });

  test('5. Verify React JavaScript bundle is served with correct Content-Type', async () => {
    const assetsDir = path.join(distDir, 'assets');
    const jsFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.js'));
    expect(jsFiles.length).toBeGreaterThan(0);

    const jsFile = jsFiles[0];
    const res = await request(app).get(`/dist/assets/${jsFile}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/javascript/);
  });

  test('6. Verify React CSS bundle is served with correct Content-Type', async () => {
    const assetsDir = path.join(distDir, 'assets');
    const cssFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.css'));
    expect(cssFiles.length).toBeGreaterThan(0);

    const cssFile = cssFiles[0];
    const res = await request(app).get(`/dist/assets/${cssFile}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/css/);
  });

  test('7. Verify 3D Core Layouts stylesheet is accessible', async () => {
    const res = await request(app).get('/css/3d-core-layouts.css');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/css/);
    expect(res.text).toContain('contain: layout style');
  });

  test('8. Verify public pages continue serving without authentication', async () => {
    const publicPaths = ['/login', '/signup', '/faq', '/privacy-policy', '/terms', '/visual-sitemap'];
    for (const p of publicPaths) {
      const res = await request(app).get(p);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
    }
  });

  test('9. Verify protected routes redirect unauthenticated users to /login', async () => {
    const protectedPaths = [
      '/',
      '/tracking',
      '/services',
      '/history',
      '/profile',
      '/saved-addresses',
      '/payment-methods',
      '/notifications',
      '/help-support',
      '/settings'
    ];
    for (const p of protectedPaths) {
      const res = await request(app).get(p);
      expect(res.status).toBe(302);
      expect(res.headers.location).toMatch(/\/login/);
    }
  });

  test('10. Verify 3D Scrubber Manifest is valid and synchronizes 23 pages', () => {
    const manifestPath = path.join(publicDir, 'js/scrubber-manifest.json');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(manifest.version).toBeDefined();
    expect(manifest.metrics.totalPagesScanned).toBe(23);
    expect(manifest.metrics.totalLandmarksBound).toBe(7);
    expect(manifest.metrics.totalMicro3DTargets).toBe(405);
  });

  test('11. Verify Command Center (/admin) remains completely removed (404)', async () => {
    const res = await request(app).get('/admin');
    expect(res.status).toBe(404);
  });
});
