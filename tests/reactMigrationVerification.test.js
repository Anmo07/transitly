/**
 * Test Suite: React Migration & Architecture Verification
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');
const app = require('../src/app');

async function runTests() {
  console.log('=== Running React Migration & Architecture Verification Tests ===\n');
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const request = (urlPath) => {
    return new Promise((resolve, reject) => {
      http.get(`${baseUrl}${urlPath}`, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
      }).on('error', reject);
    });
  };

  const publicDir = path.join(__dirname, '../public');
  const pagesDir = path.join(publicDir, 'pages');
  const distDir = path.join(publicDir, 'dist');

  try {
    // 1. Verify 23 HTML files in public/pages/
    console.log('1. Verifying all 23 HTML templates are organized in public/pages/...');
    const expectedPages = [
      '404.html', 'delivery-partner.html', 'faq.html', 'help-support.html',
      'history.html', 'index.html', 'login.html', 'notifications.html',
      'payment-methods.html', 'privacy-policy.html', 'profile.html',
      'rider-dashboard.html', 'rider-earnings.html', 'rider-map-trips.html',
      'rider-profile.html', 'rider-requests.html', 'saved-addresses.html',
      'services.html', 'settings.html', 'signup.html', 'terms.html',
      'tracking.html', 'visual-sitemap.html'
    ];
    assert.ok(fs.existsSync(pagesDir), 'public/pages/ directory must exist');
    const discoveredFiles = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));
    assert.strictEqual(discoveredFiles.length, 23, 'Must contain exactly 23 HTML pages');
    expectedPages.forEach(p => {
      assert.ok(discoveredFiles.includes(p), `Missing expected page: ${p}`);
      assert.ok(fs.statSync(path.join(pagesDir, p)).size > 100, `${p} must not be empty`);
    });
    console.log('✔ All 23 HTML templates correctly organized and validated in public/pages/.');

    // 2. Verify React build in public/dist/
    console.log('2. Verifying React SPA production build in public/dist/...');
    const distIndex = path.join(distDir, 'index.html');
    assert.ok(fs.existsSync(distIndex), 'public/dist/index.html must exist');
    const html = fs.readFileSync(distIndex, 'utf8');
    assert.ok(html.includes('<div id="root"></div>'), 'Root mount point must exist in dist/index.html');
    assert.ok(html.includes('/dist/assets/index-'), 'Script bundle reference must be present');
    console.log('✔ React production build verified.');

    // 3. Verify GET /app serves React SPA
    console.log('3. Verifying GET /app serves React Single Page Application...');
    const resApp = await request('/app');
    assert.strictEqual(resApp.status, 200, 'Expected 200 for /app');
    assert.ok(resApp.body.includes('<div id="root"></div>'), 'Expected root div in /app');
    console.log('✔ GET /app verified.');

    // 4. Verify deep links on /app/*splat
    console.log('4. Verifying deep routes on /app/*splat...');
    const resServices = await request('/app/services');
    assert.strictEqual(resServices.status, 200, 'Expected 200 for /app/services');
    assert.ok(resServices.body.includes('<div id="root"></div>'), 'Expected SPA shell on /app/services');

    const resRider = await request('/app/rider-dashboard');
    assert.strictEqual(resRider.status, 200, 'Expected 200 for /app/rider-dashboard');
    assert.ok(resRider.body.includes('<div id="root"></div>'), 'Expected SPA shell on /app/rider-dashboard');
    console.log('✔ SPA deep links verified.');

    // 5. Verify static asset resolution
    console.log('5. Verifying React bundled JS and CSS assets...');
    const assetsDir = path.join(distDir, 'assets');
    const jsFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.js'));
    assert.ok(jsFiles.length > 0, 'Must have at least 1 compiled JS asset');
    const resJs = await request(`/dist/assets/${jsFiles[0]}`);
    assert.strictEqual(resJs.status, 200, 'Expected 200 for React JS bundle');
    assert.ok(resJs.headers['content-type'].includes('javascript'), 'Expected javascript Content-Type');

    const cssFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.css'));
    assert.ok(cssFiles.length > 0, 'Must have at least 1 compiled CSS asset');
    const resCss = await request(`/dist/assets/${cssFiles[0]}`);
    assert.strictEqual(resCss.status, 200, 'Expected 200 for React CSS bundle');
    assert.ok(resCss.headers['content-type'].includes('css'), 'Expected css Content-Type');
    console.log('✔ Compiled assets served with valid MIME types.');

    // 6. Verify 3D core layout styles
    console.log('6. Verifying 3D core layout containment...');
    const res3dCss = await request('/css/3d-core-layouts.css');
    assert.strictEqual(res3dCss.status, 200, 'Expected 200 for /css/3d-core-layouts.css');
    assert.ok(res3dCss.body.includes('contain: layout style'), 'Expected CSS layout containment');
    console.log('✔ 3D Core layouts CSS verified.');

    // 7. Verify 3D Scrubber Manifest metrics
    console.log('7. Verifying 3D Scrubber Manifest metrics...');
    const manifest = JSON.parse(fs.readFileSync(path.join(publicDir, 'js/scrubber-manifest.json'), 'utf8'));
    assert.strictEqual(manifest.version, '1.0.0', 'Manifest version must be 1.0.0');
    assert.strictEqual(manifest.globalConfig.renderer, 'webgl2', 'Global renderer must be webgl2');
    const pageKeys = Object.keys(manifest.pages);
    assert.strictEqual(pageKeys.length, 23, 'Must scan 23 pages');
    console.log('✔ 3D Scrubber Manifest verified (23 pages registered).');

    // 8. Verify Command Center removal (404)
    console.log('8. Verifying /admin is 404...');
    const resAdmin = await request('/admin');
    assert.strictEqual(resAdmin.status, 404, 'Expected 404 for /admin');
    console.log('✔ Command Center verified removed (404).');

    console.log('\nAll React Migration & Unified Architecture verification tests passed successfully!\n');
  } finally {
    server.close();
  }
}

if (require.main === module) {
  runTests().catch((err) => {
    console.error('Test Suite Failed:', err);
    process.exit(1);
  });
}

module.exports = runTests;
