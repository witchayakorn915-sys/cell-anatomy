import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ============================================================
   DOM REFS
   ============================================================ */
const viewport      = document.getElementById('viewport');
const deconSlider    = document.getElementById('decon-slider');
const deconValue     = document.getElementById('decon-value');
const layerListEl    = document.getElementById('layer-list');
const specSheetEl    = document.getElementById('spec-sheet');
const deviceTabsEl   = document.getElementById('device-tabs');
const vpDeviceName   = document.getElementById('vp-device-name');
const vpDeviceSub    = document.getElementById('vp-device-sub');
const hoverTip       = document.getElementById('hover-tip');
const inspEyebrow    = document.getElementById('inspector-eyebrow');
const inspName       = document.getElementById('inspector-name');
const inspMaterial   = document.getElementById('inspector-material');
const inspDesc       = document.getElementById('inspector-desc');
const inspHint       = document.getElementById('inspector-hint');
const btnTheme       = document.getElementById('btn-theme');

/* ============================================================
   THEME STATE
   ============================================================ */
const THEME_KEY = 'cell-anatomy-theme';
let themeKey = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';

const SCENE_THEME = {
  dark: {
    bg: 0x0c1119,
    fogNear: 14, fogFar: 38,
    gridCenter: 0x2a3448, gridLines: 0x1a2334,
    pad: 0x10141e,
    exposure: 1.15,
    ambient: { color: 0x8fa3c8, intensity: 0.55 },
    hemi:    { sky: 0xaecbe8, ground: 0x1a1a1f, intensity: 0.6 },
    key:     { color: 0xfff3e2, intensity: 1.9 },
    rim:     { color: 0x5fa8ff, intensity: 0.5 },
    fill:    { color: 0xdd9553, intensity: 0.25 },
    hoverHex: 0x5fe1cd, hoverIntensity: 0.35,
    selectHex: 0xdd9553, selectIntensity: 0.55
  },
  light: {
    bg: 0xf0f4fa,
    fogNear: 18, fogFar: 48,
    gridCenter: 0xb6c2d4, gridLines: 0xdbe2ed,
    pad: 0xe4eaf3,
    exposure: 1.0,
    ambient: { color: 0xffffff, intensity: 0.85 },
    hemi:    { sky: 0xffffff, ground: 0xd3dbe6, intensity: 0.95 },
    key:     { color: 0xffffff, intensity: 2.1 },
    rim:     { color: 0x7aa7ff, intensity: 0.4 },
    fill:    { color: 0xffcfa0, intensity: 0.35 },
    hoverHex: 0x14b8a6, hoverIntensity: 0.55,
    selectHex: 0xd97706, selectIntensity: 0.5
  }
};

/* ============================================================
   SCENE SETUP
   ============================================================ */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0c1119);
scene.fog = new THREE.Fog(0x0c1119, 14, 38);

const camera = new THREE.PerspectiveCamera(38, viewport.clientWidth / viewport.clientHeight, 0.05, 100);
camera.position.set(9, 6.5, 11);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(viewport.clientWidth, viewport.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
viewport.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 1.2;
controls.maxDistance = 40;
controls.target.set(0, 0.5, 0);

const focusTarget = new THREE.Vector3(0, 0.5, 0);

/* ---- lights ---- */
const ambientLight = new THREE.AmbientLight(0x8fa3c8, 0.55);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0xaecbe8, 0x1a1a1f, 0.6);
scene.add(hemiLight);

const keyLight = new THREE.DirectionalLight(0xfff3e2, 1.9);
keyLight.position.set(6, 10, 7);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x5fa8ff, 0.5);
rimLight.position.set(-7, 4, -6);
scene.add(rimLight);

const fillLight = new THREE.DirectionalLight(0xdd9553, 0.25);
fillLight.position.set(-4, 3, 7);
scene.add(fillLight);

/* ---- ground / grid ---- */
let grid = null;

const padGeo = new THREE.CircleGeometry(12, 48);
const padMat = new THREE.MeshStandardMaterial({ color: 0x10141e, roughness: 1, metalness: 0 });
const pad = new THREE.Mesh(padGeo, padMat);
pad.rotation.x = -Math.PI / 2;
pad.receiveShadow = true;
scene.add(pad);

/* ============================================================
   THEME APPLICATION (3D)
   ============================================================ */
function rebuildGrid(t) {
  if (grid) {
    scene.remove(grid);
    grid.geometry.dispose();
    grid.material.dispose();
  }
  grid = new THREE.GridHelper(36, 36, t.gridCenter, t.gridLines);
  grid.position.y = currentData ? currentData.floorY : -3;
  scene.add(grid);
}

