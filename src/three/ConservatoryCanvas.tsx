import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {
  CameraPresetId,
  FLOWER_PALETTES,
  FlowerPaletteId,
  LIGHTING_MOODS,
  LightingMoodId,
  TabletopItemId,
  WOOD_FINISHES,
  WoodFinishId,
} from '../types/conservatory';
import {
  createBalloonGroup,
  createBouquetGroup,
  createBrassLanternGroup,
  createConservatoryTable,
  createFallingPetals,
  createFireflies,
  createFloatingBubbles,
  createJournalGroup,
  createKeepsakeEaselGroup,
  createMoonGroup,
  createPollenMotes,
  createRestingPetalsGroup,
  createSnowParticles,
  createTeaCupSetGroup,
  createTurntableGroup,
} from './models';
import { createVinylLabelTexture, createWoodTextures } from './proceduralTextures';

interface ConservatoryCanvasProps {
  isPlaying: boolean;
  cameraPreset: CameraPresetId;
  flowerPalette: FlowerPaletteId;
  woodFinish: WoodFinishId;
  lightingMood: LightingMoodId;
  snowEnabled: boolean;
  recipientName: string;
  trackTitle: string;
  coverImageUrl: string;
  getAudioEnergy: () => number;
  onTogglePlay: () => void;
  onCycleFlowerPalette: () => void;
  onOpenNote: () => void;
  onOpenMoon: () => void;
  onSelectTabletopItem: (item: TabletopItemId) => void;
}

const CAMERA_PRESETS: Record<
  CameraPresetId,
  { pos: [number, number, number]; target: [number, number, number] }
> = {
  overview: { pos: [0.35, 2.35, 4.15], target: [0.05, 0.45, -0.08] },
  turntable: { pos: [-0.85, 1.48, 1.95], target: [-0.72, 0.34, 0.24] },
  bouquet: { pos: [1.35, 1.72, 1.75], target: [0.95, 0.88, -0.28] },
  portrait: { pos: [0.55, 1.15, 0.92], target: [0.02, 0.56, -0.95] },
};

