import * as THREE from 'three';
import {
  createCeramicTexture,
  createContactShadowTexture,
  createFireflyGlowTexture,
  createJournalCoverTexture,
  createLinenWeaveTexture,
  createMoonHaloTexture,
  createMoonTextures,
  createTravertineTexture,
  createVinylGrooveRoughnessTexture,
  createWoodTextures,
} from './proceduralTextures';
import { FLOWER_PALETTES, FlowerPaletteId, WOOD_FINISHES, WoodFinishId } from '../types/conservatory';

export interface TurntableRig {
  group: THREE.Group;
  vinylDiscGroup: THREE.Group;
  labelMesh: THREE.Mesh;
  tonearmPivot: THREE.Group;
  plinthMat: THREE.MeshStandardMaterial;
  volumeKnob: THREE.Mesh;
  toggleSwitch: THREE.Mesh;
}

export interface BouquetRig {
  group: THREE.Group;
  swayPivot: THREE.Group;
  primaryPetalMat: THREE.MeshPhysicalMaterial;
  secondaryPetalMat: THREE.MeshPhysicalMaterial;
  centerStamenMat: THREE.MeshStandardMaterial;
  bloomGroups: THREE.Group[];
}

export interface EaselRig {
  group: THREE.Group;
  artworkMesh: THREE.Mesh;
  artworkMat: THREE.MeshStandardMaterial;
  frameMat: THREE.MeshStandardMaterial;
}

export interface BalloonRig {
  group: THREE.Group;
  floatPivot: THREE.Group;
  envelopeMat: THREE.MeshPhysicalMaterial;
}

export interface MoonRig {
  group: THREE.Group;
  orbMesh: THREE.Mesh;
  ringGroup: THREE.Group;
  haloSprite: THREE.Sprite;
}

export interface PollenMoteData {
  baseX: number;
  baseY: number;
  baseZ: number;
  speed: number;
  phase: number;
  radius: number;
  scale: number;
}

export interface PetalParticleData {
  x: number;
  y: number;
  z: number;
  curX: number;
  curY: number;
  curZ: number;
  vx: number;
  vz: number;
  vyBoost: number;
  fallSpeed: number;
  swayFreq: number;
  swayAmp: number;
  phase: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  spinX: number;
  spinY: number;
  spinZ: number;
  scale: number;
}

export interface PetalParticleRig {
  mesh: THREE.InstancedMesh;
  material: THREE.MeshPhysicalMaterial;
  data: PetalParticleData[];
  updateColors: (paletteId: FlowerPaletteId) => void;
}

export interface BubbleParticleData {
  x: number;
  y: number;
  z: number;
  homeX: number;
  homeZ: number;
  vx: number;
  vz: number;
  riseSpeed: number;
  swayFreq: number;
  swayAmp: number;
  phase: number;
  baseScale: number;
  currentScale: number;
  radius: number;
  popTimer: number;
}

export interface BubbleParticleRig {
  mesh: THREE.InstancedMesh;
  material: THREE.MeshPhysicalMaterial;
  data: BubbleParticleData[];
  updateColors: (paletteId: FlowerPaletteId) => void;
}

export interface SnowFlakeData {
  x: number;
  y: number;
  z: number;
  fallSpeed: number;
  swayFreqX: number;
  swayFreqZ: number;
  swayAmp: number;
  phase: number;
  rotX: number;
  rotY: number;
  spin: number;
  scale: number;
}

export interface SnowParticleRig {
  mesh: THREE.InstancedMesh;
  material: THREE.MeshStandardMaterial;
  data: SnowFlakeData[];
}

export interface FireflyData {
  baseX: number;
  baseY: number;
  baseZ: number;
  wanderFreqX: number;
  wanderFreqY: number;
  wanderFreqZ: number;
  wanderAmpX: number;
  wanderAmpY: number;
  wanderAmpZ: number;
  phase: number;
  pulseSpeed: number;
  pulseOffset: number;
  baseScale: number;
  tintR: number;
  tintG: number;
  tintB: number;
}

export interface FireflyParticleRig {
  coreMesh: THREE.InstancedMesh;
  haloMesh: THREE.InstancedMesh;
  coreMaterial: THREE.MeshBasicMaterial;
  haloMaterial: THREE.MeshBasicMaterial;
  data: FireflyData[];
}

export interface TeaCupRig {
  group: THREE.Group;
  steamSprites: THREE.Mesh[];
}

export interface JournalRig {
  group: THREE.Group;
  ribbonMat: THREE.MeshStandardMaterial;
  blossomMat: THREE.MeshPhysicalMaterial;
}

export interface LanternRig {
  group: THREE.Group;
  flameMesh: THREE.Mesh;
  candleLight: THREE.PointLight;
}

export interface RestingPetalsRig {
  group: THREE.Group;
  primaryMat: THREE.MeshPhysicalMaterial;
  secondaryMat: THREE.MeshPhysicalMaterial;
}

function createRoundedRectShape(width: number, depth: number, radius: number): THREE.Shape {
  const s = new THREE.Shape();
  const hw = width / 2;
  const hd = depth / 2;
  s.moveTo(-hw + radius, -hd);
  s.lineTo(hw - radius, -hd);
  s.quadraticCurveTo(hw, -hd, hw, -hd + radius);
  s.lineTo(hw, hd - radius);
  s.quadraticCurveTo(hw, hd, hw - radius, hd);
  s.lineTo(-hw + radius, hd);
  s.quadraticCurveTo(-hw, hd, -hw, hd - radius);
  s.lineTo(-hw, -hd + radius);
  s.quadraticCurveTo(-hw, -hd, -hw + radius, -hd);
  return s;
}

