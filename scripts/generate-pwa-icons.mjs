import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Minimal zero-dependency PNG encoder that renders our LearnFlow squircle & maskable icons
function createPngBuffer(width, height, drawPixel) {
  const rawData = Buffer.alloc(height * (1 + width * 4));

  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 4);
    rawData[rowStart] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawPixel(x, y, width, height);
      const idx = rowStart + 1 + x * 4;
      rawData[idx] = r;
      rawData[idx + 1] = g;
      rawData[idx + 2] = b;
      rawData[idx + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData, { level: 6 });

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const combined = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(combined), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

function mix(a, b, t) {
  return Math.round(a + (b - a) * Math.max(0, Math.min(1, t)));
}

function renderIconPixel(x, y, w, h, isMaskable = false) {
  // Normalized coordinates [-1, 1]
  const nx = (x / w) * 2 - 1;
  const ny = (y / h) * 2 - 1;

  // Safe zone scaling for maskable icons (15% padding)
  const scale = isMaskable ? 1.25 : 1.0;
  const sx = nx * scale;
  const sy = ny * scale;

  // Squircle distance check for non-maskable icons
  if (!isMaskable) {
    const ax = Math.abs(nx);
    const ay = Math.abs(ny);
    const r = 0.22;
    const dx = Math.max(ax - (0.94 - r), 0);
    const dy = Math.max(ay - (0.94 - r), 0);
    const dist = Math.sqrt(dx * dx + dy * dy) - r;
    if (dist > 0.015) return [0, 0, 0, 0];
  }

  // Deep warm charcoal base gradient (#2D2D2B -> #1C1C1A)
  const gradT = (nx + ny + 2) / 4;
  let r = mix(45, 28, gradT);
  let g = mix(45, 28, gradT);
  let b = mix(43, 26, gradT);

  // Top-right Sage Green orb (#9AAB65)
  const dGreen = Math.hypot(sx - 0.45, sy + 0.42);
  if (dGreen < 0.44) {
    const aa = Math.min(1, (0.44 - dGreen) * 25);
    r = mix(r, 154, aa);
    g = mix(g, 171, aa);
    b = mix(b, 101, aa);
  }

  // Bottom-left Marigold Yellow orb (#F7D66E)
  const dYellow = Math.hypot(sx + 0.42, sy - 0.44);
  if (dYellow < 0.38) {
    const aa = Math.min(1, (0.38 - dYellow) * 25);
    r = mix(r, 247, aa);
    g = mix(g, 214, aa);
    b = mix(b, 110, aa);
  }

  // Central Periwinkle Blue Ring (#B6CAEB)
  const dRing = Math.abs(Math.hypot(sx - 0.08, sy - 0.08) - 0.34);
  if (dRing < 0.11) {
    const aa = Math.min(1, (0.11 - dRing) * 30);
    r = mix(r, 182, aa);
    g = mix(g, 202, aa);
    b = mix(b, 235, aa);
  }

  // Blossom Pink Flow Wave (#FFB2DD)
  const waveY = -0.18 * Math.sin(sx * 3.4) - 0.04;
  const dWave = Math.abs(sy - waveY);
  if (Math.abs(sx) < 0.56 && dWave < 0.13) {
    const aa = Math.min(1, (0.13 - dWave) * 30);
    r = mix(r, 255, aa);
    g = mix(g, 178, aa);
    b = mix(b, 221, aa);
  }

  // Glowing Cream Core (#FFFCF5) with Gold Center (#F7D66E)
  const dCore = Math.hypot(sx + 0.2, sy + 0.22);
  if (dCore < 0.18) {
    const aa = Math.min(1, (0.18 - dCore) * 35);
    r = mix(r, 255, aa);
    g = mix(g, 252, aa);
    b = mix(b, 245, aa);
  }
  if (dCore < 0.08) {
    const aa = Math.min(1, (0.08 - dCore) * 40);
    r = mix(r, 247, aa);
    g = mix(g, 214, aa);
    b = mix(b, 110, aa);
  }

  return [r, g, b, 255];
}

const pubDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true });

fs.writeFileSync(
  path.join(pubDir, 'pwa-192x192.png'),
  createPngBuffer(192, 192, (x, y, w, h) => renderIconPixel(x, y, w, h, false))
);
fs.writeFileSync(
  path.join(pubDir, 'pwa-512x512.png'),
  createPngBuffer(512, 512, (x, y, w, h) => renderIconPixel(x, y, w, h, false))
);
fs.writeFileSync(
  path.join(pubDir, 'pwa-maskable-512x512.png'),
  createPngBuffer(512, 512, (x, y, w, h) => renderIconPixel(x, y, w, h, true))
);
fs.writeFileSync(
  path.join(pubDir, 'apple-touch-icon.png'),
  createPngBuffer(180, 180, (x, y, w, h) => renderIconPixel(x, y, w, h, true))
);

console.log('Generated all PWA PNG icons successfully.');
