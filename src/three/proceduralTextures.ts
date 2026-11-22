import * as THREE from 'three';

export function createStoneTileTexture(
  baseHex: string,
  accentHex: string,
  isStar = false,
  anisotropy = 4,
): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Rich carved stone radial tone
  const grad = ctx.createRadialGradient(size / 2, size / 2, 18, size / 2, size / 2, size * 0.72);
  grad.addColorStop(0, baseHex);
  grad.addColorStop(1, baseHex);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Inner subtle highlight bevel
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(8, 8, size - 16, 10);
  ctx.fillRect(8, 8, 10, size - 16);
  ctx.fillStyle = 'rgba(0,0,0,0.14)';
  ctx.fillRect(8, size - 18, size - 16, 10);
  ctx.fillRect(size - 18, 8, 10, size - 16);

  // Natural marble / sandstone veining & mineral fleck
  for (let i = 0; i < 620; i++) {
    const x = (i * 73) % size;
    const y = (i * 137) % size;
    const alpha = 0.025 + (i % 5) * 0.008;
    ctx.fillStyle = i % 2 === 0 ? `rgba(255,255,255,${alpha})` : `rgba(18,14,10,${alpha})`;
    ctx.fillRect(x, y, 3 + (i % 3), 3);
  }

  // Outer high-contrast obsidian engraved border
  ctx.strokeStyle = '#080C14';
  ctx.lineWidth = 10;
  ctx.strokeRect(4, 4, size - 8, size - 8);

  // Gold / Stone Bevel Frame
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 7;
  ctx.strokeRect(10, 10, size - 20, size - 20);
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(18, 18, size - 36, size - 36);

  if (isStar) {
    ctx.save();
    ctx.translate(size / 2, size / 2);

    // Subtle glowing sanctuary ring
    ctx.beginPath();
    ctx.arc(0, 0, 76, 0, Math.PI * 2);
    ctx.strokeStyle = '#FDE047';
    ctx.globalAlpha = 0.75;
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    const spikes = 8;
    const outerR = 64;
    const innerR = 28;
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Inner star highlight
    ctx.fillStyle = '#FFFDF5';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  return texture;
}