function applySceneTheme(key) {
  const t = SCENE_THEME[key];

  scene.background.setHex(t.bg);
  scene.fog.color.setHex(t.bg);
  scene.fog.near = t.fogNear;
  scene.fog.far = t.fogFar;

  renderer.toneMappingExposure = t.exposure;

  pad.material.color.setHex(t.pad);

  ambientLight.color.setHex(t.ambient.color);
  ambientLight.intensity = t.ambient.intensity;

  hemiLight.color.setHex(t.hemi.sky);
  hemiLight.groundColor.setHex(t.hemi.ground);
  hemiLight.intensity = t.hemi.intensity;

  keyLight.color.setHex(t.key.color);
  keyLight.intensity = t.key.intensity;

  rimLight.color.setHex(t.rim.color);
  rimLight.intensity = t.rim.intensity;

  fillLight.color.setHex(t.fill.color);
  fillLight.intensity = t.fill.intensity;

  rebuildGrid(t);
}

/* ============================================================
   BUILD HELPERS
   ============================================================ */
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

function stdMat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.15, ...opts });
}

function newComponent(id, name, material, description, isContainer = false) {
  return { id, name, material, description, isContainer, parts: [], center: new THREE.Vector3() };
}

function addPart(comp, group, geometry, material, pos, explodeDir, rot) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(pos);
  if (rot) mesh.rotation.set(rot.x || 0, rot.y || 0, rot.z || 0);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.componentId = comp.id;
  mesh.userData.isContainer = !!comp.isContainer;
  group.add(mesh);
  const baseEmissiveHex = mesh.material.emissive ? mesh.material.emissive.getHex() : 0x000000;
  const baseEmissiveIntensity = mesh.material.emissiveIntensity !== undefined ? mesh.material.emissiveIntensity : 1;
  comp.parts.push({ mesh, basePos: pos.clone(), explodeDir: explodeDir.clone(), baseEmissiveHex, baseEmissiveIntensity });
  return mesh;
}

function finalizeComponent(comp, componentsMap, order) {
  const c = new THREE.Vector3();
  comp.parts.forEach(p => c.add(p.basePos));
  c.divideScalar(comp.parts.length);
  comp.center.copy(c);
  componentsMap[comp.id] = comp;
  order.push(comp.id);
}

function disposeGroup(group) {
  group.traverse(obj => {
    if (obj.isMesh) {
      obj.geometry.dispose();
      if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
      else obj.material.dispose();
    }
  });
}

/* ============================================================
   PLANT CELL
   ============================================================ */