export function createContactShadowPlane(
  width: number,
  depth: number,
  opacity = 0.42,
): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(width, depth);
  const mat = new THREE.MeshBasicMaterial({
    map: createContactShadowTexture(),
    transparent: true,
    opacity,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.002;
  mesh.renderOrder = 1;
  return mesh;
}

export function createConservatoryTable(maxAnisotropy: number): THREE.Group {
  const group = new THREE.Group();
  const travTex = createTravertineTexture(maxAnisotropy);
  travTex.repeat.set(2, 2);

  // 1. Top travertine tabletop slab (top face flush at y = 0)
  const topGeo = new THREE.CylinderGeometry(3.3, 3.24, 0.14, 64);
  const topMat = new THREE.MeshStandardMaterial({
    map: travTex,
    color: 0xf4ede3,
    roughness: 0.72,
    metalness: 0.04,
  });
  const topMesh = new THREE.Mesh(topGeo, topMat);
  topMesh.position.y = -0.07;
  topMesh.receiveShadow = true;
  group.add(topMesh);

  // 2. Brushed brass perimeter inlay ring
  const brassMat = new THREE.MeshPhysicalMaterial({
    color: 0xc59a55,
    metalness: 0.92,
    roughness: 0.22,
    anisotropy: 0.75,
  });
  const ringGeo = new THREE.TorusGeometry(3.28, 0.028, 16, 96);
  const ringMesh = new THREE.Mesh(ringGeo, brassMat);
  ringMesh.rotation.x = Math.PI / 2;
  ringMesh.position.y = -0.025;
  group.add(ringMesh);

  // Subtle recessed brass inlay band inside the travertine slab
  const inlayMat = new THREE.MeshPhysicalMaterial({
    color: 0xc59a55,
    metalness: 0.9,
    roughness: 0.28,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const inlayMesh = new THREE.Mesh(
    new THREE.RingGeometry(2.58, 2.615, 96),
    inlayMat,
  );
  inlayMesh.rotation.x = -Math.PI / 2;
  inlayMesh.position.y = 0.001;
  inlayMesh.receiveShadow = true;
  group.add(inlayMesh);

  // 3. Lower walnut apron rim
  const walnut = createWoodTextures('#543827', '#331F14', maxAnisotropy);
  const apronGeo = new THREE.CylinderGeometry(3.12, 2.95, 0.18, 64);
  const apronMat = new THREE.MeshStandardMaterial({
    map: walnut.map,
    roughnessMap: walnut.roughnessMap,
    roughness: 0.62,
    metalness: 0.04,
  });
  const apronMesh = new THREE.Mesh(apronGeo, apronMat);
  apronMesh.position.y = -0.23;
  group.add(apronMesh);

  // 4. Tapered legs (4 legs)
  const legGeo = new THREE.CylinderGeometry(0.11, 0.055, 2.4, 20);
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    const leg = new THREE.Mesh(legGeo, apronMat);
    leg.position.set(Math.cos(angle) * 2.1, -1.48, Math.sin(angle) * 2.1);
    leg.rotation.z = Math.cos(angle) * 0.09;
    leg.rotation.x = -Math.sin(angle) * 0.09;
    group.add(leg);
  }

  return group;
}

export function createTurntableGroup(
  woodId: WoodFinishId,
  maxAnisotropy: number,
): TurntableRig {
  const group = new THREE.Group();
  const woodSpec = WOOD_FINISHES[woodId];
  const woodTex = createWoodTextures(woodSpec.baseHex, woodSpec.grainHex, maxAnisotropy);

  const plinthMat = new THREE.MeshStandardMaterial({
    map: woodTex.map,
    roughnessMap: woodTex.roughnessMap,
    roughness: woodSpec.roughness,
    metalness: 0.05,
  });

  const brassMat = new THREE.MeshPhysicalMaterial({
    color: 0xd0a65d,
    metalness: 0.94,
    roughness: 0.18,
    anisotropy: 0.85,
  });

  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x262423,
    metalness: 0.78,
    roughness: 0.34,
  });

  // Ground contact shadow
  group.add(createContactShadowPlane(2.55, 2.05, 0.45));

  // 1. 4 Turned brass isolation feet (LatheGeometry, y = 0 to 0.06)
  const footPoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.085, 0),
    new THREE.Vector2(0.095, 0.02),
    new THREE.Vector2(0.072, 0.04),
    new THREE.Vector2(0.08, 0.062),
    new THREE.Vector2(0, 0.062),
  ];
  const footGeo = new THREE.LatheGeometry(footPoints, 28);
  const footOffsets: [number, number][] = [
    [-0.9, -0.66],
    [0.9, -0.66],
    [-0.9, 0.66],
    [0.9, 0.66],
  ];
  for (const [fx, fz] of footOffsets) {
    const foot = new THREE.Mesh(footGeo, brassMat);
    foot.position.set(fx, 0, fz);
    foot.castShadow = true;
    group.add(foot);
  }

  // 2. Beveled wooden plinth (ExtrudeGeometry)
  const plinthShape = createRoundedRectShape(2.2, 1.68, 0.1);
  const plinthGeo = new THREE.ExtrudeGeometry(plinthShape, {
    depth: 0.19,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.025,
    bevelSegments: 4,
  });
  plinthGeo.rotateX(Math.PI / 2);
  // Top face sits at y = 0.06 + 0.19 + 0.025 = 0.275
  const plinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
  plinthMesh.position.y = 0.265;
  plinthMesh.castShadow = true;
  plinthMesh.receiveShadow = true;
  group.add(plinthMesh);

  // 3. Recessed brushed brass top trim plate under platter
  const plateGeo = new THREE.CylinderGeometry(0.74, 0.75, 0.02, 48);
  const plateMesh = new THREE.Mesh(plateGeo, darkMetalMat);
  plateMesh.position.set(-0.24, 0.292, 0.02);
  plateMesh.receiveShadow = true;
  group.add(plateMesh);

  // 4. Heavy brushed brass platter (LatheGeometry)
  const platterPoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.69, 0),
    new THREE.Vector2(0.71, 0.015),
    new THREE.Vector2(0.71, 0.055),
    new THREE.Vector2(0.69, 0.072),
    new THREE.Vector2(0, 0.072),
  ];
  const platterGeo = new THREE.LatheGeometry(platterPoints, 64);
  const platterMesh = new THREE.Mesh(platterGeo, brassMat);
  platterMesh.position.set(-0.24, 0.302, 0.02);
  platterMesh.castShadow = true;
  platterMesh.receiveShadow = true;
  group.add(platterMesh);

  // 5. Vinyl LP disc + custom center label (rotates during playback)
  const vinylDiscGroup = new THREE.Group();
  vinylDiscGroup.position.set(-0.24, 0.376, 0.02);

  const grooveRoughMap = createVinylGrooveRoughnessTexture(maxAnisotropy);
  const vinylMat = new THREE.MeshPhysicalMaterial({
    color: 0x141315,
    roughness: 0.32,
    roughnessMap: grooveRoughMap,
    metalness: 0.06,
    clearcoat: 0.72,
    clearcoatRoughness: 0.18,
  });
  const vinylGeo = new THREE.CylinderGeometry(0.67, 0.67, 0.014, 64);
  const vinylMesh = new THREE.Mesh(vinylGeo, vinylMat);
  vinylMesh.castShadow = true;
  vinylMesh.receiveShadow = true;
  vinylDiscGroup.add(vinylMesh);

  // Center paper label disc
  const labelGeo = new THREE.CylinderGeometry(0.23, 0.23, 0.016, 48);
  const labelMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.78,
    metalness: 0.02,
  });
  const labelMesh = new THREE.Mesh(labelGeo, labelMat);
  labelMesh.position.y = 0.001;
  labelMesh.rotation.y = -Math.PI / 2;
  vinylDiscGroup.add(labelMesh);

  // 6. Center brass spindle
  const spindleGeo = new THREE.CylinderGeometry(0.018, 0.022, 0.09, 20);
  const spindleMesh = new THREE.Mesh(spindleGeo, brassMat);
  spindleMesh.position.y = 0.04;
  vinylDiscGroup.add(spindleMesh);

  group.add(vinylDiscGroup);

  // 7. Gimbal tonearm turret base (right-rear corner of plinth)
  const gimbalBase = new THREE.Group();
  gimbalBase.position.set(0.74, 0.29, -0.44);

  const turretRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.16, 0.04, 32),
    darkMetalMat,
  );
  turretRing.castShadow = true;
  gimbalBase.add(turretRing);

  const turretPost = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.068, 0.12, 24),
    brassMat,
  );
  turretPost.position.y = 0.075;
  turretPost.castShadow = true;
  gimbalBase.add(turretPost);
  group.add(gimbalBase);

  // 8. S-curved TubeGeometry tonearm + counterweight + cartridge headshell
  const tonearmPivot = new THREE.Group();
  tonearmPivot.position.set(0.74, 0.42, -0.44);

  const armCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, -0.14),
    new THREE.Vector3(0, 0.012, 0),
    new THREE.Vector3(-0.04, 0.012, 0.26),
    new THREE.Vector3(-0.18, 0.006, 0.56),
    new THREE.Vector3(-0.28, -0.012, 0.78),
  ]);
  const armGeo = new THREE.TubeGeometry(armCurve, 36, 0.014, 12, false);
  const armMesh = new THREE.Mesh(armGeo, brassMat);
  armMesh.castShadow = true;
  tonearmPivot.add(armMesh);

  // Counterweight cylinder
  const counterweight = new THREE.Mesh(
    new THREE.CylinderGeometry(0.052, 0.052, 0.09, 24),
    darkMetalMat,
  );
  counterweight.rotation.x = Math.PI / 2;
  counterweight.position.set(0, 0, -0.15);
  counterweight.castShadow = true;
  tonearmPivot.add(counterweight);

  // Headshell + cartridge
  const headshell = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.024, 0.11),
    darkMetalMat,
  );
  headshell.position.set(-0.30, -0.018, 0.82);
  headshell.rotation.y = 0.36;
  headshell.castShadow = true;
  tonearmPivot.add(headshell);

  const cartridgeAccent = new THREE.Mesh(
    new THREE.BoxGeometry(0.042, 0.02, 0.055),
    brassMat,
  );
  cartridgeAccent.position.set(-0.30, -0.032, 0.83);
  cartridgeAccent.rotation.y = 0.36;
  tonearmPivot.add(cartridgeAccent);

  // Resting angle off the record
  tonearmPivot.rotation.y = -0.34;
  group.add(tonearmPivot);

  // 9. Tonearm rest cradle
  const restPost = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.02, 0.1, 16),
    darkMetalMat,
  );
  restPost.position.set(0.84, 0.34, 0.04);
  group.add(restPost);

  // 10. Knurled brass rotary speed/volume dial + toggle switch
  const volumeKnob = new THREE.Mesh(
    new THREE.CylinderGeometry(0.072, 0.08, 0.055, 28),
    brassMat,
  );
  volumeKnob.position.set(0.8, 0.315, 0.56);
  volumeKnob.castShadow = true;
  group.add(volumeKnob);

  const toggleBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.036, 0.018, 20),
    darkMetalMat,
  );
  toggleBase.position.set(0.56, 0.298, 0.62);
  group.add(toggleBase);

  const toggleSwitch = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.012, 0.065, 12),
    brassMat,
  );
  toggleSwitch.position.set(0.56, 0.325, 0.62);
  toggleSwitch.rotation.x = 0.35;
  group.add(toggleSwitch);

  return {
    group,
    vinylDiscGroup,
    labelMesh,
    tonearmPivot,
    plinthMat,
    volumeKnob,
    toggleSwitch,
  };
}

