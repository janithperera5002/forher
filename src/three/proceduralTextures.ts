import * as THREE from 'three';

export interface WoodTextureSet {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
}

export function createWoodTextures(
  baseHex: string,
  grainHex: string,
  maxAnisotropy: number,
): WoodTextureSet {
  const size = 512;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cCtx = colorCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d')!;

  cCtx.fillStyle = baseHex;
  cCtx.fillRect(0, 0, size, size);

  rCtx.fillStyle = '#999999';
  rCtx.fillRect(0, 0, size, size);

  // Fine organic wood grain streaks
  for (let i = 0; i < 160; i++) {
    const y = (i / 160) * size;
    const waveAmp = 4 + (i % 7) * 1.4;
    const waveFreq = 0.015 + (i % 5) * 0.004;

    cCtx.beginPath();
    rCtx.beginPath();
    for (let x = 0; x <= size; x += 16) {
      const offset = Math.sin(x * waveFreq + i * 0.7) * waveAmp;
      if (x === 0) {
        cCtx.moveTo(x, y + offset);
        rCtx.moveTo(x, y + offset);
      } else {
        cCtx.lineTo(x, y + offset);
        rCtx.lineTo(x, y + offset);
      }
    }

    cCtx.strokeStyle = grainHex;
    cCtx.globalAlpha = 0.09 + (i % 4) * 0.04;
    cCtx.lineWidth = 1 + (i % 3);
    cCtx.stroke();

    rCtx.strokeStyle = i % 2 === 0 ? '#b8b8b8' : '#707070';
    rCtx.globalAlpha = 0.16;
    rCtx.lineWidth = 1.5;
    rCtx.stroke();
  }
  cCtx.globalAlpha = 1;
  rCtx.globalAlpha = 1;

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = maxAnisotropy;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.anisotropy = maxAnisotropy;

  return { map, roughnessMap };
}

export function createVinylGrooveRoughnessTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2;

  ctx.fillStyle = '#383838';
  ctx.fillRect(0, 0, size, size);

  // Concentric LP micro-grooves
  for (let r = 82; r < 248; r += 2.2) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    const shade = Math.floor(38 + Math.sin(r * 0.6) * 26 + ((r * 13) % 18));
    ctx.strokeStyle = `rgb(${shade},${shade},${shade})`;
    ctx.lineWidth = 1.1;
    ctx.stroke();
  }

  // Quiet run-out ring
  ctx.beginPath();
  ctx.arc(cx, cy, 98, 0, Math.PI * 2);
  ctx.strokeStyle = '#1f1f1f';
  ctx.lineWidth = 5;
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createVinylLabelTexture(
  recipientName: string,
  trackTitle: string,
  accentHex: string,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2;

  // Warm cream parchment center label
  ctx.fillStyle = '#F7F1E7';
  ctx.fillRect(0, 0, size, size);

  // Outer botanical accent ring
  ctx.beginPath();
  ctx.arc(cx, cy, 224, 0, Math.PI * 2);
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 14;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, 202, 0, Math.PI * 2);
  ctx.strokeStyle = '#B5894B';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Top dedication text
  ctx.fillStyle = '#3B2F2B';
  ctx.textAlign = 'center';
  ctx.font = '600 28px "Cormorant Garamond", Georgia, serif';
  const cleanRecipient = recipientName.trim() || 'for my priority';
  const labelHeading = /^for\s+/i.test(cleanRecipient)
    ? cleanRecipient.toUpperCase()
    : `FOR ${cleanRecipient.toUpperCase()}`;
  ctx.fillText(labelHeading, cx, 134);

  // Botanical stem motif
  ctx.strokeStyle = '#6D7B61';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 56, 162);
  ctx.lineTo(cx + 56, 162);
  ctx.stroke();

  // Bottom track title
  ctx.fillStyle = '#5B4B44';
  ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
  const trimmedTitle =
    trackTitle.length > 26 ? `${trackTitle.slice(0, 24)}…` : trackTitle;
  ctx.fillText(trimmedTitle, cx, 366);

  ctx.fillStyle = '#8E7D73';
  ctx.font = '400 15px "IBM Plex Mono", monospace';
  ctx.fillText('33 1/3 RPM · SIDE A', cx, 404);

  // Center spindle hole visual
  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.fillStyle = '#B5894B';
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createCeramicTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, '#F5EFE6');
  grad.addColorStop(0.6, '#EAE0D2');
  grad.addColorStop(1, '#D5C7B6');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Subtle stoneware mineral speckles
  for (let i = 0; i < 650; i++) {
    const x = (i * 73) % size;
    const y = (i * 137) % size;
    const r = (i % 3) * 0.55 + 0.5;
    ctx.fillStyle = i % 3 === 0 ? 'rgba(92,74,62,0.18)' : 'rgba(130,112,96,0.13)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createTravertineTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#E5DDD0';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 140; i++) {
    const y = (i / 140) * size;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(182, 169, 150, 0.16)' : 'rgba(255, 252, 246, 0.2)';
    ctx.fillRect(0, y, size, 2 + (i % 4));
  }

  for (let i = 0; i < 420; i++) {
    const x = (i * 97) % size;
    const y = (i * 193) % size;
    const w = 6 + (i % 14);
    ctx.fillStyle = 'rgba(155, 141, 122, 0.14)';
    ctx.fillRect(x, y, w, 1.5);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const half = size / 2;

  const grad = ctx.createRadialGradient(half, half, 4, half, half, half);
  grad.addColorStop(0, 'rgba(32, 24, 18, 0.72)');
  grad.addColorStop(0.45, 'rgba(32, 24, 18, 0.34)');
  grad.addColorStop(1, 'rgba(32, 24, 18, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createMoonTextures(maxAnisotropy: number): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const size = 512;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cCtx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  // Warm pearl-ivory lunar regolith base
  cCtx.fillStyle = '#F3ECE0';
  cCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  // Soft lunar maria (subtle darker sage-taupe plains)
  const maria = [
    { x: 160, y: 180, r: 95, a: 0.14 },
    { x: 280, y: 210, r: 110, a: 0.12 },
    { x: 210, y: 310, r: 80, a: 0.1 },
    { x: 360, y: 150, r: 70, a: 0.11 },
  ];
  for (const m of maria) {
    const grad = cCtx.createRadialGradient(m.x, m.y, m.r * 0.15, m.x, m.y, m.r);
    grad.addColorStop(0, `rgba(176, 165, 152, ${m.a})`);
    grad.addColorStop(1, 'rgba(176, 165, 152, 0)');
    cCtx.fillStyle = grad;
    cCtx.beginPath();
    cCtx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
    cCtx.fill();
  }

  // Delicate craters
  for (let i = 0; i < 65; i++) {
    const cx = (i * 89 + 41) % size;
    const cy = (i * 151 + 27) % size;
    const r = 4 + ((i * 17) % 22);

    cCtx.beginPath();
    cCtx.arc(cx, cy, r, 0, Math.PI * 2);
    cCtx.fillStyle = 'rgba(205, 194, 179, 0.24)';
    cCtx.fill();
    cCtx.strokeStyle = 'rgba(255, 252, 245, 0.35)';
    cCtx.lineWidth = 1.2;
    cCtx.stroke();

    bCtx.beginPath();
    bCtx.arc(cx, cy, r, 0, Math.PI * 2);
    bCtx.fillStyle = 'rgba(92, 92, 92, 0.45)';
    bCtx.fill();
    bCtx.strokeStyle = 'rgba(195, 195, 195, 0.5)';
    bCtx.lineWidth = 1.5;
    bCtx.stroke();
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.colorSpace = THREE.NoColorSpace;
  bumpMap.anisotropy = maxAnisotropy;

  return { map, bumpMap };
}

export function createMoonHaloTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const half = size / 2;

  const grad = ctx.createRadialGradient(half, half, half * 0.32, half, half, half);
  grad.addColorStop(0, 'rgba(255, 246, 224, 0.52)');
  grad.addColorStop(0.45, 'rgba(247, 232, 200, 0.18)');
  grad.addColorStop(1, 'rgba(247, 232, 200, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createLinenWeaveTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#EFE7DA';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < size; i += 4) {
    ctx.fillStyle = i % 8 === 0 ? 'rgba(165, 149, 128, 0.16)' : 'rgba(255, 252, 245, 0.22)';
    ctx.fillRect(i, 0, 1.5, size);
    ctx.fillRect(0, i, size, 1.5);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createJournalCoverTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Warm sage-linen clothbound notebook cover
  ctx.fillStyle = '#E6DDD0';
  ctx.fillRect(0, 0, size, size);

  // Subtle fabric weave
  for (let i = 0; i < size; i += 4) {
    ctx.fillStyle = 'rgba(130, 114, 96, 0.08)';
    ctx.fillRect(i, 0, 1, size);
    ctx.fillRect(0, i, size, 1);
  }

  // Spine binding accent
  ctx.fillStyle = '#6D7B61';
  ctx.fillRect(0, 0, 62, size);

  // Delicate gold-foil border & botanical motif
  ctx.strokeStyle = '#B5894B';
  ctx.lineWidth = 4;
  ctx.strokeRect(86, 42, size - 118, size - 84);

  ctx.strokeStyle = 'rgba(181, 137, 75, 0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(286, 210, 44, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#5A4A40';
  ctx.textAlign = 'center';
  ctx.font = 'italic 600 32px "Cormorant Garamond", Georgia, serif';
  ctx.fillText('Notes & Melodies', 286, 326);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createFireflyGlowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const half = size / 2;

  const grad = ctx.createRadialGradient(half, half, 2, half, half, half);
  grad.addColorStop(0, 'rgba(255, 248, 200, 1.0)');
  grad.addColorStop(0.28, 'rgba(255, 224, 120, 0.55)');
  grad.addColorStop(0.62, 'rgba(232, 198, 92, 0.14)');
  grad.addColorStop(1, 'rgba(232, 198, 92, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