function buildPlantCell() {
  const group = new THREE.Group();
  const components = {}; const order = [];

  /* --- Cell wall (outermost, container) --- */
  let c = newComponent('pc-wall', 'Cell wall', 'Cellulose microfibrils',
    'Rigid outer layer made of cellulose microfibrils. Provides structural support, maintains cell shape, and protects against mechanical stress. It is fully permeable to water and small molecules.',
    true);
  addPart(c, group, new THREE.BoxGeometry(5, 4, 4),
    new THREE.MeshStandardMaterial({
      color: 0xa8c47a, transparent: true, opacity: 0.22, roughness: 0.85,
      side: THREE.DoubleSide, depthWrite: false
    }),
    V3(0, 0, 0), V3(0, 2.6, 0));
  finalizeComponent(c, components, order);

  /* --- Plasma membrane (inner boundary, container) --- */
  c = newComponent('pc-membrane', 'Plasma membrane', 'Phospholipid bilayer',
    'Selective barrier just inside the cell wall. Controls which substances enter or leave the cell — the gatekeeper of the cell.',
    true);
  addPart(c, group, new THREE.BoxGeometry(4.7, 3.7, 3.7),
    new THREE.MeshStandardMaterial({
      color: 0x6db8d4, transparent: true, opacity: 0.14, roughness: 0.3,
      side: THREE.DoubleSide, depthWrite: false
    }),
    V3(0, 0, 0), V3(0, 1.2, 0));
  finalizeComponent(c, components, order);

  /* --- Central vacuole (large, translucent, container) --- */
  c = newComponent('pc-vacuole', 'Central vacuole', 'Aqueous solution + tonoplast',
    'A large fluid-filled sac occupying most of the plant cell volume. Stores water, nutrients, and waste, and creates the turgor pressure that keeps the plant upright.',
    true);
  const vacMesh = addPart(c, group, new THREE.SphereGeometry(1.25, 36, 24),
    new THREE.MeshStandardMaterial({
      color: 0x9bc4ec, transparent: true, opacity: 0.26, roughness: 0.15,
      side: THREE.DoubleSide, depthWrite: false
    }),
    V3(0.35, 0, 0), V3(0.5, 0, -2.2));
  vacMesh.scale.set(1.0, 0.9, 1.0);
  finalizeComponent(c, components, order);

  /* --- Nucleus + nucleolus --- */
  c = newComponent('pc-nucleus', 'Nucleus', 'Nuclear envelope + chromatin',
    'Contains the DNA organized as chromatin. Directs all cellular activity by controlling which genes are expressed.',
    false);
  addPart(c, group, new THREE.SphereGeometry(0.65, 28, 20),
    stdMat(0x8b5fbf, { roughness: 0.5, metalness: 0.08 }),
    V3(-1.7, 0.55, 0.35), V3(-2.8, 1.8, 0.8));
  addPart(c, group, new THREE.SphereGeometry(0.27, 18, 14),
    stdMat(0x4a2570, { roughness: 0.6 }),
    V3(-1.65, 0.6, 0.4), V3(-2.8, 1.8, 0.8));
  finalizeComponent(c, components, order);

  /* --- Chloroplasts --- */
  c = newComponent('pc-chloro', 'Chloroplasts', 'Thylakoid membranes + chlorophyll',
    'Green plastids packed with chlorophyll. Site of photosynthesis — converting light, CO₂, and water into glucose and oxygen.',
    false);
  const chloroSites = [
    [ 1.5,  1.1,  0.7],
    [-0.9, -1.3,  0.9],
    [ 1.3, -1.1, -1.0],
    [-1.0,  1.2, -0.8],
    [ 1.7,  0.1, -0.4]
  ];
  chloroSites.forEach(([x, y, z]) => {
    const mesh = addPart(c, group, new THREE.SphereGeometry(0.4, 18, 14),
      new THREE.MeshStandardMaterial({
        color: 0x3fa63f, roughness: 0.55, metalness: 0.05,
        emissive: 0x0a3f0a, emissiveIntensity: 0.15
      }),
      V3(x, y, z), V3(x * 2.6, y * 2.6, z * 2.6));
    mesh.scale.set(1.5, 0.65, 1.0);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  });
  finalizeComponent(c, components, order);

  /* --- Mitochondria --- */
  c = newComponent('pc-mito', 'Mitochondria', 'Double membrane + cristae',
    "The cell's power plants. Perform aerobic respiration to convert glucose and oxygen into usable ATP energy.",
    false);
  const mitoSites = [
    [ 0.7,  1.4,  0.9],
    [-1.1, -0.6, -1.1],
    [ 1.6, -1.3,  0.6],
    [ 0.2,  1.5, -0.9]
  ];
  mitoSites.forEach(([x, y, z]) => {
    const mesh = addPart(c, group, new THREE.SphereGeometry(0.22, 16, 12),
      new THREE.MeshStandardMaterial({ color: 0xc4543d, roughness: 0.5, metalness: 0.1 }),
      V3(x, y, z), V3(x * 3.2, y * 3.2, z * 3.2));
    mesh.scale.set(2.0, 0.7, 0.7);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  });
  finalizeComponent(c, components, order);

  /* --- Rough ER (folded tube ribbons near nucleus) --- */
  c = newComponent('pc-er', 'Rough ER', 'Membrane cisternae + ribosomes',
    'A folded network of membranes extending from the nucleus. Studded with ribosomes, it folds and modifies newly synthesized proteins.',
    false);
  const erBase = V3(-1.1, 0.2, 1.0);
  for (let i = 0; i < 3; i++) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.3, -0.2 + i * 0.15, 0),
      new THREE.Vector3( 0.0,  0.0 + i * 0.15, 0.2),
      new THREE.Vector3( 0.3, -0.2 + i * 0.15, 0.05),
      new THREE.Vector3( 0.6, -0.1 + i * 0.15, 0.25)
    ]);
    const tubeGeom = new THREE.TubeGeometry(curve, 22, 0.06, 8, false);
    addPart(c, group, tubeGeom,
      new THREE.MeshStandardMaterial({ color: 0xe8b8d4, roughness: 0.45 }),
      erBase, V3(-2.5, 1.0, 2.4));
  }
  finalizeComponent(c, components, order);

  /* --- Golgi apparatus (stacked discs) --- */
  c = newComponent('pc-golgi', 'Golgi apparatus', 'Flattened cisternae',
    'A stack of flattened membrane sacs that modifies, sorts, and packages proteins and lipids for transport around or out of the cell.',
    false);
  for (let i = 0; i < 5; i++) {
    const radius = 0.36 - i * 0.03;
    const disc = addPart(c, group, new THREE.CylinderGeometry(radius, radius, 0.03, 22),
      new THREE.MeshStandardMaterial({ color: 0xd88fa8, roughness: 0.5 }),
      V3(1.4, 1.8 - i * 0.08, -1.2), V3(2.6, 3.2, -2.6));
    disc.scale.set(1, 1, 0.6);
  }
  finalizeComponent(c, components, order);

  /* --- Ribosomes --- */
  c = newComponent('pc-ribosomes', 'Ribosomes', 'rRNA + proteins',
    'Tiny molecular machines that translate mRNA into proteins. Found free in the cytoplasm or attached to the rough ER.',
    false);
  const riboSites = [
    [ 0.5,  0.3,  1.6], [-0.8,  0.6,  1.5], [ 0.9, -0.4,  1.4],
    [-0.3, -1.0,  1.3], [ 1.5,  0.7,  1.1], [-1.4, -0.9,  1.1],
    [ 0.2,  1.0, -1.4], [ 1.1, -1.5,  1.2]
  ];
  riboSites.forEach(([x, y, z]) => {
    addPart(c, group, new THREE.SphereGeometry(0.06, 8, 6),
      new THREE.MeshStandardMaterial({
        color: 0xf4d35e, roughness: 0.5,
        emissive: 0x3a2f00, emissiveIntensity: 0.25
      }),
      V3(x, y, z), V3(x * 3.5, y * 3.5, z * 3.5));
  });
  finalizeComponent(c, components, order);

  return {
    group, components, order,
    label: 'Plant Cell',
    tagline: 'A plant cell, gently torn open to reveal the organelles that photosynthesize, store water, and build the plant body.',
    spec: [
      ['Organelles', '9'],
      ['Size', '~10 – 100 µm'],
      ['Shape', 'Rigid rectangular (cellulose wall)'],
      ['Special', 'Chloroplasts · central vacuole']
    ],
    floorY: -3,
    home: { pos: [9, 6.5, 11], target: [0, 0.5, 0] },
    views: {
      iso:   { pos: [9, 6.5, 11],     target: [0, 0.5, 0] },
      top:   { pos: [0.01, 14, 0.01], target: [0, 0, 0] },
      front: { pos: [0, 1.2, 13],     target: [0, 0.3, 0] }
    }
  };
}