function createCuppedPetalGeometry(): THREE.BufferGeometry {
  // Parametric cupped petal surface for lush layered peonies
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.11, 0.04, 0.14, 0.18, 0.06, 0.27);
  shape.bezierCurveTo(0.02, 0.3, -0.02, 0.3, -0.06, 0.27);
  shape.bezierCurveTo(-0.14, 0.18, -0.11, 0.04, 0, 0);

  const geo = new THREE.ShapeGeometry(shape, 12);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    // Cup inward along X and curve slightly forward along Y
    const zCurve = -(x * x) * 4.5 + Math.sin((y / 0.3) * Math.PI) * 0.055;
    pos.setZ(i, zCurve);
  }
  geo.computeVertexNormals();
  return geo;
}

function createLeafGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.09, 0.07, 0.1, 0.24, 0, 0.38);
  shape.bezierCurveTo(-0.1, 0.24, -0.09, 0.07, 0, 0);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.008,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
  });
  return geo;
}

export function createBouquetGroup(
  paletteId: FlowerPaletteId,
  maxAnisotropy: number,
): BouquetRig {
  const group = new THREE.Group();
  const palette = FLOWER_PALETTES[paletteId];

  // Ground contact shadow
  group.add(createContactShadowPlane(1.45, 1.45, 0.44));

  // 1. Fluted ceramic stoneware vase (LatheGeometry, y = 0 to 0.78)
  const ceramicTex = createCeramicTexture(maxAnisotropy);
  const vasePoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.24, 0),
    new THREE.Vector2(0.32, 0.14),
    new THREE.Vector2(0.35, 0.34),
    new THREE.Vector2(0.26, 0.54),
    new THREE.Vector2(0.18, 0.68),
    new THREE.Vector2(0.225, 0.77),
    new THREE.Vector2(0.20, 0.79),
    new THREE.Vector2(0.16, 0.68),
    new THREE.Vector2(0, 0.62),
  ];
  const vaseGeo = new THREE.LatheGeometry(vasePoints, 48);
  const vaseMat = new THREE.MeshStandardMaterial({
    map: ceramicTex,
    roughness: 0.46,
    metalness: 0.04,
  });
  const vaseMesh = new THREE.Mesh(vaseGeo, vaseMat);
  vaseMesh.castShadow = true;
  vaseMesh.receiveShadow = true;
  group.add(vaseMesh);

  // Brass neck collar accent on vase
  const collarMat = new THREE.MeshPhysicalMaterial({
    color: 0xc59a55,
    metalness: 0.9,
    roughness: 0.24,
  });
  const collarRing = new THREE.Mesh(new THREE.TorusGeometry(0.188, 0.012, 12, 48), collarMat);
  collarRing.rotation.x = Math.PI / 2;
  collarRing.position.y = 0.68;
  group.add(collarRing);

  // Swaying upper bouquet pivot (centered at vase neck)
  const swayPivot = new THREE.Group();
  swayPivot.position.set(0, 0.66, 0);
  group.add(swayPivot);

  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x4b6344,
    roughness: 0.78,
    metalness: 0.02,
  });

  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x5c7754,
    roughness: 0.36,
    metalness: 0.03,
    side: THREE.DoubleSide,
  });

  const primaryPetalMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(palette.primary),
    roughness: 0.72,
    metalness: 0.02,
    sheen: 0.85,
    sheenRoughness: 0.55,
    sheenColor: new THREE.Color('#fff5f7'),
    side: THREE.DoubleSide,
  });

  const secondaryPetalMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(palette.secondary),
    roughness: 0.68,
    metalness: 0.02,
    sheen: 0.9,
    sheenRoughness: 0.5,
    sheenColor: new THREE.Color('#ffffff'),
    side: THREE.DoubleSide,
  });

  const centerStamenMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(palette.center),
    roughness: 0.85,
    metalness: 0.05,
  });

  const petalGeo = createCuppedPetalGeometry();
  const leafGeo = createLeafGeometry();
  const bloomGroups: THREE.Group[] = [];

  // 4 Hero Peony blooms + 3 smaller accent wildflowers
  const bloomConfigs = [
    { tip: new THREE.Vector3(0.02, 0.66, 0.04), ctrl: new THREE.Vector3(0.01, 0.36, 0.02), scale: 1.08, tiltX: 0.25, tiltZ: -0.08, isHero: true },
    { tip: new THREE.Vector3(-0.28, 0.52, 0.16), ctrl: new THREE.Vector3(-0.12, 0.3, 0.06), scale: 0.94, tiltX: 0.45, tiltZ: 0.42, isHero: true },
    { tip: new THREE.Vector3(0.29, 0.50, 0.12), ctrl: new THREE.Vector3(0.14, 0.28, 0.05), scale: 0.9, tiltX: 0.38, tiltZ: -0.48, isHero: true },
    { tip: new THREE.Vector3(-0.04, 0.56, -0.25), ctrl: new THREE.Vector3(-0.02, 0.32, -0.1), scale: 0.86, tiltX: -0.35, tiltZ: 0.1, isHero: true },
    { tip: new THREE.Vector3(0.24, 0.68, -0.18), ctrl: new THREE.Vector3(0.11, 0.36, -0.07), scale: 0.58, tiltX: -0.2, tiltZ: -0.35, isHero: false },
    { tip: new THREE.Vector3(-0.32, 0.64, -0.12), ctrl: new THREE.Vector3(-0.14, 0.34, -0.04), scale: 0.55, tiltX: -0.15, tiltZ: 0.45, isHero: false },
    { tip: new THREE.Vector3(0.04, 0.38, 0.29), ctrl: new THREE.Vector3(0.02, 0.2, 0.14), scale: 0.6, tiltX: 0.62, tiltZ: -0.05, isHero: false },
  ];

  bloomConfigs.forEach((cfg, idx) => {
    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.06, 0),
      cfg.ctrl,
      cfg.tip,
    ]);
    const stemGeo = new THREE.TubeGeometry(stemCurve, 18, cfg.isHero ? 0.017 : 0.012, 8, false);
    const stemMesh = new THREE.Mesh(stemGeo, stemMat);
    stemMesh.castShadow = true;
    swayPivot.add(stemMesh);

    const bloom = new THREE.Group();
    bloom.position.copy(cfg.tip);
    bloom.rotation.set(cfg.tiltX, idx * 0.8, cfg.tiltZ);
    bloom.scale.setScalar(cfg.scale);

    // Calyx base
    const calyx = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.08, 12), stemMat);
    calyx.position.y = -0.02;
    bloom.add(calyx);

    // Outer and inner cupped petals
    const outerCount = cfg.isHero ? 9 : 7;
    for (let p = 0; p < outerCount; p++) {
      const angle = (p / outerCount) * Math.PI * 2;
      const petalHolder = new THREE.Group();
      petalHolder.rotation.y = angle;
      const petalMesh = new THREE.Mesh(
        petalGeo,
        p % 2 === 0 ? primaryPetalMat : secondaryPetalMat,
      );
      petalMesh.rotation.x = 0.82 + (p % 2) * 0.14;
      petalMesh.position.y = 0.01;
      petalMesh.castShadow = true;
      petalHolder.add(petalMesh);
      bloom.add(petalHolder);
    }

    if (cfg.isHero) {
      const innerCount = 7;
      for (let p = 0; p < innerCount; p++) {
        const angle = (p / innerCount) * Math.PI * 2 + 0.32;
        const petalHolder = new THREE.Group();
        petalHolder.rotation.y = angle;
        const petalMesh = new THREE.Mesh(petalGeo, secondaryPetalMat);
        petalMesh.scale.setScalar(0.76);
        petalMesh.rotation.x = 0.48 + (p % 2) * 0.1;
        petalMesh.position.y = 0.025;
        petalHolder.add(petalMesh);
        bloom.add(petalHolder);
      }
    }

    // Golden stamen dome cluster
    const stamen = new THREE.Mesh(
      new THREE.SphereGeometry(cfg.isHero ? 0.055 : 0.045, 16, 12),
      centerStamenMat,
    );
    stamen.scale.y = 0.65;
    stamen.position.y = 0.05;
    bloom.add(stamen);

    swayPivot.add(bloom);
    bloomGroups.push(bloom);
  });

  // Sculpted eucalyptus / sage leaves radiating from the collar
  for (let l = 0; l < 8; l++) {
    const angle = (l / 8) * Math.PI * 2 + 0.2;
    const leafHolder = new THREE.Group();
    leafHolder.position.set(Math.cos(angle) * 0.12, 0.14 + (l % 3) * 0.08, Math.sin(angle) * 0.12);
    leafHolder.rotation.y = -angle + Math.PI / 2;

    const leafMesh = new THREE.Mesh(leafGeo, leafMat);
    leafMesh.rotation.x = 0.78 + (l % 2) * 0.28;
    leafMesh.scale.setScalar(0.9 + (l % 3) * 0.16);
    leafMesh.castShadow = true;
    leafHolder.add(leafMesh);
    swayPivot.add(leafHolder);
  }

  return {
    group,
    swayPivot,
    primaryPetalMat,
    secondaryPetalMat,
    centerStamenMat,
    bloomGroups,
  };
}

