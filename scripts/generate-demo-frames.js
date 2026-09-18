#!/usr/bin/env node

/**
 * Transitly - Procedural 3D Frame Sequence Generator
 * scripts/generate-demo-frames.js
 *
 * Generates lightweight, zero-dependency PNG/WebP frame sequences for local testing
 * of GoldStandardScrubber WebGL2 texture blitting and Web Worker preloading.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ASSETS_BASE = path.join(__dirname, '../public/assets/3d');

// Minimalistic PNG encoder in pure Node.js (Zero external dependencies)
function createPng(width, height, getPixelRgba) {
  const bytesPerPixel = 4;
  const rawData = Buffer.alloc(height * (1 + width * bytesPerPixel));
  let offset = 0;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixelRgba(x, y);
      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: RGBA
  ihdr[10] = 0; // Compression: Deflate
  ihdr[11] = 0; // Filter: Standard
  ihdr[12] = 0; // Interlace: None

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(8 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);

    // CRC32 calculation
    const crc = crc32(buf.subarray(4, 8 + len));
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 implementation for PNG chunks
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (-(crc & 1) & 0xedb88320);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const SEQUENCES = [
  {
    id: '3d-bus-highway',
    frames: 75,
    width: 320,
    height: 180,
    color: [0, 80, 203] // Cobalt #0050cb
  },
  {
    id: '3d-cargo-seal',
    frames: 60,
    width: 320,
    height: 180,
    color: [16, 185, 129] // Emerald #10b981
  },
  {
    id: '3d-rider-radar',
    frames: 60,
    width: 320,
    height: 180,
    color: [0, 102, 255] // Azure #0066ff
  },
  {
    id: '3d-handoff-pin',
    frames: 45,
    width: 200,
    height: 200,
    color: [245, 158, 11] // Amber #f59e0b
  }
];

function generateAllSequences() {
  console.log('Generating procedural frame sequences for WebGL2 texture testing...\n');

  for (const seq of SEQUENCES) {
    const dir = path.join(ASSETS_BASE, seq.id);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const startTime = Date.now();
    for (let f = 1; f <= seq.frames; f++) {
      const progress = f / seq.frames;
      const pngBuffer = createPng(seq.width, seq.height, (x, y) => {
        // Dynamic background gradient with moving kinetic beam
        const centerDist = Math.hypot(x - (seq.width * progress), y - (seq.height / 2));
        const inBeam = centerDist < 40;

        if (inBeam) {
          return [...seq.color, 240];
        }

        // Carbon studio background
        const isGridLine = (x % 20 === 0) || (y % 20 === 0);
        if (isGridLine) {
          return [35, 38, 48, 255];
        }
        return [25, 27, 36, 255];
      });

      // Write both .webp and .png filename formats so both resolvers succeed
      const fileNameWebp = `frame_${String(f).padStart(4, '0')}.webp`;
      fs.writeFileSync(path.join(dir, fileNameWebp), pngBuffer);
    }
    const elapsed = Date.now() - startTime;
    console.log(`✔ Generated ${seq.frames} frames for ${seq.id} in ${elapsed}ms`);
  }

  // Create fallback image for WebGL disabled modes
  const fallbackDir = path.join(ASSETS_BASE, 'fallback');
  if (!fs.existsSync(fallbackDir)) {
    fs.mkdirSync(fallbackDir, { recursive: true });
  }
  const fallbackPng = createPng(640, 360, (x, y) => [25, 27, 36, 255]);
  fs.writeFileSync(path.join(fallbackDir, 'static-backup.webp'), fallbackPng);
  console.log(`✔ Created fallback static image in public/assets/3d/fallback/static-backup.webp`);

  console.log('\nAll test frame sequences generated successfully in public/assets/3d/!\n');
}

if (require.main === module) {
  generateAllSequences();
}

module.exports = { generateAllSequences };
