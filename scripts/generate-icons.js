import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCRC32Table();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function generatePNG(width, height, isMaskable = false) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // RGBA color type
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Raw image scanlines
  const rawBytesPerRow = width * 4;
  const rawBuffer = Buffer.alloc((rawBytesPerRow + 1) * height);

  const cx = width / 2;
  const cy = height / 2;
  const rCorner = width * 0.22;

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawBuffer[offset++] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      // Background gradient: #0f172a to #1e293b
      const grad = (x + y) / (width + height);
      let r = Math.round(15 + grad * (30 - 15));
      let g = Math.round(23 + grad * (41 - 23));
      let b = Math.round(42 + grad * (59 - 42));
      let a = 255;

      // Squircle / rounded box
      if (!isMaskable) {
        const dx = Math.abs(x - cx);
        const dy = Math.abs(y - cy);
        const half = width * 0.46;
        if (dx > half || dy > half) {
          const cornerX = Math.max(0, dx - (half - rCorner));
          const cornerY = Math.max(0, dy - (half - rCorner));
          if (cornerX * cornerX + cornerY * cornerY > rCorner * rCorner) {
            a = 0;
          }
        }
      }

      // Draw printer motif inside safe zone
      const distToCenter = Math.hypot(x - cx, y - cy);
      const nozzleY = cy - height * 0.08;
      // Extruder head: blue box
      if (Math.abs(x - cx) < width * 0.12 && Math.abs(y - nozzleY) < height * 0.08) {
        r = 37; g = 99; b = 235; a = 255; // #2563eb
      }
      // Nozzle tip: amber triangle
      if (Math.abs(x - cx) < (y - (nozzleY + height * 0.08)) * 0.8 && y >= nozzleY + height * 0.08 && y < nozzleY + height * 0.14) {
        r = 245; g = 158; b = 11; a = 255; // #f59e0b
      }
      // Printed layers: cyan bars
      const bedY = cy + height * 0.18;
      if (Math.abs(x - cx) < width * 0.22 && Math.abs(y - bedY) < height * 0.02) {
        r = 56; g = 189; b = 248; a = 255; // #38bdf8
      }
      if (Math.abs(x - cx) < width * 0.16 && Math.abs(y - (bedY - height * 0.04)) < height * 0.015) {
        r = 56; g = 189; b = 248; a = 255; // #38bdf8
      }
      // Filament spool circle on top left
      const spoolX = cx - width * 0.26;
      const spoolY = cy - height * 0.24;
      const dSpool = Math.hypot(x - spoolX, y - spoolY);
      if (dSpool < width * 0.1 && dSpool > width * 0.05) {
        r = 56; g = 189; b = 248; a = 255;
      }
      // Rp badge circle on top right
      const badgeX = cx + width * 0.25;
      const badgeY = cy - height * 0.23;
      const dBadge = Math.hypot(x - badgeX, y - badgeY);
      if (dBadge < width * 0.11) {
        r = 5; g = 150; b = 105; a = 255; // emerald #059669
      }

      rawBuffer[offset++] = r;
      rawBuffer[offset++] = g;
      rawBuffer[offset++] = b;
      rawBuffer[offset++] = a;
    }
  }

  const compressed = zlib.deflateSync(rawBuffer);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const pubDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true });

fs.writeFileSync(path.join(pubDir, 'pwa-192x192.png'), generatePNG(192, 192, false));
fs.writeFileSync(path.join(pubDir, 'pwa-512x512.png'), generatePNG(512, 512, false));
fs.writeFileSync(path.join(pubDir, 'pwa-maskable-512x512.png'), generatePNG(512, 512, true));
fs.writeFileSync(path.join(pubDir, 'apple-touch-icon.png'), generatePNG(180, 180, false));
console.log('Generated PNG icons successfully.');