export function createKeepsakeEaselGroup(
  woodId: WoodFinishId,
  maxAnisotropy: number,
): EaselRig {
  const group = new THREE.Group();
  const woodSpec = WOOD_FINISHES[woodId];
  const woodTex = createWoodTextures(woodSpec.baseHex, woodSpec.grainHex, maxAnisotropy);

  // Contact shadow
  group.add(createContactShadowPlane(1.35, 0.9, 0.36));

  const frameMat = new THREE.MeshStandardMaterial({
    map: woodTex.map,
    roughnessMap: woodTex.roughnessMap,
    roughness: woodSpec.roughness,
    metalness: 0.05,
  });

  const brassMat = new THREE.MeshPhysicalMaterial({
    color: 0xc59a55,
    metalness: 0.92,
    roughness: 0.2,
  });

  const easelPivot = new THREE.Group();
  // Tilt gently back (bottom rests at y=0)
  easelPivot.rotation.x = -0.22;
  group.add(easelPivot);

  // 1. Beveled gallery frame outer body
  const frameOuter = createRoundedRectShape(1.18, 1.18, 0.035);
  const frameInner = new THREE.Path();
  frameInner.moveTo(-0.5, -0.5);
  frameInner.lineTo(0.5, -0.5);
  frameInner.lineTo(0.5, 0.5);
  frameInner.lineTo(-0.5, 0.5);
  frameInner.closePath();
  frameOuter.holes.push(frameInner);

  const frameGeo = new THREE.ExtrudeGeometry(frameOuter, {
    depth: 0.055,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 3,
  });
  const frameMesh = new THREE.Mesh(frameGeo, frameMat);
  frameMesh.position.set(0, 0.62, -0.02);
  frameMesh.castShadow = true;
  frameMesh.receiveShadow = true;
  easelPivot.add(frameMesh);

  // 2. Warm cotton linen mat backing
  const matBoard = new THREE.Mesh(
    new THREE.BoxGeometry(1.04, 1.04, 0.025),
    new THREE.MeshStandardMaterial({ color: 0xf7f2ea, roughness: 0.88, metalness: 0 }),
  );
  matBoard.position.set(0, 0.62, 0.005);
  matBoard.receiveShadow = true;
  easelPivot.add(matBoard);

  // 3. Artwork print surface (slightly proud of mat board to prevent z-fighting)
  const artworkMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.62,
    metalness: 0.02,
  });
  const artworkMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 0.92), artworkMat);
  artworkMesh.position.set(0, 0.62, 0.022);
  easelPivot.add(artworkMesh);

  // 4. Brass nameplate accent at bottom edge of frame
  const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.045, 0.014), brassMat);
  plaque.position.set(0, 0.068, 0.048);
  easelPivot.add(plaque);

  // 5. Rear brass kickstand leg grounded at y = 0
  const legMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.014, 0.82, 12), brassMat);
  legMesh.position.set(0, 0.38, -0.22);
  legMesh.rotation.x = 0.56;
  legMesh.castShadow = true;
  group.add(legMesh);

  return {
    group,
    artworkMesh,
    artworkMat,
    frameMat,
  };
}

export function createPollenMotes(): {
  mesh: THREE.InstancedMesh;
  data: PollenMoteData[];
} {
  const count = 48;
  const geo = new THREE.OctahedronGeometry(0.016, 1);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffe4ad,
    transparent: true,
    opacity: 0.68,
  });

  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.frustumCulled = false;

  const data: PollenMoteData[] = [];
  const dummy = new THREE.Object3D();

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 * 3.1;
    const radius = 0.8 + ((i * 37) % 100) * 0.024;
    const baseY = 0.35 + ((i * 53) % 100) * 0.017;
    const baseX = Math.cos(angle) * radius;
    const baseZ = Math.sin(angle) * radius;

    data.push({
      baseX,
      baseY,
      baseZ,
      speed: 0.35 + (i % 5) * 0.12,
      phase: i * 0.73,
      radius: 0.06 + (i % 4) * 0.03,
      scale: 0.65 + (i % 5) * 0.18,
    });

    dummy.position.set(baseX, baseY, baseZ);
    dummy.scale.setScalar(data[i].scale);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();

  return { mesh, data };
}

