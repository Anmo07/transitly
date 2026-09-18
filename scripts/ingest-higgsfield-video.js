#!/usr/bin/env node

/**
 * Transitly - Universal 3D Video-to-WebP Frame Ingestion Pipeline
 * scripts/ingest-higgsfield-video.js
 *
 * Model-Agnostic: Accepts MP4/MOV videos from Kling AI, Hailuo (Minimax),
 * Luma Dream Machine, Runway, Spline, Blender, or Higgsfield.
 *
 * Usage:
 *   node scripts/ingest-higgsfield-video.js <video-file-path> <sequence-id>
 *
 * Examples:
 *   node scripts/ingest-higgsfield-video.js ./raw-renders/highway.mp4 3D-BUS-HIGHWAY
 *   node scripts/ingest-higgsfield-video.js ./raw-renders/cargo.mp4 3D-CARGO-SEAL
 *   node scripts/ingest-higgsfield-video.js ./raw-renders/radar.mp4 3D-RIDER-RADAR
 *   node scripts/ingest-higgsfield-video.js ./raw-renders/pin.mp4 3D-HANDOFF-PIN
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SEQUENCE_MAP = {
  '3D-BUS-HIGHWAY': {
    folder: '3d-bus-highway',
    defaultFrames: 75,
    scale: '1280:-1',
    description: 'Intercity Bus Carrier Telemetry'
  },
  '3D-CARGO-SEAL': {
    folder: '3d-cargo-seal',
    defaultFrames: 60,
    scale: '1080:1080',
    description: 'Cryptographic QR Bay Stowage'
  },
  '3D-RIDER-RADAR': {
    folder: '3d-rider-radar',
    defaultFrames: 60,
    scale: '1280:-1',
    description: 'Delivery Partner Telematics & Radar Dock'
  },
  '3D-HANDOFF-PIN': {
    folder: '3d-handoff-pin',
    defaultFrames: 45,
    scale: '800:800',
    description: 'Doorstep Custody 4-Digit PIN Lock'
  }
};

const args = process.argv.slice(2);

console.log('╔════════════════════════════════════════════════════════════════════╗');
console.log('║       TRANSITLY UNIVERSAL 3D VIDEO INGESTION PIPELINE              ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

if (args.length < 2) {
  console.log('Usage:');
  console.log('  node scripts/ingest-higgsfield-video.js <video-file-path> <sequence-id>\n');
  console.log('Available Sequence IDs:');
  Object.entries(SEQUENCE_MAP).forEach(([id, meta]) => {
    console.log(`  • ${id.padEnd(16)} -> ${meta.description} (Target: ~${meta.defaultFrames} frames)`);
  });
  console.log('');
  process.exit(0);
}

const [inputVideo, sequenceKey] = args;
const sequenceId = sequenceKey.toUpperCase();
const targetConfig = SEQUENCE_MAP[sequenceId];

if (!targetConfig) {
  console.error(`❌ Error: Unknown sequence ID "${sequenceKey}".`);
  console.error(`Allowed sequences: ${Object.keys(SEQUENCE_MAP).join(', ')}`);
  process.exit(1);
}

if (!fs.existsSync(inputVideo)) {
  console.error(`❌ Error: Input video file not found at: ${inputVideo}`);
  process.exit(1);
}

// Verify FFmpeg availability
let hasFfmpeg = false;
try {
  execSync('which ffmpeg', { stdio: 'pipe' });
  hasFfmpeg = true;
} catch (_) {
  hasFfmpeg = false;
}

if (!hasFfmpeg) {
  console.warn('⚠️  FFmpeg CLI is not installed on this system.\n');
  console.log('To automatically extract and convert MP4 video into optimized WebP frame scrubs:');
  console.log('  1. Install FFmpeg on macOS:');
  console.log('     brew install ffmpeg\n');
  console.log('  2. Or extract frames manually into:');
  const targetDir = path.join(__dirname, '../public/assets/3d', targetConfig.folder);
  console.log(`     ${targetDir}/frame_0.webp, frame_1.webp ... frame_N.webp\n`);
  console.log('  3. Then re-run scanner to update manifest:');
  console.log('     npm run 3d:scan\n');
  process.exit(1);
}

const outputDir = path.join(__dirname, '../public/assets/3d', targetConfig.folder);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log(`Ingesting video for sequence: ${sequenceId} (${targetConfig.description})`);
console.log(`Source Video: ${inputVideo}`);
console.log(`Destination:  ${outputDir}\n`);

// Clean old frames
const oldFiles = fs.readdirSync(outputDir).filter(f => f.startsWith('frame_'));
oldFiles.forEach(f => fs.unlinkSync(path.join(outputDir, f)));

try {
  // Extract frames with WebP compression, quality 80, fast decoding
  const ffmpegCmd = `ffmpeg -y -i "${inputVideo}" -vf "scale=${targetConfig.scale}" -c:v libwebp -lossless 0 -compression_level 4 -q:v 80 "${path.join(outputDir, 'frame_%d.webp')}"`;
  console.log(`Executing FFmpeg extraction...`);
  execSync(ffmpegCmd, { stdio: 'inherit' });

  const generatedFrames = fs.readdirSync(outputDir).filter(f => f.startsWith('frame_'));
  console.log(`\n✔ Successfully extracted ${generatedFrames.length} WebP frames into ${outputDir}`);

  // Re-run scanner to update manifest
  console.log('Updating 3D Scrubber Manifest...');
  execSync('node scripts/generate-3d-scrubbers.js', { stdio: 'inherit' });
  console.log('\n✔ Ingestion complete! New animation is immediately active in the application.');
} catch (err) {
  console.error(`❌ Failed to ingest video:`, err.message);
  process.exit(1);
}
