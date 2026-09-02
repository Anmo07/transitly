/**
 * Test Suite: Transitly Legal, SEO, FAQ, Sitemap, 404 & Cookie Consent Routes
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');
const app = require('../src/app');

async function runTests() {
  console.log('=== Running Legal, SEO, FAQ, Sitemap & Custom 404 Tests ===\n');
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

  try {
    // 1. Privacy Policy Route
    console.log('1. Testing Privacy Policy (/privacy-policy & /privacy)...');
    const resPrivacy = await request('/privacy-policy');
    assert.strictEqual(resPrivacy.status, 200, 'Expected 200 for /privacy-policy');
    assert.ok(resPrivacy.body.includes('Transitly Privacy Policy'), 'Expected Privacy Policy title in body');
    assert.ok(resPrivacy.body.includes('DPDP Act 2023 & GDPR Compliant'), 'Expected DPDP compliance text');
    assert.ok(resPrivacy.body.includes('https://transitly.in/privacy-policy'), 'Expected canonical link');

    const resPrivacyAlias = await request('/privacy');
    assert.strictEqual(resPrivacyAlias.status, 200, 'Expected 200 for /privacy alias');
    console.log('✔ Privacy Policy routes verified successfully.');

    // 2. Terms and Conditions Route
    console.log('2. Testing Terms and Conditions (/terms & /terms-and-conditions)...');
    const resTerms = await request('/terms');
    assert.strictEqual(resTerms.status, 200, 'Expected 200 for /terms');
    assert.ok(resTerms.body.includes('Terms &amp; Conditions of Use') || resTerms.body.includes('Terms & Conditions of Use'), 'Expected Terms title in body');
    assert.ok(resTerms.body.includes('Strictly Prohibited Goods &amp; Contraband') || resTerms.body.includes('Strictly Prohibited Goods'), 'Expected prohibited goods section');
    assert.ok(resTerms.body.includes('https://transitly.in/terms'), 'Expected canonical link');

    const resTermsAlias = await request('/terms-and-conditions');
    assert.strictEqual(resTermsAlias.status, 200, 'Expected 200 for /terms-and-conditions alias');
    console.log('✔ Terms and Conditions routes verified successfully.');

    // 3. FAQ Route
    console.log('3. Testing FAQ Page (/faq & /faqs)...');
    const resFaq = await request('/faq');
    assert.strictEqual(resFaq.status, 200, 'Expected 200 for /faq');
    assert.ok(resFaq.body.includes('Frequently Asked Questions'), 'Expected FAQ title in body');
    assert.ok(resFaq.body.includes('@type": "FAQPage"'), 'Expected JSON-LD FAQPage schema markup');
    assert.ok(resFaq.body.includes('faqSearchInput'), 'Expected instant live search input');
    assert.ok(resFaq.body.includes('https://transitly.in/faq'), 'Expected canonical link');

    const resFaqsAlias = await request('/faqs');
    assert.strictEqual(resFaqsAlias.status, 200, 'Expected 200 for /faqs alias');
    console.log('✔ FAQ route and JSON-LD schema verified successfully.');

    // 4. Sitemap.xml
    console.log('4. Testing Sitemap.xml (/sitemap.xml)...');
    const resSitemap = await request('/sitemap.xml');
    assert.strictEqual(resSitemap.status, 200, 'Expected 200 for /sitemap.xml');
    assert.ok(resSitemap.headers['content-type'].includes('xml'), 'Expected application/xml content-type');
    assert.ok(resSitemap.body.includes('<urlset'), 'Expected <urlset> root node in XML');
    assert.ok(resSitemap.body.includes('https://transitly.in/privacy-policy'), 'Expected privacy-policy in sitemap');
    assert.ok(resSitemap.body.includes('https://transitly.in/terms'), 'Expected terms in sitemap');
    assert.ok(resSitemap.body.includes('https://transitly.in/faq'), 'Expected faq in sitemap');
    console.log('✔ XML Sitemap verified with canonical endpoints.');

    // 5. Robots.txt
    console.log('5. Testing Robots.txt (/robots.txt)...');
    const resRobots = await request('/robots.txt');
    assert.strictEqual(resRobots.status, 200, 'Expected 200 for /robots.txt');
    assert.ok(resRobots.headers['content-type'].includes('text/plain'), 'Expected text/plain content-type');
    assert.ok(resRobots.body.includes('Sitemap: https://transitly.in/sitemap.xml'), 'Expected Sitemap reference');
    assert.ok(resRobots.body.includes('Disallow: /admin'), 'Expected disallow admin');
    console.log('✔ Robots.txt directives verified.');

    // 6. Custom 404 Handler
    console.log('6. Testing Custom 404 Handler for Unmatched Routes...');
    const res404 = await request('/random-non-existent-route-999');
    assert.strictEqual(res404.status, 404, 'Expected HTTP status 404 for missing route');
    assert.ok(res404.body.includes('HTTP 404 • Destination Unknown') || res404.body.includes('Route Not Found'), 'Expected 404 page content');
    assert.ok(res404.body.includes('Book a Parcel (Home)'), 'Expected recovery CTA');

    const resApi404 = await request('/api/random-missing-endpoint');
    assert.strictEqual(resApi404.status, 404, 'Expected HTTP status 404 for API route');
    const json404 = JSON.parse(resApi404.body);
    assert.ok(json404.error, 'Expected JSON error response for API 404');
    console.log('✔ Custom 404 handler verified with correct HTTP 404 status.');

    // 7. Canonical Tags and Meta Descriptions on all HTML files
    console.log('7. Verifying Canonical Tags and Meta Descriptions on all HTML files...');
    const publicDir = path.join(__dirname, '../public');
    const htmlFiles = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

    assert.ok(htmlFiles.length >= 12, 'Expected at least 12 HTML files in public directory');
    for (const file of htmlFiles) {
      const content = fs.readFileSync(path.join(publicDir, file), 'utf8');
      assert.ok(content.includes('rel="canonical"'), `${file} is missing <link rel="canonical">`);
      assert.ok(content.includes('name="description"'), `${file} is missing <meta name="description">`);
    }
    console.log(`✔ All ${htmlFiles.length} HTML files verified with canonical URLs and meta descriptions.`);

    // 8. Cookie Consent Script
    console.log('8. Verifying Cookie Consent script...');
    const cookieScriptPath = path.join(publicDir, 'js/cookie-consent.js');
    assert.ok(fs.existsSync(cookieScriptPath), 'Expected cookie-consent.js to exist');
    const cookieScriptContent = fs.readFileSync(cookieScriptPath, 'utf8');
    assert.ok(cookieScriptContent.includes('transitly_cookie_consent'), 'Expected localStorage key');
    assert.ok(cookieScriptContent.includes('openCookiePreferences'), 'Expected openCookiePreferences method');
    console.log('✔ Cookie Consent script verified.');

    console.log('\nAll Legal, SEO, FAQ, Sitemap, Custom 404 & Cookie Consent tests passed successfully!\n');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