/* ============================================================
   ANIMAL CELL
   ============================================================ */
function buildAnimalCell() {
  const group = new THREE.Group();
  const components = {}; const order = [];

  /* --- Plasma membrane (only outer boundary, container) --- */
  let c = newComponent('ac-membrane', 'Plasma membrane', 'Phospholipid bilayer + cholesterol',
    'Selective barrier surrounding the cell. Controls what enters and exits, receives signals, and identifies the cell to its neighbors.',
    true);
  addPart(c, group, new THREE.SphereGeometry(2.4, 44, 30),
    new THREE.MeshStandardMaterial({
      color: 0x6db8d4, transparent: true, opacity: 0.15, roughness: 0.3,
      side: THREE.DoubleSide, depthWrite: false
    }),
    V3(0, 0, 0), V3(0, 4.2, 0));
  finalizeComponent(c, components, order);

  /* --- Cytoplasm (very faint inner volume) --- */
  c = newComponent('ac-cytoplasm', 'Cytoplasm', 'Cytosol (aqueous gel)',
    'Gel-like fluid that fills the cell, suspending all organelles and hosting many metabolic reactions.',
    true);
  addPart(c, group, new THREE.SphereGeometry(2.28, 36, 26),
    new THREE.MeshStandardMaterial({
      color: 0xb8e0ef, transparent: true, opacity: 0.07, roughness: 0.5,
      depthWrite: false
    }),
    V3(0, 0, 0), V3(0, 1.8, 0));
  finalizeComponent(c, components, order);

  /* --- Nucleus + nucleolus --- */
  c = newComponent('ac-nucleus', 'Nucleus', 'Nuclear envelope + chromatin',
    "The command center. Contains the cell's DNA and controls gene expression, cell division, and overall cell activity.",
    false);
  addPart(c, group, new THREE.SphereGeometry(0.9, 30, 22),
    stdMat(0x8b5fbf, { roughness: 0.5, metalness: 0.08 }),
    V3(-0.4, 0.2, 0.3), V3(-3.2, 1.2, 0.6));
  addPart(c, group, new THREE.SphereGeometry(0.34, 18, 14),
    stdMat(0x4a2570, { roughness: 0.6 }),
    V3(-0.35, 0.25, 0.35), V3(-3.2, 1.2, 0.6));
  finalizeComponent(c, components, order);

  /* --- Mitochondria --- */
  c = newComponent('ac-mito', 'Mitochondria', 'Double membrane + cristae',
    "The cell's power plants. Convert glucose and oxygen into ATP through aerobic respiration.",
    false);
  const mitoSites = [
    [ 1.2,  0.6,  0.8],
    [ 0.8, -1.2, -0.5],
    [-1.3, -0.6, -1.0],
    [ 1.4,  0.8, -0.9],
    [-0.8,  1.3,  0.7]
  ];
  mitoSites.forEach(([x, y, z]) => {
    const mesh = addPart(c, group, new THREE.SphereGeometry(0.28, 16, 12),
      new THREE.MeshStandardMaterial({ color: 0xc4543d, roughness: 0.5, metalness: 0.1 }),
      V3(x, y, z), V3(x * 3.0, y * 3.0, z * 3.0));
    mesh.scale.set(2.0, 0.7, 0.7);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  });
  finalizeComponent(c, components, order);

  /* --- Rough ER --- */
  c = newComponent('ac-rer', 'Rough ER', 'Membrane cisternae + ribosomes',
    'Ribosome-studded network continuous with the nuclear envelope. Folds, modifies, and dispatches newly synthesized proteins.',
    false);
  const rerBase = V3(-1.4, -0.4, 0.7);
  for (let i = 0; i < 3; i++) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.3, -0.2 + i * 0.15, 0),
      new THREE.Vector3( 0.1,  0.0 + i * 0.15, 0.2),
      new THREE.Vector3( 0.4, -0.2 + i * 0.15, 0.1),
      new THREE.Vector3( 0.7, -0.15 + i * 0.15, 0.3)
    ]);
    addPart(c, group, new THREE.TubeGeometry(curve, 20, 0.06, 8, false),
      new THREE.MeshStandardMaterial({ color: 0xe8b8d4, roughness: 0.45 }),
      rerBase, V3(-3.2, -1.2, 1.8));
  }
  finalizeComponent(c, components, order);

  /* --- Smooth ER --- */
  c = newComponent('ac-ser', 'Smooth ER', 'Membrane tubules',
    'Tubular network without ribosomes. Synthesizes lipids and steroids and detoxifies harmful substances.',
    false);
  const serBase = V3(-1.5, 1.2, -0.2);
  for (let i = 0; i < 3; i++) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.3 + i * 0.1, 0,    0),
      new THREE.Vector3(-0.1 + i * 0.1, 0.2,  0.15),
      new THREE.Vector3( 0.15 + i * 0.1, 0.1, -0.1),
      new THREE.Vector3( 0.4 + i * 0.1, 0.25, 0.05)
    ]);
    addPart(c, group, new THREE.TubeGeometry(curve, 20, 0.055, 8, false),
      new THREE.MeshStandardMaterial({ color: 0xf0d0e0, roughness: 0.45 }),
      serBase, V3(-2.2, 2.8, -1.2));
  }
  finalizeComponent(c, components, order);

  /* --- Golgi apparatus --- */
  c = newComponent('ac-golgi', 'Golgi apparatus', 'Flattened cisternae',
    'A stack of flattened membrane sacs that modifies, sorts, and packages proteins and lipids for shipment inside or outside the cell.',
    false);
  for (let i = 0; i < 5; i++) {
    const radius = 0.42 - i * 0.03;
    const disc = addPart(c, group, new THREE.CylinderGeometry(radius, radius, 0.03, 22),
      new THREE.MeshStandardMaterial({ color: 0xd88fa8, roughness: 0.5 }),
      V3(1.3, 1.5 - i * 0.08, 0.9), V3(2.6, 3.2, 1.8));
    disc.scale.set(1, 1, 0.6);
  }
  finalizeComponent(c, components, order);

  /* --- Lysosomes --- */
  c = newComponent('ac-lyso', 'Lysosomes', 'Hydrolytic enzymes',
    'Membrane-bound sacs of digestive enzymes. Break down worn-out organelles, food particles, and invading microbes.',
    false);
  const lysoSites = [
    [ 0.8, -0.9,  1.3],
    [-1.2,  0.9,  1.4],
    [ 1.5, -1.4, -1.0]
  ];
  lysoSites.forEach(([x, y, z]) => {
    addPart(c, group, new THREE.SphereGeometry(0.22, 16, 12),
      new THREE.MeshStandardMaterial({
        color: 0xe89b3f, roughness: 0.5,
        emissive: 0x3a1f00, emissiveIntensity: 0.18
      }),
      V3(x, y, z), V3(x * 3.2, y * 3.2, z * 3.2));
  });
  finalizeComponent(c, components, order);

  /* --- Ribosomes --- */
  c = newComponent('ac-ribosomes', 'Ribosomes', 'rRNA + proteins',
    'Tiny molecular machines that translate mRNA into proteins. Scattered freely through the cytoplasm or docked on the rough ER.',
    false);
  const riboSites = [
    [ 0.5,  0.5,  1.5], [-1.0, -1.2,  1.2], [ 1.6,  0.3,  1.0],
    [-0.3,  1.6,  0.8], [ 1.2, -0.5,  1.5], [-1.5, -0.8,  0.5],
    [ 0.3, -1.7,  0.9], [ 0.9,  1.6, -0.6]
  ];
  riboSites.forEach(([x, y, z]) => {
    addPart(c, group, new THREE.SphereGeometry(0.06, 8, 6),
      new THREE.MeshStandardMaterial({
        color: 0xf4d35e, roughness: 0.5,
        emissive: 0x3a2f00, emissiveIntensity: 0.25
      }),
      V3(x, y, z), V3(x * 3.4, y * 3.4, z * 3.4));
  });
  finalizeComponent(c, components, order);

  /* --- Centrioles (perpendicular pair) --- */
  c = newComponent('ac-centrioles', 'Centrioles', 'Microtubule triplets',
    "Paired cylindrical structures that organize the cell's microtubules. They form the spindle fibers that pull chromosomes apart during cell division.",
    false);
  const centBase = V3(0.9, -0.6, -1.3);
  const c1 = addPart(c, group, new THREE.CylinderGeometry(0.1, 0.1, 0.35, 12),
    new THREE.MeshStandardMaterial({ color: 0x88b0d0, roughness: 0.4, metalness: 0.2 }),
    centBase, V3(2.8, -2.2, -2.8));
  c1.rotation.z = Math.PI / 2;
  addPart(c, group, new THREE.CylinderGeometry(0.1, 0.1, 0.35, 12),
    new THREE.MeshStandardMaterial({ color: 0x88b0d0, roughness: 0.4, metalness: 0.2 }),
    V3(1.25, -0.6, -1.3), V3(2.8, -2.2, -2.8));
  finalizeComponent(c, components, order);

  return {
    group, components, order,
    label: 'Animal Cell',
    tagline: 'An animal cell, gently exploded to show the organelles that power, package, digest, and protect it.',
    spec: [
      ['Organelles', '10'],
      ['Size', '~10 – 30 µm'],
      ['Shape', 'Flexible round (no cell wall)'],
      ['Special', 'Centrioles · lysosomes']
    ],
    floorY: -3,
    home: { pos: [8, 5.5, 9.5], target: [0, 0, 0] },
    views: {
      iso:   { pos: [8, 5.5, 9.5],    target: [0, 0, 0] },
      top:   { pos: [0.01, 13, 0.01], target: [0, 0, 0] },
      front: { pos: [0, 1, 12],       target: [0, 0, 0] }
    }
  };
}

