#!/usr/bin/env node

/**
 * Transitly - Automated 3D Landmark & Scrubber Generator
 * scripts/generate-3d-scrubbers.js
 *
 * Scans public/*.html files, identifies 3D integration landmarks,
 * calculates optimal aspect-ratio constraints and frame budgets,
 * and compiles the production scrubber manifest (public/js/scrubber-manifest.json).
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '../public');
const OUTPUT_MANIFEST_PATH = path.join(PUBLIC_DIR, 'js/scrubber-manifest.json');

// Operational mapping patterns: maps HTML patterns to Higgsfield 3D operational sequences
const OPERATIONAL_LANDMARK_RULES = [
  {
    id: '3D-BUS-HIGHWAY',
    name: 'Intercity Bus Carrier Telemetry',
    targetPattern: /(id=["'](homeMapContainer|liveTrackingMap|liveTrackingView|heroContainer|corridorTimeline)["'])/i,
    fallbackSelector: '#homeMapContainer',
    aspectRatio: '16/9',
    mobileAspectRatio: '9/16',
    defaultFrameCount: 75,
    scrubDelay: 0.1,
    promptFocus: 'Cinematic low-angle tracking shot of a modern intercity electric coach gliding over highway asphalt at twilight, cobalt blue underglow (#0050cb), aerodynamic wind trails.'
  },
  {
    id: '3D-CARGO-SEAL',
    name: 'Cryptographic QR Bay Stowage',
    targetPattern: /(id=["'](qrSealContainer|bayLockModal|tamperSealHud|bookingSuccessModal|cargoCustodyModal|cargoSealContainer)["'])/i,
    fallbackSelector: '#qrSealContainer',
    aspectRatio: '16/9',
    mobileAspectRatio: '1/1',
    defaultFrameCount: 60,
    scrubDelay: 0.1,
    promptFocus: 'Macro 3D perspective of a ruggedized bus underbelly cargo bay sliding open. Robotic clamp places smart parcel into slot; holographic emerald laser projects pulsing QR seal (#10b981) locking shut.'
  },
  {
    id: '3D-RIDER-RADAR',
    name: 'Delivery Partner Telematics & Radar Dock',
    targetPattern: /(id=["'](radarContainer|riderLiveMap|riderMapTrips|dispatchCockpit|telematicsCard|hotspotMap|partnerHandoffCard)["'])/i,
    fallbackSelector: '#radarContainer',
    aspectRatio: '16/9',
    mobileAspectRatio: '4/3',
    defaultFrameCount: 60,
    scrubDelay: 0.1,
    promptFocus: 'Isometric view of urban electric scooter in cobalt and matte dark gray. 360-degree radar sonar pulse radiates across geometric street grid, docking seamlessly at a destination waypoint.'
  },
  {
    id: '3D-HANDOFF-PIN',
    name: 'Doorstep Custody 4-Digit PIN Lock',
    targetPattern: /(id=["'](modalPinVerify|handoffOtpModal|deliverySuccessCard|recipientDeliveryPin)["'])/i,
    fallbackSelector: '#modalPinVerify',
    aspectRatio: '1/1',
    mobileAspectRatio: '1/1',
    defaultFrameCount: 45,
    scrubDelay: 0.1,
    promptFocus: 'Floating 3D digital vault lock dial spinning in place. Upon 4th digit entry, the cylinder releases with pneumatic vapor, dissolving into an emerald checkmark with floating light particles.'
  }
];

function extractElements(html) {
  const ids = [];
  const idRegex = /id=["']([^"']+)["']/g;
  let match;
  while ((match = idRegex.exec(html)) !== null) {
    ids.push(match[1]);
  }

  // Count interactive elements for micro-3d audit
  const buttonMatches = html.match(/<button/gi) || [];
  const inputMatches = html.match(/<input|<select|<textarea/gi) || [];
  const cardMatches = html.match(/class=["'][^"']*(?:glass-card|rounded-2xl|active-press)[^"']*["']/gi) || [];

  return {
    ids,
    buttonCount: buttonMatches.length,
    inputCount: inputMatches.length,
    cardCount: cardMatches.length
  };
}

function analyzeHtmlFiles() {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║       TRANSITLY 3D AGENTIC SCANNER & SCRUBBER BUILDER              ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  if (!fs.existsSync(PUBLIC_DIR)) {
    console.error(`Error: public directory not found at ${PUBLIC_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(PUBLIC_DIR).filter(f => f.endsWith('.html'));
  console.log(`Discovered ${files.length} HTML template pages in public/.\n`);

  const manifest = {
    generatedAt: new Date().toISOString(),
    version: '1.0.0',
    globalConfig: {
      renderer: 'webgl2',
      maxDpr: 2, // Safari VRAM safeguard
      scrubFollowDelay: 0.1, // 120Hz display optimization
      containmentStyle: 'contain: layout size style;',
      workerDecoder: 'createImageBitmap'
    },
    pages: {}
  };

  let totalLandmarksDetected = 0;
  let totalInteractiveElements = 0;

  for (const file of files) {
    const filePath = path.join(PUBLIC_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const { ids, buttonCount, inputCount, cardCount } = extractElements(content);
    totalInteractiveElements += (buttonCount + inputCount + cardCount);

    const pageLandmarks = [];

    for (const rule of OPERATIONAL_LANDMARK_RULES) {
      const match = rule.targetPattern.test(content);
      if (match) {
        // Find the matched ID from ids
        const matchedId = ids.find(id => {
          return rule.targetPattern.test(`id="${id}"`);
        }) || rule.fallbackSelector.replace('#', '');

        pageLandmarks.push({
          sequenceId: rule.id,
          sequenceName: rule.name,
          targetContainerId: matchedId,
          targetContainerSelector: `#${matchedId}`,
          aspectRatio: rule.aspectRatio,
          mobileAspectRatio: rule.mobileAspectRatio,
          recommendedFrameCount: rule.defaultFrameCount,
          framePath: `/assets/3d/${rule.id.toLowerCase()}/frame_%d.webp`,
          scrubDelay: rule.scrubDelay,
          higgsfieldPromptHint: rule.promptFocus
        });
        totalLandmarksDetected++;
      }
    }

    manifest.pages[file] = {
      file,
      urlPath: file === 'index.html' ? '/' : `/${file.replace('.html', '')}`,
      interactiveElements: {
        buttons: buttonCount,
        inputs: inputCount,
        cards: cardCount,
        total: buttonCount + inputCount + cardCount
      },
      has3DLandmarks: pageLandmarks.length > 0,
      landmarks: pageLandmarks
    };
  }

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_MANIFEST_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');

  // Print Summary Table
  console.log('Operational 3D Landmark Discovery Results:');
  console.log('──────────────────────────────────────────────────────────────────────');
  console.log(
    'Page File'.padEnd(24) +
    'Landmarks'.padEnd(12) +
    'Micro-3D Targets'.padEnd(20) +
    '3D Sequence Bound'
  );
  console.log('──────────────────────────────────────────────────────────────────────');

  for (const [file, info] of Object.entries(manifest.pages)) {
    const landmarksStr = info.landmarks.length > 0 
      ? info.landmarks.map(l => l.sequenceId).join(', ') 
      : 'None (Micro-3D only)';
    
    console.log(
      file.padEnd(24) +
      String(info.landmarks.length).padEnd(12) +
      String(info.interactiveElements.total).padEnd(20) +
      landmarksStr
    );
  }

  console.log('──────────────────────────────────────────────────────────────────────');
  console.log(`\n✔ Scanned: ${files.length} pages`);
  console.log(`✔ Detected 3D Canvas Anchors: ${totalLandmarksDetected}`);
  console.log(`✔ Interactive Micro-3D Elements: ${totalInteractiveElements} (buttons, inputs, cards)`);
  console.log(`✔ Production Manifest Written to: ${OUTPUT_MANIFEST_PATH}\n`);

  return manifest;
}

if (require.main === module) {
  analyzeHtmlFiles();
}

module.exports = { analyzeHtmlFiles };