export function createBalloonGroup(paletteId: FlowerPaletteId): BalloonRig {
  const group = new THREE.Group();
  const palette = FLOWER_PALETTES[paletteId];

  // Ground contact shadow for brass tether weight
  group.add(createContactShadowPlane(0.38, 0.38, 0.34));

  const brassMat = new THREE.MeshPhysicalMaterial({
    color: 0xc59a55,
    metalness: 0.92,
    roughness: 0.22,
  });

  // 1. Turned brass anchor weight resting flush at y = 0
  const weightPoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.085, 0),
    new THREE.Vector2(0.092, 0.025),
    new THREE.Vector2(0.068, 0.06),
    new THREE.Vector2(0.028, 0.09),
    new THREE.Vector2(0, 0.095),
  ];
  const weightGeo = new THREE.LatheGeometry(weightPoints, 28);
  const weightMesh = new THREE.Mesh(weightGeo, brassMat);
  weightMesh.castShadow = true;
  weightMesh.receiveShadow = true;
  group.add(weightMesh);

  // 2. Small brass tie-loop at top of anchor weight
  const anchorLoop = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.005, 10, 24), brassMat);
  anchorLoop.position.y = 0.105;
  group.add(anchorLoop);

  // Floating pivot anchored near the weight so gentle breeze tilts smoothly
  const floatPivot = new THREE.Group();
  floatPivot.position.set(0, 0.11, 0);
  group.add(floatPivot);

  // 3. Slender curved silk-gold tether ribbon
  const ribbonCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.025, 0.42, -0.015),
    new THREE.Vector3(-0.018, 0.88, 0.02),
    new THREE.Vector3(0.006, 1.32, 0),
  ]);
  const ribbonGeo = new THREE.TubeGeometry(ribbonCurve, 32, 0.0055, 8, false);
  const ribbonMat = new THREE.MeshStandardMaterial({
    color: 0xd4b475,
    metalness: 0.45,
    roughness: 0.48,
  });
  const ribbonMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
  floatPivot.add(ribbonMesh);

  // 4. Delicate balloon knot & collar at y = 1.32
  const envelopeMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(palette.secondary).lerp(new THREE.Color('#FAF3EA'), 0.25),
    roughness: 0.42,
    metalness: 0.03,
    clearcoat: 0.18,
    clearcoatRoughness: 0.35,
    sheen: 0.75,
    sheenRoughness: 0.45,
    sheenColor: new THREE.Color('#FFFFFF'),
  });

  const knotMesh = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.045, 16), envelopeMat);
  knotMesh.position.set(0.006, 1.33, 0);
  floatPivot.add(knotMesh);

  const collarMesh = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.005, 10, 24), brassMat);
  collarMesh.rotation.x = Math.PI / 2;
  collarMesh.position.set(0.006, 1.345, 0);
  floatPivot.add(collarMesh);

  // 5. Sculpted teardrop silk balloon envelope (LatheGeometry)
  const balloonPoints = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(0.022, 0.02),
    new THREE.Vector2(0.095, 0.11),
    new THREE.Vector2(0.21, 0.25),
    new THREE.Vector2(0.275, 0.41),
    new THREE.Vector2(0.265, 0.56),
    new THREE.Vector2(0.185, 0.68),
    new THREE.Vector2(0.085, 0.745),
    new THREE.Vector2(0.0, 0.76),
  ];
  const envelopeGeo = new THREE.LatheGeometry(balloonPoints, 48);
  const envelopeMesh = new THREE.Mesh(envelopeGeo, envelopeMat);
  envelopeMesh.position.set(0.006, 1.345, 0);
  envelopeMesh.castShadow = true;
  floatPivot.add(envelopeMesh);

  return {
    group,
    floatPivot,
    envelopeMat,
  };
}

export function createMoonGroup(maxAnisotropy: number): MoonRig {
  const group = new THREE.Group();

  // 1. Cratered pearl-ivory lunar sphere
  const moonTex = createMoonTextures(maxAnisotropy);
  const orbGeo = new THREE.SphereGeometry(0.42, 48, 36);
  const orbMat = new THREE.MeshStandardMaterial({
    map: moonTex.map,
    bumpMap: moonTex.bumpMap,
    bumpScale: 0.014,
    roughness: 0.78,
    metalness: 0.04,
    emissive: new THREE.Color('#F7E8CC'),
    emissiveIntensity: 0.28,
  });
  const orbMesh = new THREE.Mesh(orbGeo, orbMat);
  group.add(orbMesh);

  // 2. Tilted champagne-brass celestial ring + 3 starlight beads
  const ringGroup = new THREE.Group();
  ringGroup.rotation.set(Math.PI * 0.36, -0.25, 0.28);

  const brassRingMat = new THREE.MeshPhysicalMaterial({
    color: 0xd8b674,
    metalness: 0.88,
    roughness: 0.24,
    emissive: new THREE.Color('#C59A55'),
    emissiveIntensity: 0.14,
  });
  const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.009, 12, 64), brassRingMat);
  ringGroup.add(ringMesh);

  const beadGeo = new THREE.OctahedronGeometry(0.024, 0);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.4;
    const bead = new THREE.Mesh(beadGeo, brassRingMat);
    bead.position.set(Math.cos(a) * 0.56, Math.sin(a) * 0.56, 0);
    ringGroup.add(bead);
  }
  group.add(ringGroup);

  // 3. Luminous atmospheric halo sprite
  const haloMat = new THREE.SpriteMaterial({
    map: createMoonHaloTexture(),
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
  });
  const haloSprite = new THREE.Sprite(haloMat);
  haloSprite.scale.set(1.9, 1.9, 1);
  group.add(haloSprite);

  // 4. Invisible enlarged hit proxy for effortless tapping/clicking
  const hitProxy = new THREE.Mesh(
    new THREE.SphereGeometry(0.66, 16, 12),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  group.add(hitProxy);

  return {
    group,
    orbMesh,
    ringGroup,
    haloSprite,
  };
}

export function createFallingPetals(paletteId: FlowerPaletteId): PetalParticleRig {
  const count = 42;
  const geo = createCuppedPetalGeometry();
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.68,
    metalness: 0.02,
    sheen: 0.75,
    sheenRoughness: 0.5,
    sheenColor: new THREE.Color('#FFFFFF'),
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0,
  });

  const mesh = new THREE.InstancedMesh(geo, material, count);
  mesh.frustumCulled = false;

  const data: PetalParticleData[] = [];
  const dummy = new THREE.Object3D();

  for (let i = 0; i < count; i++) {
    const x = (((i * 73) % 100) / 100 - 0.5) * 5.4;
    const y = 0.25 + (((i * 41) % 100) / 100) * 3.0;
    const z = (((i * 89) % 100) / 100 - 0.5) * 3.8 - 0.2;
    const scale = 0.16 + (i % 5) * 0.024;

    const item: PetalParticleData = {
      x,
      y,
      z,
      curX: x,
      curY: y,
      curZ: z,
      vx: 0,
      vz: 0,
      vyBoost: 0,
      fallSpeed: 0.16 + (i % 6) * 0.032,
      swayFreq: 0.75 + (i % 4) * 0.22,
      swayAmp: 0.16 + (i % 5) * 0.045,
      phase: i * 0.91,
      rotX: (i * 0.7) % (Math.PI * 2),
      rotY: (i * 1.1) % (Math.PI * 2),
      rotZ: (i * 0.4) % (Math.PI * 2),
      spinX: (i % 2 === 0 ? 1 : -1) * (0.45 + (i % 4) * 0.14),
      spinY: 0.5 + (i % 5) * 0.12,
      spinZ: (i % 3 === 0 ? -1 : 1) * (0.3 + (i % 3) * 0.15),
      scale,
    };
    data.push(item);

    dummy.position.set(x, y, z);
    dummy.rotation.set(item.rotX, item.rotY, item.rotZ);
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;

  const cPrimary = new THREE.Color();
  const cSecondary = new THREE.Color();
  const cIvory = new THREE.Color('#FAF3EA');
  const cScratch = new THREE.Color();

  const updateColors = (id: FlowerPaletteId) => {
    const pal = FLOWER_PALETTES[id];
    cPrimary.set(pal.primary);
    cSecondary.set(pal.secondary);
    for (let i = 0; i < count; i++) {
      if (i % 3 === 0) {
        cScratch.copy(cPrimary);
      } else if (i % 3 === 1) {
        cScratch.copy(cSecondary);
      } else {
        cScratch.copy(cSecondary).lerp(cIvory, 0.45);
      }
      mesh.setColorAt(i, cScratch);
    }
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  };

  updateColors(paletteId);
  mesh.computeBoundingSphere();

  return {
    mesh,
    material,
    data,
    updateColors,
  };
}

