import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Pure-Node PNG encoder generating valid RGBA PNG icons for PWA & iOS manifests
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ CRC_TABLE[(c ^ buf[i]) & 0xff];
  }
  return (c ^ -1) >>> 0;
}

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[n] = c;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(width, height, rgba) {
  const stride = width * 4 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0; // filter None
    rgba.copy(raw, y * stride + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idat),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

function renderKingdomIcon(size, maskable = false) {
  const buf = Buffer.alloc(size * size * 4);
  const pad = maskable ? 0.22 : 0.14;
  const quadStart = pad;
  const quadMid = 0.46;
  const quadEnd = 1 - pad;
  const quadMid2 = 0.54;

  const colors = {
    bg: [16, 20, 30, 255],
    slate: [26, 33, 48, 255],
    gold: [230, 169, 60, 255],
    red: [220, 38, 38, 255],
    blue: [37, 99, 235, 255],
    green: [22, 163, 74, 255],
    yellow: [217, 119, 6, 255],
    ivory: [231, 226, 216, 255],
  };

  for (let y = 0; y < size; y++) {
    const ny = y / size;
    for (let x = 0; x < size; x++) {
      const nx = x / size;
      let col = colors.bg;

      const dx = nx - 0.5;
      const dy = ny - 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Outer gold border ring
      if (!maskable && (nx < 0.06 || nx > 0.94 || ny < 0.06 || ny > 0.94) && nx > 0.03 && nx < 0.97 && ny > 0.03 && ny < 0.97) {
        col = colors.gold;
      }

      // Four kingdom quadrants
      if (nx >= quadStart && nx <= quadMid && ny >= quadStart && ny <= quadMid) col = colors.red;
      else if (nx >= quadMid2 && nx <= quadEnd && ny >= quadStart && ny <= quadMid) col = colors.blue;
      else if (nx >= quadStart && nx <= quadMid && ny >= quadMid2 && ny <= quadEnd) col = colors.green;
      else if (nx >= quadMid2 && nx <= quadEnd && ny >= quadMid2 && ny <= quadEnd) col = colors.yellow;

      // Center obsidian medallion with gold rim & crown silhouette
      if (dist < (maskable ? 0.16 : 0.20)) {
        col = colors.slate;
        if (dist > (maskable ? 0.14 : 0.175)) {
          col = colors.gold;
        } else {
          // Crown shape
          const cx = (nx - 0.5) / (maskable ? 0.12 : 0.15);
          const cy = (ny - 0.5) / (maskable ? 0.12 : 0.15);
          if (cy >= 0.28 && cy <= 0.48 && Math.abs(cx) <= 0.55) {
            col = colors.ivory;
          } else if (cy >= -0.45 && cy <= 0.22 && Math.abs(cx) <= 0.55) {
            const peak = Math.abs(cx) < 0.16 ? -0.45 : Math.abs(cx) > 0.35 ? -0.25 : 0.05;
            if (cy >= peak) col = colors.gold;
          }
        }
      }

      const idx = (y * size + x) * 4;
      buf[idx] = col[0];
      buf[idx + 1] = col[1];
      buf[idx + 2] = col[2];
      buf[idx + 3] = col[3];
    }
  }
  return encodePng(size, size, buf);
}

const publicDir = path.resolve(process.cwd(), 'public');
fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), renderKingdomIcon(192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), renderKingdomIcon(512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), renderKingdomIcon(512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), renderKingdomIcon(180, false));
console.log('Generated PWA PNG icons in /public');