/* ============================================================
   REGISTRY + STATE
   ============================================================ */
const DEVICES = {
  plant:  { key: 'plant',  build: buildPlantCell },
  animal: { key: 'animal', build: buildAnimalCell }
};
const DEVICE_ORDER = ['plant', 'animal'];

let currentGroup = null;
let currentData = null;
let selectedId = null;
let hoveredId = null;

/* ---- device tabs ---- */
DEVICE_ORDER.forEach(key => {
  const btn = document.createElement('button');
  btn.dataset.device = key;
  btn.innerHTML = `<span class="dot"></span><span class="label"></span>`;
  btn.addEventListener('click', () => loadDevice(key));
  deviceTabsEl.appendChild(btn);
});

function updateActiveTab(key) {
  deviceTabsEl.querySelectorAll('button').forEach(b => {
    b.classList.toggle('active', b.dataset.device === key);
  });
}

/* ============================================================
   LOAD / SWITCH CELL
   ============================================================ */
function loadDevice(key) {
  const def = DEVICES[key];
  if (!def) return;
  const data = def.build();

  if (currentGroup) {
    scene.remove(currentGroup);
    disposeGroup(currentGroup);
  }

  currentGroup = data.group;
  currentData = data;
  scene.add(currentGroup);

  selectedId = null;
  hoveredId = null;

  if (grid) grid.position.y = data.floorY;
  pad.position.y = data.floorY + 0.01;

  buildLayerList(data);
  buildSpecSheet(data);

  vpDeviceName.textContent = data.label;
  vpDeviceSub.textContent = 'exploded-view inspector';

  deconSlider.value = 0;
  deconValue.textContent = '0%';

  camera.position.set(...data.home.pos);
  focusTarget.set(...data.home.target);
  controls.target.copy(focusTarget);

  showOverview(data);
  updateActiveTab(key);

  const labelForTab = deviceTabsEl.querySelector(`button[data-device="${key}"] .label`);
  if (labelForTab) labelForTab.textContent = data.label;
}