export function createDiceFaceTexture(pips: number, anisotropy = 4): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Royal ivory face with soft specular gradient
  const grad = ctx.createRadialGradient(size * 0.42, size * 0.38, 12, size / 2, size / 2, size * 0.72);
  grad.addColorStop(0, '#FFFDF9');
  grad.addColorStop(0.7, '#F2ECE1');
  grad.addColorStop(1, '#DECDB1');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Inner gold filigree inlay frame
  ctx.strokeStyle = '#E6A93C';
  ctx.lineWidth = 10;
  ctx.strokeRect(16, 16, size - 32, size - 32);
  ctx.strokeStyle = '#92400E';
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 24, size - 48, size - 48);

  const c = size / 2;
  const off = 56;
  const positions: Record<number, Array<[number, number]>> = {
    1: [[c, c]],
    2: [
      [c - off, c - off],
      [c + off, c + off],
    ],
    3: [
      [c - off, c - off],
      [c, c],
      [c + off, c + off],
    ],
    4: [
      [c - off, c - off],
      [c + off, c - off],
      [c - off, c + off],
      [c + off, c + off],
    ],
    5: [
      [c - off, c - off],
      [c + off, c - off],
      [c, c],
      [c - off, c + off],
      [c + off, c + off],
    ],
    6: [
      [c - off, c - off],
      [c + off, c - off],
      [c - off, c],
      [c + off, c],
      [c - off, c + off],
      [c + off, c + off],
    ],
  };

  for (const [px, py] of positions[pips] ?? []) {
    const rad = pips === 1 ? 28 : 20;
    // Subtle recessed pip shadow
    ctx.beginPath();
    ctx.arc(px + 2, py + 3, rad, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(px, py, rad, 0, Math.PI * 2);
    ctx.fillStyle = pips === 1 ? '#DC2626' : '#10141E';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#E6A93C';
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  return texture;
}

export function createSoftShadowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(size / 2, size / 2, 4, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
    grad.addColorStop(0.58, 'rgba(0, 0, 0, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createCourtyardGroundTexture(baseHex: string, accentHex: string): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);

  // Subtle botanical meadow tufts & natural organic mottling (no harsh grid lines)
  for (let i = 0; i < 1400; i++) {
    const x = (i * 97 + (i % 7) * 19) % size;
    const y = (i * 151 + (i % 11) * 13) % size;
    const r = 3 + (i % 6);
    ctx.fillStyle =
      i % 3 === 0
        ? 'rgba(255,255,255,0.035)'
        : i % 3 === 1
          ? 'rgba(0,0,0,0.05)'
          : `${accentHex}11`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createStonePathTexture(baseHex: string, mortarHex: string): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = mortarHex;
  ctx.fillRect(0, 0, size, size);

  const rows = 4;
  const h = size / rows;
  for (let r = 0; r < rows; r++) {
    const offset = r % 2 === 0 ? 0 : size * 0.25;
    for (let c = -1; c <= 2; c++) {
      const x = c * (size * 0.5) + offset;
      const y = r * h;
      ctx.fillStyle = baseHex;
      ctx.fillRect(x + 4, y + 4, size * 0.5 - 8, h - 8);
      ctx.fillStyle = 'rgba(255,255,255,0.09)';
      ctx.fillRect(x + 6, y + 6, size * 0.5 - 12, 6);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 6);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createCenterSanctuaryTexture(anisotropy = 4): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;

  // Background base
  ctx.fillStyle = '#252B37';
  ctx.fillRect(0, 0, size, size);

  // Left triangle: Crimson Red (meets Red home runway)
  ctx.fillStyle = '#D83B36';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(cx, cy);
  ctx.lineTo(0, size);
  ctx.closePath();
  ctx.fill();

  // Top triangle: Royal Blue (meets Blue home runway)
  ctx.fillStyle = '#3267D8';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size, 0);
  ctx.lineTo(cx, cy);
  ctx.closePath();
  ctx.fill();

  // Right triangle: Golden Amber (meets Yellow home runway)
  ctx.fillStyle = '#E5A52E';
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(size, size);
  ctx.lineTo(cx, cy);
  ctx.closePath();
  ctx.fill();

  // Bottom triangle: Emerald Green (meets Green home runway)
  ctx.fillStyle = '#229C5A';
  ctx.beginPath();
  ctx.moveTo(0, size);
  ctx.lineTo(cx, cy);
  ctx.lineTo(size, size);
  ctx.closePath();
  ctx.fill();

  // Subtle marble / stone texture flecks
  for (let i = 0; i < 900; i++) {
    const x = (i * 79) % size;
    const y = (i * 131) % size;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(x, y, 3, 3);
  }

  // Gold dividing diagonal fillets
  ctx.strokeStyle = '#D7A64B';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size, size);
  ctx.moveTo(size, 0);
  ctx.lineTo(0, size);
  ctx.stroke();

  // Outer gold & obsidian frame
  ctx.strokeStyle = '#080C14';
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, size - 14, size - 14);
  ctx.strokeStyle = '#D7A64B';
  ctx.lineWidth = 8;
  ctx.strokeRect(16, 16, size - 32, size - 32);

  // Center Obsidian circle with Royal Gold ring
  ctx.beginPath();
  ctx.arc(cx, cy, 96, 0, Math.PI * 2);
  ctx.fillStyle = '#252B37';
  ctx.fill();
  ctx.strokeStyle = '#D7A64B';
  ctx.lineWidth = 8;
  ctx.stroke();

  // Inner subtle golden ring
  ctx.beginPath();
  ctx.arc(cx, cy, 74, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(215, 166, 75, 0.45)';
  ctx.lineWidth = 3;
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}
