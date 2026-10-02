const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Lightweight zero-dependency PNG encoder
function createPng(width, height, getPixel) {
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    crcTable[n] = c >>> 0;
  }
  function crc32(buf) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function chunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4);
    data.copy(buf, 8);
    buf.writeUInt32BE(crc32(buf.subarray(4, 8 + len)), 8 + len);
    return buf;
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const raw = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    raw[offset++] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y);
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
      raw[offset++] = a;
    }
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

// Draw an adorable smiling cyber robot companion face
function renderRobotPixel(x, y, size) {
  // Normalize coordinates to 0..1
  const u = x / (size - 1);
  const v = y / (size - 1);

  // Background circular badge (dark navy with neon cyan ring)
  const cx = 0.5, cy = 0.5;
  const dist = Math.sqrt((u - cx) * (u - cx) + (v - cy) * (v - cy));

  // Outside circle
  if (dist > 0.49) {
    return [0, 0, 0, 0]; // Transparent
  }

  // Outer border ring (glowing cyan #38bdf8)
  if (dist >= 0.44 && dist <= 0.49) {
    return [56, 189, 248, 255];
  }

  // Antenna ball (vibrant pink #ec4899)
  const aDist = Math.sqrt((u - 0.5) * (u - 0.5) + (v - 0.16) * (v - 0.16));
  if (aDist < 0.075) {
    return [236, 72, 153, 255];
  }

  // Antenna pole (clean silver)
  if (Math.abs(u - 0.5) < 0.03 && v >= 0.18 && v <= 0.28) {
    return [203, 213, 225, 255];
  }

  // Robot Head: rounded rect from u in [0.22, 0.78], v in [0.28, 0.76]
  const headW = 0.56, headH = 0.48;
  const hx = u - 0.5, hy = v - 0.52;
  const headRadius = 0.14;
  const qx = Math.max(0, Math.abs(hx) - (headW / 2 - headRadius));
  const qy = Math.max(0, Math.abs(hy) - (headH / 2 - headRadius));
  const isHead = Math.sqrt(qx * qx + qy * qy) <= headRadius;

  if (isHead) {
    // Screen / Face area inside head: u in [0.28, 0.72], v in [0.34, 0.70]
    const screenW = 0.44, screenH = 0.36;
    const sx = u - 0.5, sy = v - 0.52;
    const screenRadius = 0.09;
    const sqx = Math.max(0, Math.abs(sx) - (screenW / 2 - screenRadius));
    const sqy = Math.max(0, Math.abs(sy) - (screenH / 2 - screenRadius));
    const isScreen = Math.sqrt(sqx * sqx + sqy * sqy) <= screenRadius;

    if (isScreen) {
      // Screen background: deep dark cyber black #090d16
      // Cheerful smiling eyes: ^ ^ curve (top peak, dipping at sides)
      // For left eye around (0.40, 0.46), right eye around (0.60, 0.46)
      const lx = u - 0.40, ly = v - 0.46;
      const rx = u - 0.60, ry = v - 0.46;
      const isLeftEye = (Math.abs(lx) <= 0.055 && Math.abs(ly - Math.abs(lx) * 0.6) < 0.022);
      const isRightEye = (Math.abs(rx) <= 0.055 && Math.abs(ry - Math.abs(rx) * 0.6) < 0.022);

      if (isLeftEye || isRightEye) {
        return [56, 189, 248, 255]; // Vivid cyan smiling eyes
      }

      // Wide happy smiling mouth: center at (0.50, 0.60), curving UP at sides
      const mx = u - 0.5;
      const targetMouthY = 0.60 - (0.07 * 0.07 - mx * mx) * 4;
      const isMouth = (Math.abs(mx) <= 0.065 && Math.abs(v - targetMouthY) < 0.02);
      if (isMouth) {
        return [56, 189, 248, 255]; // Vivid cyan smile
      }

      // Cute pink blush dots on cheeks
      const lbDist = Math.sqrt((u - 0.33) * (u - 0.33) + (v - 0.54) * (v - 0.54));
      const rbDist = Math.sqrt((u - 0.67) * (u - 0.67) + (v - 0.54) * (v - 0.54));
      if (lbDist < 0.035 || rbDist < 0.035) {
        return [244, 114, 182, 230]; // Cute pink blush
      }

      return [9, 13, 22, 255]; // Screen dark navy
    }

    // Outer white robot casing
    return [248, 250, 252, 255];
  }

  // Small cute side ears
  const isLeftEar = Math.sqrt((u - 0.18) * (u - 0.18) + (v - 0.52) * (v - 0.52)) < 0.045;
  const isRightEar = Math.sqrt((u - 0.82) * (u - 0.82) + (v - 0.52) * (v - 0.52)) < 0.045;
  if (isLeftEar || isRightEar) {
    return [56, 189, 248, 255]; // Cyan ear accents
  }

  // Badge background: dark deep blue #0b1329
  return [11, 19, 41, 240];
}

// Generate 32x32 for Windows system tray
const trayBuf = createPng(32, 32, (x, y) => renderRobotPixel(x, y, 32));
fs.writeFileSync(path.join(__dirname, 'tray-icon.png'), trayBuf);
console.log('Created electron/tray-icon.png (32x32,', trayBuf.length, 'bytes)');

// Generate 64x64 for high-DPI tray and window icon
const icon64Buf = createPng(64, 64, (x, y) => renderRobotPixel(x, y, 64));
fs.writeFileSync(path.join(__dirname, 'icon.png'), icon64Buf);
console.log('Created electron/icon.png (64x64,', icon64Buf.length, 'bytes)');