DEVICE_ORDER.forEach(key => {
  const btn = deviceTabsEl.querySelector(`button[data-device="${key}"]`);
  const tmpLabel = { plant: 'Plant Cell', animal: 'Animal Cell' }[key];
  btn.querySelector('.label').textContent = tmpLabel;
});

/* ============================================================
   LEFT PANEL
   ============================================================ */
function buildLayerList(data) {
  layerListEl.innerHTML = '';
  data.order.forEach((id, idx) => {
    const comp = data.components[id];
    const li = document.createElement('li');
    li.dataset.id = id;
    const idxStr = String(idx + 1).padStart(2, '0');
    li.innerHTML = `
      <span class="idx">${idxStr}</span>
      <span class="meta">
        <div class="name">${comp.name}</div>
        <div class="material">${comp.material}</div>
      </span>
    `;
    li.addEventListener('click', () => toggleSelect(id));
    layerListEl.appendChild(li);
  });
}

function buildSpecSheet(data) {
  specSheetEl.innerHTML = data.spec.map(([label, val]) => `
    <div class="spec-row"><span>${label}</span><span>${val}</span></div>
  `).join('');
}

function highlightListRow() {
  layerListEl.querySelectorAll('li').forEach(li => {
    li.classList.toggle('selected', selectedId === li.dataset.id);
    li.classList.toggle('hovered', !selectedId && hoveredId === li.dataset.id);
  });
}