// Pre-allocated scratch math helpers outside the animation loop (zero GC)
const _scratchPos = new THREE.Vector3();
const _scratchQuat = new THREE.Quaternion();
const _scratchEuler = new THREE.Euler();
const _scratchScale = new THREE.Vector3();
const _scratchMat4 = new THREE.Matrix4();
const _desiredCamPos = new THREE.Vector3();
const _desiredLookAt = new THREE.Vector3();
const _bgColor = new THREE.Color();
const _targetBgColor = new THREE.Color();
const _keyColor = new THREE.Color();
const _hemiSkyColor = new THREE.Color();
const _hemiGroundColor = new THREE.Color();
const _rimColor = new THREE.Color();
const _softboxColor = new THREE.Color();
const _twilightTint = new THREE.Color('#6A5369');
const _skyMixedColor = new THREE.Color();
const _balloonWarmWhite = new THREE.Color('#FAF3EA');
const _bubblePoint = new THREE.Vector3();
const _closestPoint = new THREE.Vector3();
const _fireflyColor = new THREE.Color();

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export function ConservatoryCanvas({
  isPlaying,
  cameraPreset,
  flowerPalette,
  woodFinish,
  lightingMood,
  snowEnabled,
  recipientName,
  trackTitle,
  coverImageUrl,
  getAudioEnergy,
  onTogglePlay,
  onCycleFlowerPalette,
  onOpenNote,
  onOpenMoon,
  onSelectTabletopItem,
}: ConservatoryCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  // Mutable refs so React UI updates never tear down WebGL
  const stateRef = useRef({
    isPlaying,
    cameraPreset,
    flowerPalette,
    woodFinish,
    lightingMood,
    snowEnabled,
    recipientName,
    trackTitle,
    coverImageUrl,
  });
  stateRef.current = {
    isPlaying,
    cameraPreset,
    flowerPalette,
    woodFinish,
    lightingMood,
    snowEnabled,
    recipientName,
    trackTitle,
    coverImageUrl,
  };

  const callbacksRef = useRef({
    getAudioEnergy,
    onTogglePlay,
    onCycleFlowerPalette,
    onOpenNote,
    onOpenMoon,
    onSelectTabletopItem,
  });
  callbacksRef.current = {
    getAudioEnergy,
    onTogglePlay,
    onCycleFlowerPalette,
    onOpenNote,
    onOpenMoon,
    onSelectTabletopItem,
  };

  const sceneApiRef = useRef<{
    triggerCameraTransition: (preset: CameraPresetId) => void;
    updateFlowerPalette: (id: FlowerPaletteId) => void;
    updateWoodFinish: (id: WoodFinishId) => void;
    updateVinylLabel: (name: string, title: string, accentHex: string) => void;
    updateArtworkTexture: (url: string) => void;
    triggerBloomImpulse: () => void;
  } | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglUnavailable(true);
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const initialMood = LIGHTING_MOODS[stateRef.current.lightingMood];
    renderer.toneMappingExposure = initialMood.exposure;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

    const scene = new THREE.Scene();
    _bgColor.set(initialMood.skyHex);
    scene.background = _bgColor.clone();
    scene.fog = new THREE.FogExp2(initialMood.skyHex, initialMood.fogDensity);
    scene.environmentIntensity = initialMood.envIntensity;

    // Mandatory studio environment map via RoomEnvironment + PMREMGenerator
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 60);
    const initCam = CAMERA_PRESETS[stateRef.current.cameraPreset];
    camera.position.set(...initCam.pos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...initCam.target);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 1.4;
    controls.maxDistance = 7.5;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.minPolarAngle = 0.2;
    controls.update();

    let isCameraTransitioning = false;
    let activePreset = stateRef.current.cameraPreset;

    const handleControlStart = () => {
      isCameraTransitioning = false;
    };
    controls.addEventListener('start', handleControlStart);

    // 3-Point Studio Lighting Rig (<= 3 shadow casters)
    const hemiLight = new THREE.HemisphereLight(
      initialMood.hemiSky,
      initialMood.hemiGround,
      initialMood.hemiIntensity,
    );
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(initialMood.keyColor, initialMood.keyIntensity);
    keyLight.position.set(3.8, 5.6, 3.4);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 16;
    keyLight.shadow.camera.left = -3.8;
    keyLight.shadow.camera.right = 3.8;
    keyLight.shadow.camera.top = 3.8;
    keyLight.shadow.camera.bottom = -3.8;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(initialMood.rimColor, initialMood.rimIntensity);
    rimLight.position.set(-4.0, 3.2, -3.5);
    scene.add(rimLight);

    let softbox: THREE.RectAreaLight | null = null;
    if (!isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      softbox = new THREE.RectAreaLight(
        initialMood.softboxColor,
        initialMood.softboxIntensity,
        3.2,
        1.8,
      );
      softbox.position.set(-2.2, 2.8, 2.2);
      softbox.lookAt(0, 0.4, 0);
      scene.add(softbox);
    }

    // Build Composite 3D Subjects grounded on the conservatory table (y = 0)
    const table = createConservatoryTable(maxAnisotropy);
    scene.add(table);

    const turntable = createTurntableGroup(stateRef.current.woodFinish, maxAnisotropy);
    turntable.group.position.set(-0.72, 0, 0.24);
    turntable.group.rotation.y = 0.16;
    scene.add(turntable.group);

    const bouquet = createBouquetGroup(stateRef.current.flowerPalette, maxAnisotropy);
    bouquet.group.position.set(0.95, 0, -0.22);
    scene.add(bouquet.group);

    const easel = createKeepsakeEaselGroup(stateRef.current.woodFinish, maxAnisotropy);
    easel.group.position.set(0.02, 0, -0.96);
    easel.group.rotation.y = -0.06;
    scene.add(easel.group);

    const balloon = createBalloonGroup(stateRef.current.flowerPalette);
    balloon.group.position.set(1.54, 0, -0.82);
    scene.add(balloon.group);

    const moon = createMoonGroup(maxAnisotropy);
    moon.group.position.set(0.72, 1.05, -2.6);
    scene.add(moon.group);

    const teaCup = createTeaCupSetGroup(maxAnisotropy);
    teaCup.group.position.set(1.32, 0, 1.05);
    scene.add(teaCup.group);

    const journal = createJournalGroup(stateRef.current.flowerPalette, maxAnisotropy);
    journal.group.position.set(0.02, 0, 1.56);
    journal.group.rotation.y = -0.18;
    scene.add(journal.group);

    const lantern = createBrassLanternGroup(isSoftwareGl);
    lantern.group.position.set(-1.82, 0, -0.88);
    scene.add(lantern.group);

    const restingPetals = createRestingPetalsGroup(stateRef.current.flowerPalette);
    restingPetals.group.position.set(0, 0, 0);
    scene.add(restingPetals.group);

    const pollen = createPollenMotes();
    scene.add(pollen.mesh);

    const fallingPetals = createFallingPetals(stateRef.current.flowerPalette);
    scene.add(fallingPetals.mesh);

    const bubbles = createFloatingBubbles(stateRef.current.flowerPalette, isSoftwareGl);
    scene.add(bubbles.mesh);

    const snow = createSnowParticles();
    scene.add(snow.mesh);

    const fireflies = createFireflies();
    scene.add(fireflies.coreMesh);
    scene.add(fireflies.haloMesh);

    // Assign interactive raycast layers/tags
    const interactables: {
      root: THREE.Object3D;
      action:
        | 'turntable'
        | 'bouquet'
        | 'easel'
        | 'moon'
        | 'teacup'
        | 'lantern'
        | 'journal'
        | 'balloon'
        | 'petals';
    }[] = [
      { root: turntable.group, action: 'turntable' },
      { root: bouquet.group, action: 'bouquet' },
      { root: easel.group, action: 'easel' },
      { root: moon.group, action: 'moon' },
      { root: teaCup.group, action: 'teacup' },
      { root: lantern.group, action: 'lantern' },
      { root: journal.group, action: 'journal' },
      { root: balloon.group, action: 'balloon' },
      { root: restingPetals.group, action: 'petals' },
    ];

    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    const hoverRay = new THREE.Ray();
    let hoverRayActive = false;
    let lastPointerMoveMs = 0;
    let pointerDownPos = { x: 0, y: 0 };
    let bloomImpulse = 0;
    let balloonImpulse = 0;

    let currentLabelTex: THREE.Texture | null = null;
    let currentWoodMaps: { map: THREE.Texture; roughnessMap: THREE.Texture } | null = null;
    let currentArtworkTex: THREE.Texture | null = null;

    const updateVinylLabel = (name: string, title: string, accentHex: string) => {
      const nextTex = createVinylLabelTexture(name, title, accentHex, maxAnisotropy);
      const labelMat = turntable.labelMesh.material as THREE.MeshStandardMaterial;
      labelMat.map = nextTex;
      labelMat.needsUpdate = true;
      currentLabelTex?.dispose();
      currentLabelTex = nextTex;
    };

    const updateArtworkTexture = (url: string) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const tex = new THREE.Texture(img);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = maxAnisotropy;
        tex.needsUpdate = true;
        easel.artworkMat.map = tex;
        easel.artworkMat.needsUpdate = true;
        currentArtworkTex?.dispose();
        currentArtworkTex = tex;
      };
      img.src = url;
    };

    const updateFlowerPalette = (id: FlowerPaletteId) => {
      const pal = FLOWER_PALETTES[id];
      bouquet.primaryPetalMat.color.set(pal.primary);
      bouquet.secondaryPetalMat.color.set(pal.secondary);
      bouquet.centerStamenMat.color.set(pal.center);
      balloon.envelopeMat.color.set(pal.secondary).lerp(_balloonWarmWhite, 0.25);
      journal.ribbonMat.color.set(pal.swatch);
      journal.blossomMat.color.set(pal.primary);
      restingPetals.primaryMat.color.set(pal.primary);
      restingPetals.secondaryMat.color.set(pal.secondary);
      fallingPetals.updateColors(id);
      bubbles.updateColors(id);
      updateVinylLabel(stateRef.current.recipientName, stateRef.current.trackTitle, pal.swatch);
    };

    const updateWoodFinish = (id: WoodFinishId) => {
      const spec = WOOD_FINISHES[id];
      const nextWood = createWoodTextures(spec.baseHex, spec.grainHex, maxAnisotropy);
      turntable.plinthMat.map = nextWood.map;
      turntable.plinthMat.roughnessMap = nextWood.roughnessMap;
      turntable.plinthMat.roughness = spec.roughness;
      turntable.plinthMat.needsUpdate = true;

      easel.frameMat.map = nextWood.map;
      easel.frameMat.roughnessMap = nextWood.roughnessMap;
      easel.frameMat.roughness = spec.roughness;
      easel.frameMat.needsUpdate = true;

      currentWoodMaps?.map.dispose();
      currentWoodMaps?.roughnessMap.dispose();
      currentWoodMaps = nextWood;
    };

    // Initialize dynamic textures
    updateVinylLabel(
      stateRef.current.recipientName,
      stateRef.current.trackTitle,
      FLOWER_PALETTES[stateRef.current.flowerPalette].swatch,
    );
    updateArtworkTexture(stateRef.current.coverImageUrl);

    sceneApiRef.current = {
      triggerCameraTransition: (preset) => {
        activePreset = preset;
        isCameraTransitioning = true;
      },
      updateFlowerPalette,
      updateWoodFinish,
      updateVinylLabel,
      updateArtworkTexture,
      triggerBloomImpulse: () => {
        bloomImpulse = 1;
      },
    };

    // Pre-warm shaders once on real GPUs
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Pointer interaction (tap vs orbit drag)
    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      if (dx * dx + dy * dy > 36) return; // dragged to orbit

      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNdc, camera);

      const hits = raycaster.intersectObjects(
        interactables.map((i) => i.root),
        true,
      );

      if (hits.length > 0) {
        let obj: THREE.Object3D | null = hits[0].object;
        while (obj) {
          const match = interactables.find((i) => i.root === obj);
          if (match) {
            if (match.action === 'turntable') callbacksRef.current.onTogglePlay();
            if (match.action === 'bouquet') {
              bloomImpulse = 1;
              callbacksRef.current.onCycleFlowerPalette();
            }
            if (match.action === 'easel') callbacksRef.current.onOpenNote();
            if (match.action === 'moon') callbacksRef.current.onOpenMoon();
            if (
              match.action === 'teacup' ||
              match.action === 'lantern' ||
              match.action === 'journal' ||
              match.action === 'petals'
            ) {
              callbacksRef.current.onSelectTabletopItem(match.action);
            }
            if (match.action === 'balloon') {
              balloonImpulse = 1;
              callbacksRef.current.onSelectTabletopItem('balloon');
            }
            return;
          }
          obj = obj.parent;
        }
      }

      // Open-air click: pop closest floating bubble & ripple nearby petals
      let closestBubbleIdx = -1;
      let closestCamDist = Infinity;
      for (let i = 0; i < bubbles.data.length; i++) {
        const b = bubbles.data[i];
        if (b.popTimer > 0) continue;
        _bubblePoint.set(b.x, b.y, b.z);
        const hitRadius = b.radius * 2.4;
        const rayDistSq = raycaster.ray.distanceSqToPoint(_bubblePoint);
        if (rayDistSq <= hitRadius * hitRadius) {
          const camDist = camera.position.distanceToSquared(_bubblePoint);
          if (camDist < closestCamDist) {
            closestCamDist = camDist;
            closestBubbleIdx = i;
          }
        }
      }

      if (closestBubbleIdx >= 0) {
        const popped = bubbles.data[closestBubbleIdx];
        const px = popped.x;
        const py = popped.y;
        const pz = popped.z;
        popped.popTimer = 1.45;
        popped.currentScale = 0;

        // Outward air burst into surrounding petals & neighboring bubbles
        for (let i = 0; i < fallingPetals.data.length; i++) {
          const p = fallingPetals.data[i];
          const pdx = p.curX - px;
          const pdy = p.curY - py;
          const pdz = p.curZ - pz;
          const dSq = pdx * pdx + pdy * pdy + pdz * pdz;
          if (dSq < 1.35 && dSq > 0.0001) {
            const invD = 1 / Math.sqrt(dSq);
            const strength = (1 - dSq / 1.35) * 0.72;
            p.vx += pdx * invD * strength;
            p.vz += pdz * invD * strength;
            p.vyBoost = Math.min(p.vyBoost + strength * 0.45, 0.35);
          }
        }
        for (let i = 0; i < bubbles.data.length; i++) {
          if (i === closestBubbleIdx) continue;
          const nb = bubbles.data[i];
          if (nb.popTimer > 0) continue;
          const bdx = nb.x - px;
          const bdy = nb.y - py;
          const bdz = nb.z - pz;
          const dSq = bdx * bdx + bdy * bdy + bdz * bdz;
          if (dSq < 1.2 && dSq > 0.0001) {
            const invD = 1 / Math.sqrt(dSq);
            const push = (1 - dSq / 1.2) * 0.42;
            nb.vx += bdx * invD * push;
            nb.vz += bdz * invD * push;
          }
        }
      }
    };

    let lastHoverCheck = 0;
    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastHoverCheck < 55) return;
      lastHoverCheck = now;

      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNdc, camera);
      hoverRay.copy(raycaster.ray);
      hoverRayActive = true;
      lastPointerMoveMs = now;

      const hits = raycaster.intersectObjects(
        interactables.map((i) => i.root),
        true,
      );
      if (hits.length > 0) {
        renderer.domElement.style.cursor = 'pointer';
        return;
      }

      let nearBubble = false;
      for (let i = 0; i < bubbles.data.length; i++) {
        const b = bubbles.data[i];
        if (b.popTimer > 0) continue;
        _bubblePoint.set(b.x, b.y, b.z);
        const r = b.radius * 2.1;
        if (hoverRay.distanceSqToPoint(_bubblePoint) < r * r) {
          nearBubble = true;
          break;
        }
      }
      renderer.domElement.style.cursor = nearBubble ? 'pointer' : 'grab';
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointermove', onPointerMove);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglUnavailable(true);
    };
    const onContextRestored = () => {
      setWebglUnavailable(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    // Animation & software-WebGL afterDraw pacing
    let frameId = 0;
    let disposed = false;
    const clock = new THREE.Clock();
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Cinematic mood cross-fade state (pre-allocated, mutated in place for zero GC)
    let activeMoodId: LightingMoodId = initialMood.id;
    let moodTransitionT = 1;
    let currentCandleBase = initialMood.candleIntensity;
    const fromSnapshot = {
      skyColor: new THREE.Color(initialMood.skyHex),
      fogDensity: initialMood.fogDensity,
      keyColor: new THREE.Color(initialMood.keyColor),
      keyIntensity: initialMood.keyIntensity,
      hemiSky: new THREE.Color(initialMood.hemiSky),
      hemiGround: new THREE.Color(initialMood.hemiGround),
      hemiIntensity: initialMood.hemiIntensity,
      rimColor: new THREE.Color(initialMood.rimColor),
      rimIntensity: initialMood.rimIntensity,
      softboxColor: new THREE.Color(initialMood.softboxColor),
      softboxIntensity: initialMood.softboxIntensity,
      envIntensity: initialMood.envIntensity,
      exposure: initialMood.exposure,
      candleBase: initialMood.candleIntensity,
      moonGlow: initialMood.moonGlow,
      moonHaloOpacity: initialMood.moonHaloOpacity,
      fireflyOpacity: initialMood.isDark && !prefersReducedMotion ? 1 : 0,
    };
    let currentFireflyOpacity = fromSnapshot.fireflyOpacity;
    const moonOrbMat = moon.orbMesh.material as THREE.MeshStandardMaterial;
    moonOrbMat.emissiveIntensity = initialMood.moonGlow;
    moon.haloSprite.material.opacity = initialMood.moonHaloOpacity;
    lantern.candleLight.intensity = initialMood.candleIntensity;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const dt = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();
      const current = stateRef.current;
      const audioEnergy = current.isPlaying ? callbacksRef.current.getAudioEnergy() : 0;

      // 1. Damped camera preset transitions
      if (isCameraTransitioning) {
        const preset = CAMERA_PRESETS[activePreset];
        _desiredCamPos.set(...preset.pos);
        _desiredLookAt.set(...preset.target);
        const alpha = 1 - Math.exp(-5.5 * dt);
        camera.position.lerp(_desiredCamPos, alpha);
        controls.target.lerp(_desiredLookAt, alpha);
        if (
          camera.position.distanceToSquared(_desiredCamPos) < 0.0004 &&
          controls.target.distanceToSquared(_desiredLookAt) < 0.0004
        ) {
          camera.position.copy(_desiredCamPos);
          controls.target.copy(_desiredLookAt);
          isCameraTransitioning = false;
        }
      }

      controls.update();

      // 2. Cinematic timed cross-fade between Golden Hour and Night
      const targetMood = LIGHTING_MOODS[current.lightingMood];
      if (current.lightingMood !== activeMoodId) {
        if (scene.background instanceof THREE.Color) {
          fromSnapshot.skyColor.copy(scene.background);
        }
        if (scene.fog instanceof THREE.FogExp2) {
          fromSnapshot.fogDensity = scene.fog.density;
        }
        fromSnapshot.keyColor.copy(keyLight.color);
        fromSnapshot.keyIntensity = keyLight.intensity;
        fromSnapshot.hemiSky.copy(hemiLight.color);
        fromSnapshot.hemiGround.copy(hemiLight.groundColor);
        fromSnapshot.hemiIntensity = hemiLight.intensity;
        fromSnapshot.rimColor.copy(rimLight.color);
        fromSnapshot.rimIntensity = rimLight.intensity;
        if (softbox) {
          fromSnapshot.softboxColor.copy(softbox.color);
          fromSnapshot.softboxIntensity = softbox.intensity;
        } else {
          const prevMood = LIGHTING_MOODS[activeMoodId];
          fromSnapshot.softboxColor.set(prevMood.softboxColor);
          fromSnapshot.softboxIntensity = prevMood.softboxIntensity;
        }
        fromSnapshot.envIntensity = scene.environmentIntensity;
        fromSnapshot.exposure = renderer.toneMappingExposure;
        fromSnapshot.candleBase = currentCandleBase;
        fromSnapshot.moonGlow = moonOrbMat.emissiveIntensity;
        fromSnapshot.moonHaloOpacity = moon.haloSprite.material.opacity;
        fromSnapshot.fireflyOpacity = currentFireflyOpacity;

        activeMoodId = current.lightingMood;
        moodTransitionT = prefersReducedMotion ? 1 : 0;
      }

      if (moodTransitionT < 1) {
        moodTransitionT = Math.min(1, moodTransitionT + dt / 1.45);
      }

      // Cubic S-curve easing for smooth cinematic twilight pacing
      const t = moodTransitionT;
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      // Subtle twilight dusk hue at midpoint so sky glides through dusk instead of flat gray
      const twilightWeight = Math.sin(Math.PI * t) * 0.26;
      const envT = THREE.MathUtils.smoothstep(eased, 0.08, 0.94);
      const glowT = targetMood.isDark
        ? THREE.MathUtils.smoothstep(eased, 0.18, 1.0)
        : THREE.MathUtils.smoothstep(eased, 0.0, 0.85);

      _targetBgColor.set(targetMood.skyHex);
      _skyMixedColor.copy(fromSnapshot.skyColor).lerp(_targetBgColor, eased);
      if (twilightWeight > 0.001) {
        _skyMixedColor.lerp(_twilightTint, twilightWeight);
      }

      if (scene.background instanceof THREE.Color) {
        scene.background.copy(_skyMixedColor);
      }
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.copy(_skyMixedColor);
        scene.fog.density = THREE.MathUtils.lerp(
          fromSnapshot.fogDensity,
          targetMood.fogDensity,
          eased,
        );
      }

      _keyColor.set(targetMood.keyColor);
      keyLight.color.copy(fromSnapshot.keyColor).lerp(_keyColor, eased);
      keyLight.intensity = THREE.MathUtils.lerp(
        fromSnapshot.keyIntensity,
        targetMood.keyIntensity,
        eased,
      );

      _hemiSkyColor.set(targetMood.hemiSky);
      _hemiGroundColor.set(targetMood.hemiGround);
      hemiLight.color.copy(fromSnapshot.hemiSky).lerp(_hemiSkyColor, eased);
      hemiLight.groundColor.copy(fromSnapshot.hemiGround).lerp(_hemiGroundColor, eased);
      hemiLight.intensity = THREE.MathUtils.lerp(
        fromSnapshot.hemiIntensity,
        targetMood.hemiIntensity,
        eased,
      );

      _rimColor.set(targetMood.rimColor);
      rimLight.color.copy(fromSnapshot.rimColor).lerp(_rimColor, eased);
      rimLight.intensity = THREE.MathUtils.lerp(
        fromSnapshot.rimIntensity,
        targetMood.rimIntensity,
        eased,
      );

      if (softbox) {
        _softboxColor.set(targetMood.softboxColor);
        softbox.color.copy(fromSnapshot.softboxColor).lerp(_softboxColor, envT);
        softbox.intensity = THREE.MathUtils.lerp(
          fromSnapshot.softboxIntensity,
          targetMood.softboxIntensity,
          envT,
        );
      }

      scene.environmentIntensity = THREE.MathUtils.lerp(
        fromSnapshot.envIntensity,
        targetMood.envIntensity,
        envT,
      );
      renderer.toneMappingExposure = THREE.MathUtils.lerp(
        fromSnapshot.exposure,
        targetMood.exposure,
        eased,
      );

      // 3. Turntable vinyl spin & tonearm animation
      const targetArmYaw = current.isPlaying ? 0.17 : -0.34;
      const targetArmPitch = current.isPlaying ? -0.025 : 0.03;
      turntable.tonearmPivot.rotation.y = THREE.MathUtils.damp(
        turntable.tonearmPivot.rotation.y,
        targetArmYaw,
        6,
        dt,
      );
      turntable.tonearmPivot.rotation.x = THREE.MathUtils.damp(
        turntable.tonearmPivot.rotation.x,
        targetArmPitch,
        6,
        dt,
      );
      turntable.toggleSwitch.rotation.x = THREE.MathUtils.damp(
        turntable.toggleSwitch.rotation.x,
        current.isPlaying ? -0.35 : 0.35,
        10,
        dt,
      );

      if (current.isPlaying && !prefersReducedMotion) {
        turntable.vinylDiscGroup.rotation.y -= dt * (1.55 + audioEnergy * 0.25);
        turntable.volumeKnob.rotation.y = THREE.MathUtils.damp(
          turntable.volumeKnob.rotation.y,
          0.9 + audioEnergy * 0.4,
          5,
          dt,
        );
      }

      // 4. Gentle organic floral sway + tethered balloon float + candle lantern
      bloomImpulse = THREE.MathUtils.damp(bloomImpulse, 0, 3.8, dt);
      balloonImpulse = THREE.MathUtils.damp(balloonImpulse, 0, 3.2, dt);
      const swayAmp = prefersReducedMotion ? 0 : 0.018 + audioEnergy * 0.035 + bloomImpulse * 0.06;
      bouquet.swayPivot.rotation.z = Math.sin(elapsed * 1.15) * swayAmp;
      bouquet.swayPivot.rotation.x = Math.cos(elapsed * 0.9) * swayAmp * 0.7;

      currentCandleBase = THREE.MathUtils.lerp(
        fromSnapshot.candleBase,
        targetMood.candleIntensity,
        glowT,
      );
      moonOrbMat.emissiveIntensity = THREE.MathUtils.lerp(
        fromSnapshot.moonGlow,
        targetMood.moonGlow,
        glowT,
      );
      moon.haloSprite.material.opacity = THREE.MathUtils.lerp(
        fromSnapshot.moonHaloOpacity,
        targetMood.moonHaloOpacity,
        glowT,
      );

      if (!prefersReducedMotion) {
        balloon.floatPivot.rotation.z =
          Math.sin(elapsed * 0.72 + 0.6) * (0.042 + audioEnergy * 0.03 + balloonImpulse * 0.09);
        balloon.floatPivot.rotation.x = Math.cos(elapsed * 0.58) * (0.032 + balloonImpulse * 0.05);
        balloon.floatPivot.position.y =
          0.11 + Math.sin(elapsed * 1.1) * 0.025 + balloonImpulse * 0.06;

        moon.orbMesh.rotation.y = elapsed * 0.08;
        moon.ringGroup.rotation.z = 0.28 + Math.sin(elapsed * 0.45) * 0.08;
        moon.group.position.y = 1.05 + Math.sin(elapsed * 0.65) * 0.03;

        const flicker = Math.sin(elapsed * 7.3) * 0.06 + Math.cos(elapsed * 11.1) * 0.04;
        lantern.candleLight.intensity = currentCandleBase + flicker;
        lantern.flameMesh.scale.set(
          1 + flicker * 0.18,
          1 + flicker * 0.45,
          1 + flicker * 0.18,
        );
        lantern.flameMesh.rotation.z = Math.sin(elapsed * 5.2) * 0.06;

        for (let i = 0; i < teaCup.steamSprites.length; i++) {
          const wisp = teaCup.steamSprites[i];
          const cycle = (elapsed * 0.24 + i * 0.333) % 1;
          wisp.position.y = 0.23 + cycle * 0.22;
          wisp.position.x = Math.sin(elapsed * 1.4 + i * 2.1) * 0.018;
          wisp.position.z = Math.cos(elapsed * 1.1 + i * 1.7) * 0.014;
          wisp.scale.setScalar(0.55 + cycle * 0.65);
          (wisp.material as THREE.MeshBasicMaterial).opacity = Math.sin(cycle * Math.PI) * 0.17;
        }
      } else {
        lantern.candleLight.intensity = currentCandleBase;
      }

      // 5. Instanced pollen motes float gently (zero heap allocation)
      if (!prefersReducedMotion) {
        for (let i = 0; i < pollen.data.length; i++) {
          const item = pollen.data[i];
          const drift = elapsed * item.speed + item.phase;
          _scratchPos.set(
            item.baseX + Math.sin(drift) * item.radius,
            item.baseY + Math.sin(drift * 0.8 + 1.1) * 0.14 + audioEnergy * 0.08,
            item.baseZ + Math.cos(drift * 0.9) * item.radius,
          );
          _scratchQuat.setFromAxisAngle(
            THREE.Object3D.DEFAULT_UP,
            drift * 0.5,
          );
          const s = item.scale * (1 + audioEnergy * 0.55);
          _scratchScale.set(s, s, s);
          _scratchMat4.compose(_scratchPos, _scratchQuat, _scratchScale);
          pollen.mesh.setMatrixAt(i, _scratchMat4);
        }
        pollen.mesh.instanceMatrix.needsUpdate = true;
      }

      // 6. Interactive upward-drifting bubbles + bubble-petal aerodynamic interaction
      const pointerBreezeFresh =
        hoverRayActive && performance.now() - lastPointerMoveMs < 1800;

      bubbles.mesh.visible = !prefersReducedMotion;
      if (!prefersReducedMotion) {
        const riseBoost = current.isPlaying ? 1 + audioEnergy * 0.35 : 1;
        for (let i = 0; i < bubbles.data.length; i++) {
          const b = bubbles.data[i];
          if (b.popTimer > 0) {
            b.popTimer -= dt;
            if (b.popTimer <= 0) {
              b.popTimer = 0;
              b.y = 0.08 + (i % 4) * 0.05;
              b.x = b.homeX;
              b.z = b.homeZ;
              b.vx = 0;
              b.vz = 0;
              b.currentScale = 0.02;
            }
          } else {
            b.currentScale = THREE.MathUtils.damp(b.currentScale, b.baseScale, 4.2, dt);
            b.y += dt * b.riseSpeed * riseBoost;
            if (b.y > 3.45) {
              b.y = 0.08;
              b.x = b.homeX;
              b.z = b.homeZ;
              b.vx = 0;
              b.vz = 0;
              b.currentScale = 0.02;
            }

            const swayT = elapsed * b.swayFreq + b.phase;
            const targetX = b.homeX + Math.sin(swayT) * b.swayAmp;
            const targetZ = b.homeZ + Math.cos(swayT * 0.85) * b.swayAmp * 0.9;

            // Gentle pointer breeze parting
            if (pointerBreezeFresh) {
              _bubblePoint.set(b.x, b.y, b.z);
              hoverRay.closestPointToPoint(_bubblePoint, _closestPoint);
              const pdx = b.x - _closestPoint.x;
              const pdy = b.y - _closestPoint.y;
              const pdz = b.z - _closestPoint.z;
              const distSq = pdx * pdx + pdy * pdy + pdz * pdz;
              if (distSq < 0.58 && distSq > 0.0001) {
                const invD = 1 / Math.sqrt(distSq);
                const push = (1 - distSq / 0.58) * 1.15 * dt;
                b.vx += pdx * invD * push;
                b.vz += pdz * invD * push;
              }
            }

            b.x += (targetX - b.x) * Math.min(1, dt * 1.4) + b.vx * dt;
            b.z += (targetZ - b.z) * Math.min(1, dt * 1.4) + b.vz * dt;
            const dampFactor = Math.exp(-2.8 * dt);
            b.vx *= dampFactor;
            b.vz *= dampFactor;
          }

          const squash = 1 + Math.sin(elapsed * 2.4 + b.phase) * 0.055;
          const s = b.popTimer > 0 ? 0.0001 : b.currentScale;
          _scratchPos.set(b.x, b.y, b.z);
          _scratchQuat.identity();
          _scratchScale.set(s * squash, s / squash, s * squash);
          _scratchMat4.compose(_scratchPos, _scratchQuat, _scratchScale);
          bubbles.mesh.setMatrixAt(i, _scratchMat4);
        }
        bubbles.mesh.instanceMatrix.needsUpdate = true;
      }

      // 7. Gentle falling petals interacting with rising bubbles
      const targetPetalOpacity = prefersReducedMotion
        ? 0
        : current.isPlaying
          ? 0.92
          : 0.74;
      fallingPetals.material.opacity = THREE.MathUtils.damp(
        fallingPetals.material.opacity,
        targetPetalOpacity,
        2.6,
        dt,
      );
      fallingPetals.mesh.visible = fallingPetals.material.opacity > 0.01;

      if (fallingPetals.mesh.visible) {
        const fallBoost = current.isPlaying ? 1 + audioEnergy * 0.42 : 0.68;
        for (let i = 0; i < fallingPetals.data.length; i++) {
          const p = fallingPetals.data[i];
          p.y -= dt * Math.max(0.03, p.fallSpeed * fallBoost - p.vyBoost);
          if (p.y < 0.04) {
            p.y = 3.18 + (i % 5) * 0.12;
            p.vx = 0;
            p.vz = 0;
            p.vyBoost = 0;
          }
          p.rotX += dt * p.spinX;
          p.rotY += dt * p.spinY;
          p.rotZ += dt * p.spinZ;

          const driftT = elapsed * p.swayFreq + p.phase;
          const baseX = p.x + Math.sin(driftT) * p.swayAmp;
          const baseZ = p.z + Math.cos(driftT * 0.82) * p.swayAmp * 0.85;

          // Check proximity to active rising bubbles for gentle mutual wake swirl
          for (let j = 0; j < bubbles.data.length; j++) {
            const b = bubbles.data[j];
            if (b.popTimer > 0) continue;
            const dx = p.curX - b.x;
            const dy = p.curY - b.y;
            const dz = p.curZ - b.z;
            const distSq = dx * dx + dy * dy + dz * dz;
            if (distSq < 0.15 && distSq > 0.0001) {
              const invD = 1 / Math.sqrt(distSq);
              const wake = (1 - distSq / 0.15) * 1.1 * dt;
              p.vx += dx * invD * wake;
              p.vz += dz * invD * wake;
              p.vyBoost = Math.min(p.vyBoost + dt * 0.55, 0.22);
              p.rotY += dt * 1.9;
              b.vx -= dx * invD * wake * 0.22;
              b.vz -= dz * invD * wake * 0.22;
            }
          }

          const velDamp = Math.exp(-2.2 * dt);
          p.vx *= velDamp;
          p.vz *= velDamp;
          p.vyBoost *= velDamp;

          p.curX = baseX + p.vx;
          p.curY = p.y;
          p.curZ = baseZ + p.vz;

          _scratchPos.set(p.curX, p.curY, p.curZ);
          _scratchEuler.set(p.rotX, p.rotY, p.rotZ);
          _scratchQuat.setFromEuler(_scratchEuler);
          _scratchScale.setScalar(p.scale);
          _scratchMat4.compose(_scratchPos, _scratchQuat, _scratchScale);
          fallingPetals.mesh.setMatrixAt(i, _scratchMat4);
        }
        fallingPetals.mesh.instanceMatrix.needsUpdate = true;
      }

      // 8. Subtle cozy winter snowfall toggled in lighting mood settings
      const targetSnowOpacity =
        current.snowEnabled && !prefersReducedMotion
          ? targetMood.isDark
            ? 0.84
            : 0.72
          : 0;
      snow.material.opacity = THREE.MathUtils.damp(
        snow.material.opacity,
        targetSnowOpacity,
        2.6,
        dt,
      );
      snow.material.emissiveIntensity = THREE.MathUtils.lerp(0.22, 0.44, glowT);
      snow.mesh.visible = snow.material.opacity > 0.01;

      if (snow.mesh.visible) {
        for (let i = 0; i < snow.data.length; i++) {
          const sf = snow.data[i];
          sf.y -= dt * sf.fallSpeed;
          if (sf.y < 0.03) {
            sf.y = 3.55 + (i % 6) * 0.08;
          }
          sf.rotX += dt * sf.spin;
          sf.rotY += dt * sf.spin * 0.75;

          const x = sf.x + Math.sin(elapsed * sf.swayFreqX + sf.phase) * sf.swayAmp;
          const z = sf.z + Math.cos(elapsed * sf.swayFreqZ + sf.phase * 1.15) * sf.swayAmp * 0.9;

          _scratchPos.set(x, sf.y, z);
          _scratchEuler.set(sf.rotX, sf.rotY, 0);
          _scratchQuat.setFromEuler(_scratchEuler);
          _scratchScale.setScalar(sf.scale);
          _scratchMat4.compose(_scratchPos, _scratchQuat, _scratchScale);
          snow.mesh.setMatrixAt(i, _scratchMat4);
        }
        snow.mesh.instanceMatrix.needsUpdate = true;
      }

      // 9. Night-only bioluminescent fireflies floating with gentle asynchronous pulses
      const targetFireflyOpacity = targetMood.isDark && !prefersReducedMotion ? 1 : 0;
      currentFireflyOpacity = THREE.MathUtils.lerp(
        fromSnapshot.fireflyOpacity,
        targetFireflyOpacity,
        glowT,
      );
      const firefliesVisible = currentFireflyOpacity > 0.01;
      fireflies.coreMesh.visible = firefliesVisible;
      fireflies.haloMesh.visible = firefliesVisible;
      fireflies.coreMaterial.opacity = currentFireflyOpacity * 0.96;
      fireflies.haloMaterial.opacity = currentFireflyOpacity * 0.72;

      if (firefliesVisible) {
        const audioGlowBoost = current.isPlaying ? 1 + audioEnergy * 0.25 : 1;
        for (let i = 0; i < fireflies.data.length; i++) {
          const f = fireflies.data[i];
          const wx = Math.sin(elapsed * f.wanderFreqX + f.phase) * f.wanderAmpX;
          const wy = Math.sin(elapsed * f.wanderFreqY + f.phase * 1.2) * f.wanderAmpY;
          const wz = Math.cos(elapsed * f.wanderFreqZ + f.phase * 0.85) * f.wanderAmpZ;

          _scratchPos.set(f.baseX + wx, f.baseY + wy, f.baseZ + wz);

          // Gentle asymmetric bioluminescent breathing lantern curve
          const wave = 0.5 + 0.5 * Math.sin(elapsed * f.pulseSpeed + f.pulseOffset);
          const pulse = Math.pow(wave, 2.2);
          const coreScale = f.baseScale * (0.65 + 0.55 * pulse) * audioGlowBoost;
          const haloScale = f.baseScale * (0.35 + 0.95 * pulse) * audioGlowBoost;

          _scratchQuat.identity();
          _scratchScale.setScalar(coreScale);
          _scratchMat4.compose(_scratchPos, _scratchQuat, _scratchScale);
          fireflies.coreMesh.setMatrixAt(i, _scratchMat4);

          _scratchScale.setScalar(haloScale);
          _scratchMat4.compose(_scratchPos, camera.quaternion, _scratchScale);
          fireflies.haloMesh.setMatrixAt(i, _scratchMat4);

          const coreBrightness = 0.25 + 0.75 * pulse;
          _fireflyColor.setRGB(
            f.tintR * coreBrightness,
            f.tintG * coreBrightness,
            f.tintB * coreBrightness,
          );
          fireflies.coreMesh.setColorAt(i, _fireflyColor);

          const haloBrightness = 0.08 + 0.92 * pulse;
          _fireflyColor.setRGB(
            f.tintR * haloBrightness,
            f.tintG * haloBrightness,
            f.tintB * haloBrightness,
          );
          fireflies.haloMesh.setColorAt(i, _fireflyColor);
        }
        fireflies.coreMesh.instanceMatrix.needsUpdate = true;
        fireflies.haloMesh.instanceMatrix.needsUpdate = true;
        if (fireflies.coreMesh.instanceColor) fireflies.coreMesh.instanceColor.needsUpdate = true;
        if (fireflies.haloMesh.instanceColor) fireflies.haloMesh.instanceColor.needsUpdate = true;
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      controls.removeEventListener('start', handleControlStart);
      controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      window.removeEventListener('resize', handleResize);
      currentLabelTex?.dispose();
      currentWoodMaps?.map.dispose();
      currentWoodMaps?.roughnessMap.dispose();
      currentArtworkTex?.dispose();
      envTex.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.InstancedMesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Sync reactive visual props without recreating the WebGL canvas
  useEffect(() => {
    sceneApiRef.current?.triggerCameraTransition(cameraPreset);
  }, [cameraPreset]);

  useEffect(() => {
    sceneApiRef.current?.updateFlowerPalette(flowerPalette);
  }, [flowerPalette]);

  useEffect(() => {
    sceneApiRef.current?.updateWoodFinish(woodFinish);
  }, [woodFinish]);

  useEffect(() => {
    sceneApiRef.current?.updateVinylLabel(
      recipientName,
      trackTitle,
      FLOWER_PALETTES[flowerPalette].swatch,
    );
  }, [recipientName, trackTitle, flowerPalette]);

  useEffect(() => {
    sceneApiRef.current?.updateArtworkTexture(coverImageUrl);
  }, [coverImageUrl]);

  if (webglUnavailable) {
    const cleanRecipient = recipientName.trim() || 'for my priority';
    const headingText = /^for\s+/i.test(cleanRecipient)
      ? cleanRecipient
      : `For ${cleanRecipient}`;
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#ECE6DC] text-[#3B2F2B] p-8">
        <div className="max-w-md text-center space-y-4">
          <img
            src={coverImageUrl}
            alt="Botanical vinyl keepsake illustration"
            referrerPolicy="no-referrer"
            className="w-64 h-64 mx-auto rounded-lg object-cover shadow-md border border-[#D8CFC2]"
          />
          <h2 className="font-display text-3xl font-semibold">{headingText}</h2>
          <p className="text-sm text-[#6E6056]">
            3D conservatory view is paused in this browser context. You can still play the music,
            read the gift note, and generate keepsake art below.
          </p>
        </div>
      </div>
    );
  }

  return <div ref={mountRef} className="w-full h-full block select-none" />;
}