export function createFloatingBubbles(
  paletteId: FlowerPaletteId,
  isSoftwareGl: boolean,
): BubbleParticleRig {
  const count = 30;
  const baseGeomRadius = 0.09;
  const geo = new THREE.SphereGeometry(baseGeomRadius, 22, 16);
  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#FFFFFF'),
    roughness: 0.06,
    metalness: 0.06,
    iridescence: 1.0,
    iridescenceIOR: 1.33,
    iridescenceThicknessRange: [140, 440],
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    transparent: true,
    opacity: isSoftwareGl ? 0.36 : 0.42,
    depthWrite: false,
  });

  const mesh = new THREE.InstancedMesh(geo, material, count);
  mesh.frustumCulled = false;
  mesh.renderOrder = 3;

  const data: BubbleParticleData[] = [];
  const dummy = new THREE.Object3D();

  for (let i = 0; i < count; i++) {
    // Distribute around perimeter and open airspace without crowding the center focal objects
    const ringAngle = (i / count) * Math.PI * 2 + (i % 3) * 0.42;
    const radialDist = 1.05 + ((i * 31) % 100) * 0.017;
    const homeX = Math.cos(ringAngle) * radialDist;
    const homeZ = Math.sin(ringAngle) * radialDist * 0.85 - 0.18;
    const y = 0.18 + (((i * 47) % 100) / 100) * 3.1;
    const baseScale = 0.65 + (i % 6) * 0.19;

    const item: BubbleParticleData = {
      x: homeX,
      y,
      z: homeZ,
      homeX,
      homeZ,
      vx: 0,
      vz: 0,
      riseSpeed: 0.16 + (i % 5) * 0.036,
      swayFreq: 0.55 + (i % 4) * 0.18,
      swayAmp: 0.12 + (i % 5) * 0.035,
      phase: i * 1.13,
      baseScale,
      currentScale: baseScale,
      radius: baseGeomRadius * baseScale,
      popTimer: 0,
    };
    data.push(item);

    dummy.position.set(homeX, y, homeZ);
    dummy.scale.setScalar(baseScale);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;

  const cPearl = new THREE.Color('#FAF6F0');
  const cSky = new THREE.Color('#DDE9F6');
  const cAccent = new THREE.Color();
  const cScratch = new THREE.Color();

  const updateColors = (id: FlowerPaletteId) => {
    const pal = FLOWER_PALETTES[id];
    cAccent.set(pal.secondary);
    for (let i = 0; i < count; i++) {
      if (i % 3 === 0) {
        cScratch.copy(cPearl).lerp(cAccent, 0.35);
      } else if (i % 3 === 1) {
        cScratch.copy(cSky).lerp(cPearl, 0.4);
      } else {
        cScratch.copy(cPearl);
      }
      mesh.setColorAt(i, cScratch);
    }
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  };

  updateColors(paletteId);
  mesh.computeBoundingSphere();

  return {
    mesh,
    material,
    data,
    updateColors,
  };
}

export function createSnowParticles(): SnowParticleRig {
  const count = 96;
  const geo = new THREE.OctahedronGeometry(0.017, 0);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.45,
    metalness: 0.05,
    emissive: new THREE.Color('#E8F0FA'),
    emissiveIntensity: 0.28,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });

  const mesh = new THREE.InstancedMesh(geo, material, count);
  mesh.frustumCulled = false;
  mesh.renderOrder = 2;
  mesh.visible = false;

  const data: SnowFlakeData[] = [];
  const dummy = new THREE.Object3D();
  const cWhite = new THREE.Color('#FFFFFF');
  const cFrost = new THREE.Color('#DCE9F7');
  const cWarmSnow = new THREE.Color('#FFF8F0');
  const cScratch = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const x = (((i * 67) % 100) / 100 - 0.5) * 6.4;
    const y = 0.08 + (((i * 43) % 100) / 100) * 3.55;
    const z = (((i * 83) % 100) / 100 - 0.5) * 4.8 - 0.3;
    const scale = 0.55 + (i % 6) * 0.16;

    const item: SnowFlakeData = {
      x,
      y,
      z,
      fallSpeed: 0.18 + (i % 7) * 0.028,
      swayFreqX: 0.5 + (i % 4) * 0.16,
      swayFreqZ: 0.42 + (i % 5) * 0.14,
      swayAmp: 0.14 + (i % 4) * 0.05,
      phase: i * 0.87,
      rotX: (i * 0.6) % (Math.PI * 2),
      rotY: (i * 1.3) % (Math.PI * 2),
      spin: (i % 2 === 0 ? 1 : -1) * (0.4 + (i % 4) * 0.15),
      scale,
    };
    data.push(item);

    dummy.position.set(x, y, z);
    dummy.rotation.set(item.rotX, item.rotY, 0);
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);

    if (i % 3 === 0) {
      cScratch.copy(cFrost);
    } else if (i % 3 === 1) {
      cScratch.copy(cWarmSnow);
    } else {
      cScratch.copy(cWhite);
    }
    mesh.setColorAt(i, cScratch);
  }

  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) {
    mesh.instanceColor.needsUpdate = true;
  }
  mesh.computeBoundingSphere();

  return { mesh, material, data };
}