/* ============================================================
   INSPECTOR
   ============================================================ */
function showOverview(data) {
  inspEyebrow.textContent = data.order.length + ' ORGANELLES';
  inspName.textContent = data.label;
  inspMaterial.style.display = 'none';
  inspDesc.textContent = data.tagline;
  inspHint.textContent = 'Hover an organelle in the viewport, or click a row in the organelle list, to inspect it. Drag the deconstruct slider to pull the cell apart.';
}

function showComponent(id) {
  const data = currentData;
  const idx = data.order.indexOf(id);
  const comp = data.components[id];
  if (!comp) return;
  inspEyebrow.textContent = `ORGANELLE ${String(idx + 1).padStart(2, '0')} / ${data.order.length}`;
  inspName.textContent = comp.name;
  inspMaterial.style.display = 'inline-block';
  inspMaterial.textContent = comp.material;
  inspDesc.textContent = comp.description;
  inspHint.textContent = selectedId === id
    ? 'Click this organelle again, or click empty space, to deselect it.'
    : '';
}

function refreshInspector() {
  if (selectedId) showComponent(selectedId);
  else if (hoveredId) showComponent(hoveredId);
  else showOverview(currentData);
}

/* ============================================================
   HIGHLIGHTING
   ============================================================ */
function setComponentHighlight(id, hex, intensity) {
  const comp = currentData.components[id];
  if (!comp) return;
  comp.parts.forEach(p => {
    if (p.mesh.material && p.mesh.material.emissive) {
      p.mesh.material.emissive.setHex(hex);
      p.mesh.material.emissiveIntensity = intensity;
    }
  });
}

function clearComponentHighlight(id) {
  const comp = currentData.components[id];
  if (!comp) return;
  comp.parts.forEach(p => {
    if (p.mesh.material && p.mesh.material.emissive) {
      p.mesh.material.emissive.setHex(p.baseEmissiveHex);
      p.mesh.material.emissiveIntensity = p.baseEmissiveIntensity;
    }
  });
}

function refreshHighlights() {
  if (!currentData) return;
  const t = SCENE_THEME[themeKey];
  if (hoveredId && hoveredId !== selectedId) setComponentHighlight(hoveredId, t.hoverHex, t.hoverIntensity);
  if (selectedId) setComponentHighlight(selectedId, t.selectHex, t.selectIntensity);
}

function setHovered(id) {
  if (id === hoveredId) return;
  if (hoveredId && hoveredId !== selectedId) clearComponentHighlight(hoveredId);
  hoveredId = id;
  const t = SCENE_THEME[themeKey];
  if (hoveredId && hoveredId !== selectedId) setComponentHighlight(hoveredId, t.hoverHex, t.hoverIntensity);
  highlightListRow();
  refreshInspector();
}

function toggleSelect(id) {
  const t = SCENE_THEME[themeKey];
  if (selectedId === id) {
    clearComponentHighlight(id);
    selectedId = null;
    if (hoveredId === id) setComponentHighlight(id, t.hoverHex, t.hoverIntensity);
    focusTarget.copy(new THREE.Vector3(...currentData.home.target));
  } else {
    if (selectedId) clearComponentHighlight(selectedId);
    if (hoveredId && hoveredId !== id) clearComponentHighlight(hoveredId);
    selectedId = id;
    setComponentHighlight(id, t.selectHex, t.selectIntensity);
    focusTarget.copy(currentData.components[id].center);
  }
  highlightListRow();
  refreshInspector();
}