export function createFireflies(): FireflyParticleRig {
  const count = 36;
  const coreGeo = new THREE.SphereGeometry(0.014, 10, 8);
  const coreMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });

  const haloGeo = new THREE.PlaneGeometry(0.18, 0.18);
  const haloMaterial = new THREE.MeshBasicMaterial({
    map: createFireflyGlowTexture(),
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const coreMesh = new THREE.InstancedMesh(coreGeo, coreMaterial, count);
  coreMesh.frustumCulled = false;
  coreMesh.renderOrder = 4;
  coreMesh.visible = false;

  const haloMesh = new THREE.InstancedMesh(haloGeo, haloMaterial, count);
  haloMesh.frustumCulled = false;
  haloMesh.renderOrder = 4;
  haloMesh.visible = false;

  const data: FireflyData[] = [];
  const dummy = new THREE.Object3D();
  const cScratch = new THREE.Color();

  for (let i = 0; i < count; i++) {
    // Organic cluster ring drifting gracefully around flowers, lantern, moonlit air, and table rim
    const angle = (i / count) * Math.PI * 2 + (i % 4) * 0.45;
    const radius = 0.85 + ((i * 37) % 100) * 0.022;
    const baseX = Math.cos(angle) * radius;
    const baseY = 0.25 + (((i * 59) % 100) / 100) * 2.25;
    const baseZ = Math.sin(angle) * radius * 0.85 - 0.18;

    // Warm golden amber with occasional soft chartreuse-honey shimmer
    const isLimeGold = i % 3 === 0;
    const tintR = isLimeGold ? 0.94 : 1.0;
    const tintG = isLimeGold ? 0.96 : 0.86;
    const tintB = isLimeGold ? 0.54 : 0.48;

    const item: FireflyData = {
      baseX,
      baseY,
      baseZ,
      wanderFreqX: 0.28 + (i % 5) * 0.08,
      wanderFreqY: 0.34 + (i % 4) * 0.09,
      wanderFreqZ: 0.26 + (i % 6) * 0.07,
      wanderAmpX: 0.22 + (i % 4) * 0.06,
      wanderAmpY: 0.16 + (i % 5) * 0.04,
      wanderAmpZ: 0.20 + (i % 3) * 0.07,
      phase: i * 1.37,
      pulseSpeed: 0.55 + (i % 6) * 0.14,
      pulseOffset: i * 2.09,
      baseScale: 0.78 + (i % 5) * 0.13,
      tintR,
      tintG,
      tintB,
    };
    data.push(item);

    dummy.position.set(baseX, baseY, baseZ);
    dummy.scale.setScalar(item.baseScale);
    dummy.updateMatrix();
    coreMesh.setMatrixAt(i, dummy.matrix);
    haloMesh.setMatrixAt(i, dummy.matrix);

    cScratch.setRGB(tintR, tintG, tintB);
    coreMesh.setColorAt(i, cScratch);
    haloMesh.setColorAt(i, cScratch);
  }

  coreMesh.instanceMatrix.needsUpdate = true;
  haloMesh.instanceMatrix.needsUpdate = true;
  if (coreMesh.instanceColor) coreMesh.instanceColor.needsUpdate = true;
  if (haloMesh.instanceColor) haloMesh.instanceColor.needsUpdate = true;
  coreMesh.computeBoundingSphere();
  haloMesh.computeBoundingSphere();

  return {
    coreMesh,
    haloMesh,
    coreMaterial,
    haloMaterial,
    data,
  };
}

export function createTeaCupSetGroup(maxAnisotropy: number): TeaCupRig {
  const group = new THREE.Group();
  group.add(createContactShadowPlane(0.86, 0.86, 0.36));

  const linenTex = createLinenWeaveTexture(maxAnisotropy);
  linenTex.repeat.set(2, 2);

  // 1. Woven linen coaster resting flush at y = 0
  const coaster = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.33, 0.012, 36),
    new THREE.MeshStandardMaterial({
      map: linenTex,
      roughness: 0.92,
      metalness: 0,
    }),
  );
  coaster.position.y = 0.006;
  coaster.receiveShadow = true;
  group.add(coaster);

  // 2. Turned stoneware saucer (LatheGeometry)
  const ceramicTex = createCeramicTexture(maxAnisotropy);
  const ceramicMat = new THREE.MeshStandardMaterial({
    map: ceramicTex,
    roughness: 0.38,
    metalness: 0.04,
  });
  const saucerPoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.16, 0),
    new THREE.Vector2(0.27, 0.024),
    new THREE.Vector2(0.28, 0.036),
    new THREE.Vector2(0.25, 0.038),
    new THREE.Vector2(0.14, 0.014),
    new THREE.Vector2(0, 0.012),
  ];
  const saucer = new THREE.Mesh(new THREE.LatheGeometry(saucerPoints, 40), ceramicMat);
  saucer.position.y = 0.012;
  saucer.castShadow = true;
  saucer.receiveShadow = true;
  group.add(saucer);

  // 3. Hand-thrown teacup body (LatheGeometry)
  const cupPoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.11, 0),
    new THREE.Vector2(0.155, 0.07),
    new THREE.Vector2(0.168, 0.19),
    new THREE.Vector2(0.156, 0.21),
    new THREE.Vector2(0.142, 0.195),
    new THREE.Vector2(0.128, 0.07),
    new THREE.Vector2(0, 0.022),
  ];
  const cup = new THREE.Mesh(new THREE.LatheGeometry(cupPoints, 40), ceramicMat);
  cup.position.y = 0.024;
  cup.castShadow = true;
  cup.receiveShadow = true;
  group.add(cup);

  // 4. Curved teacup handle (TubeGeometry)
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.152, 0.185, 0),
    new THREE.Vector3(0.235, 0.175, 0),
    new THREE.Vector3(0.228, 0.095, 0),
    new THREE.Vector3(0.135, 0.075, 0),
  ]);
  const handle = new THREE.Mesh(
    new THREE.TubeGeometry(handleCurve, 20, 0.016, 10, false),
    ceramicMat,
  );
  handle.castShadow = true;
  group.add(handle);

  // 5. Glossy warm amber tea liquid inside
  const teaMat = new THREE.MeshPhysicalMaterial({
    color: 0x9b5a2e,
    roughness: 0.08,
    metalness: 0.02,
    clearcoat: 0.95,
    clearcoatRoughness: 0.05,
  });
  const teaDisk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.138, 0.01, 32), teaMat);
  teaDisk.position.y = 0.188;
  group.add(teaDisk);

  // 6. Slender brushed-brass teaspoon resting on saucer rim
  const brassMat = new THREE.MeshPhysicalMaterial({
    color: 0xc59a55,
    metalness: 0.92,
    roughness: 0.2,
  });
  const spoonGroup = new THREE.Group();
  const spoonHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.006, 0.005, 0.22, 10),
    brassMat,
  );
  spoonHandle.rotation.z = Math.PI / 2;
  spoonGroup.add(spoonHandle);

  const spoonBowl = new THREE.Mesh(new THREE.SphereGeometry(0.024, 14, 10), brassMat);
  spoonBowl.scale.set(1.3, 0.35, 0.85);
  spoonBowl.position.x = 0.115;
  spoonGroup.add(spoonBowl);

  spoonGroup.position.set(-0.08, 0.044, 0.205);
  spoonGroup.rotation.y = 0.35;
  spoonGroup.rotation.z = -0.05;
  group.add(spoonGroup);

  // Subtle warm steam wisps rising softly from tea
  const steamSprites: THREE.Mesh[] = [];
  const steamGeo = new THREE.TorusGeometry(0.048, 0.008, 8, 24);
  for (let i = 0; i < 3; i++) {
    const steamMat = new THREE.MeshBasicMaterial({
      color: 0xfaf5ee,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    });
    const wisp = new THREE.Mesh(steamGeo, steamMat);
    wisp.rotation.x = Math.PI / 2;
    wisp.position.set(0, 0.26 + i * 0.08, 0);
    wisp.scale.setScalar(0.65 + i * 0.22);
    group.add(wisp);
    steamSprites.push(wisp);
  }

  return { group, steamSprites };
}

export function createJournalGroup(
  paletteId: FlowerPaletteId,
  maxAnisotropy: number,
): JournalRig {
  const group = new THREE.Group();
  const palette = FLOWER_PALETTES[paletteId];

  group.add(createContactShadowPlane(1.1, 0.86, 0.38));

  // 1. Cream paper block inside the hardcover
  const pagesMat = new THREE.MeshStandardMaterial({
    color: 0xf7f1e5,
    roughness: 0.88,
    metalness: 0,
  });
  const pages = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.052, 0.86), pagesMat);
  pages.position.set(0.015, 0.038, 0);
  pages.castShadow = true;
  pages.receiveShadow = true;
  group.add(pages);

  // 2. Clothbound top & bottom covers
  const coverTex = createJournalCoverTexture(maxAnisotropy);
  const coverTopMat = new THREE.MeshStandardMaterial({
    map: coverTex,
    roughness: 0.78,
    metalness: 0.04,
  });
  const coverBottomMat = new THREE.MeshStandardMaterial({
    color: 0xd9cfc1,
    roughness: 0.82,
    metalness: 0.02,
  });

  const bottomCover = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.014, 0.9), coverBottomMat);
  bottomCover.position.y = 0.007;
  bottomCover.receiveShadow = true;
  group.add(bottomCover);

  const topCover = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.014, 0.9), coverTopMat);
  topCover.position.y = 0.068;
  topCover.castShadow = true;
  topCover.receiveShadow = true;
  group.add(topCover);

  // 3. Silk bookmark ribbon draping out the bottom edge
  const ribbonMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(palette.swatch),
    roughness: 0.6,
    metalness: 0.05,
  });
  const ribbonCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.04, 0.042, 0.42),
    new THREE.Vector3(0.06, 0.032, 0.48),
    new THREE.Vector3(0.11, 0.006, 0.54),
    new THREE.Vector3(0.15, 0.005, 0.62),
  ]);
  const ribbon = new THREE.Mesh(
    new THREE.TubeGeometry(ribbonCurve, 18, 0.011, 6, false),
    ribbonMat,
  );
  ribbon.scale.y = 0.45;
  group.add(ribbon);

  // 4. Turned brushed-brass fountain pen resting diagonally on top
  const brassMat = new THREE.MeshPhysicalMaterial({
    color: 0xc59a55,
    metalness: 0.92,
    roughness: 0.2,
  });
  const penGroup = new THREE.Group();
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.016, 0.44, 16), brassMat);
  barrel.rotation.z = Math.PI / 2;
  barrel.castShadow = true;
  penGroup.add(barrel);

  const nib = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.065, 12), brassMat);
  nib.rotation.z = -Math.PI / 2;
  nib.position.x = 0.25;
  penGroup.add(nib);

  penGroup.position.set(0.06, 0.092, 0.14);
  penGroup.rotation.y = 0.42;
  group.add(penGroup);

  // 5. Small loose flower blossom resting beside the notebook
  const blossomMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(palette.primary),
    roughness: 0.72,
    sheen: 0.8,
    side: THREE.DoubleSide,
  });
  const petalGeo = createCuppedPetalGeometry();
  const blossom = new THREE.Group();
  blossom.position.set(-0.28, 0.088, -0.26);
  blossom.scale.setScalar(0.36);
  for (let p = 0; p < 5; p++) {
    const holder = new THREE.Group();
    holder.rotation.y = (p / 5) * Math.PI * 2;
    const petal = new THREE.Mesh(petalGeo, blossomMat);
    petal.rotation.x = 1.15;
    holder.add(petal);
    blossom.add(holder);
  }
  const center = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 12, 10),
    new THREE.MeshStandardMaterial({ color: palette.center, roughness: 0.85 }),
  );
  center.position.y = 0.025;
  blossom.add(center);
  group.add(blossom);

  return { group, ribbonMat, blossomMat };
}

export function createBrassLanternGroup(isSoftwareGl: boolean): LanternRig {
  const group = new THREE.Group();
  group.add(createContactShadowPlane(0.82, 0.82, 0.4));

  const brassMat = new THREE.MeshPhysicalMaterial({
    color: 0xc59a55,
    metalness: 0.9,
    roughness: 0.24,
    anisotropy: 0.75,
  });

  // 1. Stepped turned brass base resting at y = 0
  const basePoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.22, 0),
    new THREE.Vector2(0.23, 0.03),
    new THREE.Vector2(0.19, 0.06),
    new THREE.Vector2(0.18, 0.085),
    new THREE.Vector2(0, 0.085),
  ];
  const base = new THREE.Mesh(new THREE.LatheGeometry(basePoints, 36), brassMat);
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // 2. Creamy beeswax pillar candle inside
  const waxMat = new THREE.MeshStandardMaterial({
    color: 0xf6ebd8,
    roughness: 0.62,
    metalness: 0.02,
    emissive: new THREE.Color('#FFBA70'),
    emissiveIntensity: 0.08,
  });
  const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.09, 0.26, 28), waxMat);
  candle.position.y = 0.215;
  candle.castShadow = true;
  group.add(candle);

  // 3. Wick & warm glowing teardrop flame
  const wick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.004, 0.005, 0.025, 8),
    new THREE.MeshStandardMaterial({ color: 0x221b18, roughness: 0.9 }),
  );
  wick.position.y = 0.355;
  group.add(wick);

  const flamePoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.022, 0.018),
    new THREE.Vector2(0.018, 0.052),
    new THREE.Vector2(0, 0.085),
  ];
  const flameMesh = new THREE.Mesh(
    new THREE.LatheGeometry(flamePoints, 20),
    new THREE.MeshBasicMaterial({ color: 0xffd185 }),
  );
  flameMesh.position.y = 0.36;
  group.add(flameMesh);

  // Warm localized PointLight emitted by the candle
  const candleLight = new THREE.PointLight(0xffb463, 0.95, 5.5, 1.8);
  candleLight.position.set(0, 0.42, 0);
  group.add(candleLight);

  // 4. Glass hurricane chimney (depthWrite: false for crisp interior)
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xfff8ef,
    roughness: 0.08,
    metalness: 0.04,
    transparent: true,
    opacity: isSoftwareGl ? 0.24 : 0.32,
    clearcoat: 1.0,
    depthWrite: false,
  });
  const glass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.16, 0.48, 36, 1, true),
    glassMat,
  );
  glass.position.y = 0.325;
  glass.renderOrder = 2;
  group.add(glass);

  // 5. Top brass rim collar + slender arched handle
  const topRim = new THREE.Mesh(new THREE.TorusGeometry(0.172, 0.012, 12, 40), brassMat);
  topRim.rotation.x = Math.PI / 2;
  topRim.position.y = 0.565;
  group.add(topRim);

  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.175, 0.565, 0),
    new THREE.Vector3(-0.14, 0.72, 0),
    new THREE.Vector3(0, 0.77, 0),
    new THREE.Vector3(0.14, 0.72, 0),
    new THREE.Vector3(0.175, 0.565, 0),
  ]);
  const handle = new THREE.Mesh(
    new THREE.TubeGeometry(handleCurve, 24, 0.008, 8, false),
    brassMat,
  );
  handle.castShadow = true;
  group.add(handle);

  return { group, flameMesh, candleLight };
}

export function createRestingPetalsGroup(paletteId: FlowerPaletteId): RestingPetalsRig {
  const group = new THREE.Group();
  const palette = FLOWER_PALETTES[paletteId];

  const primaryMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(palette.primary),
    roughness: 0.72,
    sheen: 0.8,
    side: THREE.DoubleSide,
  });
  const secondaryMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(palette.secondary),
    roughness: 0.7,
    sheen: 0.85,
    side: THREE.DoubleSide,
  });

  const petalGeo = createCuppedPetalGeometry();
  const hitGeo = new THREE.SphereGeometry(0.14, 8, 6);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const placements = [
    { x: 0.62, z: 0.34, ry: 0.5, s: 0.3, primary: true },
    { x: 0.76, z: 0.48, ry: 1.9, s: 0.25, primary: false },
    { x: 1.32, z: 0.22, ry: 2.7, s: 0.28, primary: true },
    { x: -0.36, z: 1.24, ry: 0.9, s: 0.26, primary: false },
    { x: 0.54, z: 1.38, ry: 4.1, s: 0.24, primary: true },
  ];

  for (const p of placements) {
    const mesh = new THREE.Mesh(petalGeo, p.primary ? primaryMat : secondaryMat);
    mesh.position.set(p.x, 0.012, p.z);
    mesh.rotation.set(Math.PI / 2 - 0.14, p.ry, 0);
    mesh.scale.setScalar(p.s);
    mesh.castShadow = true;
    group.add(mesh);

    const hit = new THREE.Mesh(hitGeo, hitMat);
    hit.position.set(p.x, 0.04, p.z);
    group.add(hit);
  }

  return { group, primaryMat, secondaryMat };
}