function clearSelection() {
  if (selectedId) {
    clearComponentHighlight(selectedId);
    selectedId = null;
    focusTarget.copy(new THREE.Vector3(...currentData.home.target));
    highlightListRow();
    refreshInspector();
  }
}

/* ============================================================
   RAYCASTING (with container-bypass logic)
   ============================================================ */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function getAllMeshes() {
  const arr = [];
  if (currentGroup) currentGroup.traverse(o => { if (o.isMesh) arr.push(o); });
  return arr;
}

/* Prefer non-container intersections so users can click "through"
   translucent cell walls and membranes to reach organelles inside. */
function pickComponent(intersections) {
  if (!intersections.length) return null;
  const nonContainer = intersections.find(h => !h.object.userData.isContainer);
  const chosen = nonContainer || intersections[0];
  return chosen.object.userData.componentId;
}

renderer.domElement.addEventListener('pointermove', (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(getAllMeshes(), false);
  const found = pickComponent(hits);
  setHovered(found);

  if (found) {
    hoverTip.style.display = 'block';
    hoverTip.style.left = (event.clientX + 14) + 'px';
    hoverTip.style.top = (event.clientY + 14) + 'px';
    hoverTip.textContent = currentData.components[found].name;
  } else {
    hoverTip.style.display = 'none';
  }
});

renderer.domElement.addEventListener('pointerleave', () => {
  setHovered(null);
  hoverTip.style.display = 'none';
});

renderer.domElement.addEventListener('click', (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(getAllMeshes(), false);
  const found = pickComponent(hits);
  if (found) toggleSelect(found);
  else clearSelection();
});

/* ============================================================
   DECONSTRUCTION SLIDER
   ============================================================ */
function updateDeconstruction(factor) {
  if (!currentData) return;
  currentData.order.forEach(id => {
    const comp = currentData.components[id];
    comp.parts.forEach(p => {
      p.mesh.position.copy(p.basePos).add(p.explodeDir.clone().multiplyScalar(factor));
    });
  });
}

deconSlider.addEventListener('input', () => {
  const val = parseFloat(deconSlider.value);
  deconValue.textContent = Math.round(val) + '%';
  updateDeconstruction(val / 100);
});

document.querySelectorAll('.decon-chips button').forEach(btn => {
  btn.addEventListener('click', () => {
    const val = parseFloat(btn.dataset.val);
    deconSlider.value = val;
    deconValue.textContent = val + '%';
    updateDeconstruction(val / 100);
  });
});

/* ============================================================
   CAMERA VIEW PRESETS + RESET
   ============================================================ */
function setView(viewKey) {
  const v = currentData.views[viewKey];
  if (!v) return;
  camera.position.set(...v.pos);
  focusTarget.set(...v.target);
}

document.querySelectorAll('#view-presets button').forEach(btn => {
  btn.addEventListener('click', () => setView(btn.dataset.view));
});

document.getElementById('btn-reset').addEventListener('click', () => {
  setView('iso');
  clearSelection();
});

/* ============================================================
   THEME SWITCHING
   ============================================================ */
function setTheme(key, persist = true) {
  themeKey = key === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', themeKey);

  if (persist) {
    try { localStorage.setItem(THEME_KEY, themeKey); } catch (e) {}
  }

  btnTheme.title = themeKey === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  btnTheme.setAttribute('aria-pressed', themeKey === 'light' ? 'true' : 'false');

  applySceneTheme(themeKey);
  refreshHighlights();
}

btnTheme.addEventListener('click', () => {
  setTheme(themeKey === 'dark' ? 'light' : 'dark');
});

if (window.matchMedia) {
  const mq = window.matchMedia('(prefers-color-scheme: light)');
  const onChange = (e) => {
    let saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (err) {}
    if (saved) return;
    setTheme(e.matches ? 'light' : 'dark', false);
  };
  if (mq.addEventListener) mq.addEventListener('change', onChange);
  else if (mq.addListener) mq.addListener(onChange);
}

/* ============================================================
   RESIZE
   ============================================================ */
function resize() {
  const w = viewport.clientWidth, h = viewport.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
window.addEventListener('resize', resize);

/* ============================================================
   ANIMATION LOOP
   ============================================================ */
function animate() {
  requestAnimationFrame(animate);
  controls.target.lerp(focusTarget, 0.09);
  controls.update();
  renderer.render(scene, camera);
}

/* ============================================================
   INIT
   ============================================================ */
applySceneTheme(themeKey);
btnTheme.title = themeKey === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
btnTheme.setAttribute('aria-pressed', themeKey === 'light' ? 'true' : 'false');

loadDevice('plant');
animate();
setTimeout(resize, 60);