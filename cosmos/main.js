/* ═══════════════════════════════════════════════════════════════
   COSMOS — an infinite 3D scroll journey through spacetime
   Everything procedural: no textures downloaded, every world is
   generated in GLSL. Camera rides a CLOSED spline — scroll forever.
   ═══════════════════════════════════════════════════════════════ */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* ══════════ SHARED GLSL ══════════ */

const NOISE = /* glsl */`
float hash(vec3 p){ p = fract(p*0.3183099 + 0.1); p *= 17.0;
  return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float noise(vec3 x){
  vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i+vec3(0,0,0)), hash(i+vec3(1,0,0)), f.x),
                 mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
                 mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y), f.z); }
float fbm(vec3 p){
  float v = 0.0; float a = 0.5;
  for(int i = 0; i < 5; i++){ v += a*noise(p); p *= 2.02; a *= 0.5; }
  return v; }
`;

const PLANET_VERT = /* glsl */`
varying vec3 vN; varying vec3 vPos; varying vec3 vWorld;
void main(){
  vN = normalize(mat3(modelMatrix) * normal);
  vPos = position;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const PLANET_FRAG_HEAD = /* glsl */`
uniform float uTime; uniform vec3 uLightDir;
varying vec3 vN; varying vec3 vPos; varying vec3 vWorld;
` + NOISE;

/* ══════════ RENDERER / SCENE ══════════ */

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x030308);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 4000);
camera.position.set(0, 2, 52);

const timeMats = [];   // materials whose uTime must tick
function track(m){ timeMats.push(m); return m; }

/* ══════════ CHAPTER / PATH DEFINITION ══════════
   9 visible chapters + 2 hidden "return" anchors under the scene.
   The spline is CLOSED → progress wraps → infinite scroll.        */

/* shift: pushes the look-target sideways so the planet frames
   OPPOSITE its text panel (panel left → planet right, etc.)      */
const CH = [
  { key:'ORIGIN',      accent:'#8db4ff', cam:[  0,  2,   52], look:[  0,  0,  -80] },
  { key:'GRAVITY',     accent:'#4da3ff', cam:[-11,  3,  -46], obj:[ 16, -4,  -85], r:11, shift:-14 },
  { key:'ESCAPE',      accent:'#ff6b4a', cam:[ 12, -1, -160], obj:[-20,  5, -195], r:8,  shift: 11 },
  { key:'SCALE',       accent:'#ffb066', cam:[-14,  5, -262], obj:[ 26, -6, -315], r:16, shift:-20 },
  { key:'TIDES',       accent:'#ffd98f', cam:[ 16, 17, -392], obj:[-34,  9, -455], r:13, shift: 24 },
  { key:'FUSION',      accent:'#ffcf4d', cam:[-30,  8, -528], obj:[ 14,  0, -608], r:20, shift:-24 },
  { key:'COLLAPSE',    accent:'#9fd8ff', cam:[  8,  2, -706], obj:[ 24,  6, -728], r:3,  shift:  7 },
  { key:'SINGULARITY', accent:'#ff9d45', cam:[-16,  7, -806], obj:[  0,  0, -872], r:9,  shift:-16 },
  { key:'HORIZON',     accent:'#c9a0ff', cam:[  0,  4, -832], look:[ 0,  0, -872] },
];
const HIDDEN = [
  { cam:[0, -420, -560], look:[0, -420, -380] },
  { cam:[0, -380,   40], look:[0, -140,  -40] },
];
const N = CH.length + HIDDEN.length;          // 11 anchors on the loop

const v3 = a => new THREE.Vector3(...a);
const camCurve  = new THREE.CatmullRomCurve3(
  [...CH.map(c => v3(c.cam)), ...HIDDEN.map(c => v3(c.cam))], true, 'centripetal');
const lookCurve = new THREE.CatmullRomCurve3(
  [...CH.map(c => {
    const p = v3(c.look ?? c.obj);
    if (c.shift) p.x += c.shift;
    return p;
  }), ...HIDDEN.map(c => v3(c.look))], true, 'centripetal');

/* per-planet light: aimed so the lit face plays to the camera */
function lightDirFor(ch){
  const o = v3(ch.obj), c = v3(ch.cam);
  return c.sub(o).normalize().add(new THREE.Vector3(0.55, 0.35, 0)).normalize();
}

/* ══════════ STARFIELD — all the colors of the universe ══════════ */

const STAR_PALETTE = [
  [0xffffff, 46], [0xaac8ff, 18], [0xffd9a0, 14], [0xffcf4d, 8],
  [0xff8a6b, 6], [0x7bf0e4, 4], [0xd5a0ff, 4],
];
function pickStarColor(){
  let r = Math.random() * 100;
  for (const [hex, w] of STAR_PALETTE){ if ((r -= w) <= 0) return new THREE.Color(hex); }
  return new THREE.Color(0xffffff);
}

function makePoints(count, spread, sizeMin, sizeMax, brightness){
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const phase = new Float32Array(count);
  for (let i = 0; i < count; i++){
    let x, y, z, ok = false;
    while (!ok){
      x = (Math.random() - 0.5) * spread.x;
      y = (Math.random() - 0.5) * spread.y;
      z = spread.zMin + Math.random() * (spread.zMax - spread.zMin);
      ok = Math.hypot(x, y) > spread.clear;   // keep the flight path clear
    }
    pos.set([x, y, z], i * 3);
    const c = pickStarColor().multiplyScalar(brightness);
    col.set([c.r, c.g, c.b], i * 3);
    size[i] = sizeMin + Math.random() * (sizeMax - sizeMin);
    phase[i] = Math.random() * Math.PI * 2;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  const m = track(new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute vec3 aColor; attribute float aSize; attribute float aPhase;
      uniform float uTime;
      varying vec3 vColor; varying float vTw;
      void main(){
        vColor = aColor;
        vTw = 0.72 + 0.28 * sin(uTime * (0.6 + fract(aPhase) * 1.8) + aPhase * 37.0);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * (280.0 / max(1.0, -mv.z));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vColor; varying float vTw;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.08, d);
        gl_FragColor = vec4(vColor * vTw, a);
      }`,
  }));
  return new THREE.Points(g, m);
}

scene.add(makePoints(6500, { x: 1700, y: 1400, zMin: -1900, zMax: 400, clear: 90 }, 1.2, 3.2, 1.0));
scene.add(makePoints(2600, { x: 320, y: 260, zMin: -1050, zMax: 120, clear: 12 }, 0.5, 1.3, 0.55)); // near dust — speed cue

/* ══════════ NEBULAE — soft color clouds everywhere ══════════ */

function glowTexture(stops){
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  for (const [o, col] of stops) g.addColorStop(o, col);
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const nebulaTex = glowTexture([[0, 'rgba(255,255,255,1)'], [0.35, 'rgba(255,255,255,0.35)'], [1, 'rgba(255,255,255,0)']]);

const NEBULA_HUES = [0x7b2ff7, 0xe0409f, 0x18c4b8, 0x2a6cff, 0xff9d45, 0xff6bb0, 0x9dff6b];
for (let i = 0; i < 16; i++){
  const mat = new THREE.SpriteMaterial({
    map: nebulaTex, color: NEBULA_HUES[i % NEBULA_HUES.length],
    transparent: true, opacity: 0.05 + Math.random() * 0.06,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const s = new THREE.Sprite(mat);
  const side = Math.random() > 0.5 ? 1 : -1;
  s.position.set(side * (140 + Math.random() * 380), (Math.random() - 0.5) * 420, 160 - Math.random() * 1300);
  const sc = 240 + Math.random() * 320;
  s.scale.set(sc, sc * (0.55 + Math.random() * 0.6), 1);
  scene.add(s);
}

/* ══════════ ATMOSPHERE HALO (shared builder) ══════════ */

function addAtmosphere(group, radius, colorHex, lightDir, intensity = 1){
  const mat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(colorHex) }, uLightDir: { value: lightDir }, uI: { value: intensity } },
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    vertexShader: PLANET_VERT,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform vec3 uLightDir; uniform float uI;
      varying vec3 vN; varying vec3 vWorld;
      void main(){
        vec3 Nn = normalize(vN);
        vec3 V = normalize(cameraPosition - vWorld);
        float rim = pow(1.0 - abs(dot(Nn, V)), 3.2);
        float lit = 0.3 + 0.7 * max(dot(Nn, normalize(uLightDir)), 0.12);
        gl_FragColor = vec4(uColor * rim * lit * uI, rim);
      }`,
  });
  group.add(new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 48), mat));
}

/* ══════════ EARTH ══════════ */

function buildEarth(ch){
  const g = new THREE.Group(); g.position.copy(v3(ch.obj));
  const L = lightDirFor(ch);

  const surf = track(new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uLightDir: { value: L } },
    vertexShader: PLANET_VERT,
    fragmentShader: PLANET_FRAG_HEAD + /* glsl */`
    void main(){
      vec3 Nn = normalize(vN);
      vec3 Ld = normalize(uLightDir);
      vec3 V = normalize(cameraPosition - vWorld);
      vec3 p = normalize(vPos);
      float warp = fbm(p * 4.0);
      float h = fbm(p * 2.3 + warp * 0.55);
      float land = smoothstep(0.50, 0.535, h);
      float detail = fbm(p * 8.0);
      vec3 ocean = mix(vec3(0.008, 0.045, 0.14), vec3(0.02, 0.14, 0.30), smoothstep(0.33, 0.5, h));
      vec3 lowland = mix(vec3(0.05, 0.22, 0.07), vec3(0.36, 0.30, 0.12), smoothstep(0.3, 0.75, detail));
      vec3 landCol = mix(lowland, vec3(0.36, 0.29, 0.23), smoothstep(0.58, 0.75, h));
      float ice = smoothstep(0.72, 0.82, abs(p.y) + detail * 0.08);
      vec3 surfCol = mix(ocean, landCol, land);
      surfCol = mix(surfCol, vec3(0.93, 0.96, 1.0), ice);
      float diff = max(dot(Nn, Ld), 0.0);
      float night = smoothstep(0.05, -0.2, dot(Nn, Ld));
      float cities = smoothstep(0.55, 0.78, fbm(p * 14.0)) * land * (1.0 - ice);
      vec3 col = surfCol * (diff * 1.15 + 0.015);
      col += vec3(1.0, 0.72, 0.35) * cities * night * 0.55;
      float spec = pow(max(dot(reflect(-Ld, Nn), V), 0.0), 44.0) * (1.0 - land) * diff;
      col += vec3(0.5, 0.62, 0.72) * spec * 0.5;
      float fres = pow(1.0 - max(dot(Nn, V), 0.0), 3.0);
      col += vec3(0.2, 0.45, 1.0) * fres * (0.14 + diff * 0.3);
      gl_FragColor = vec4(col, 1.0);
    }`,
  }));
  const body = new THREE.Mesh(new THREE.SphereGeometry(ch.r, 96, 96), surf);
  g.add(body);

  const clouds = track(new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uLightDir: { value: L } },
    transparent: true, depthWrite: false,
    vertexShader: PLANET_VERT,
    fragmentShader: PLANET_FRAG_HEAD + /* glsl */`
    void main(){
      vec3 Nn = normalize(vN);
      vec3 p = normalize(vPos);
      float c = fbm(p * 3.2 + vec3(uTime * 0.02, 0.0, uTime * 0.012) + fbm(p * 6.0) * 0.5);
      float a = smoothstep(0.5, 0.74, c);
      float diff = max(dot(Nn, normalize(uLightDir)), 0.0) + 0.03;
      gl_FragColor = vec4(vec3(1.0) * diff, a * 0.85);
    }`,
  }));
  const cloudMesh = new THREE.Mesh(new THREE.SphereGeometry(ch.r * 1.018, 72, 72), clouds);
  g.add(cloudMesh);

  addAtmosphere(g, ch.r * 1.14, 0x3d7fff, L, 0.6);
  g.userData.tick = (dt) => { body.rotation.y += dt * 0.05; cloudMesh.rotation.y += dt * 0.066; };
  scene.add(g); return g;
}

/* ══════════ MARS ══════════ */

function buildMars(ch){
  const g = new THREE.Group(); g.position.copy(v3(ch.obj));
  const L = lightDirFor(ch);
  const surf = track(new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uLightDir: { value: L } },
    vertexShader: PLANET_VERT,
    fragmentShader: PLANET_FRAG_HEAD + /* glsl */`
    void main(){
      vec3 Nn = normalize(vN);
      vec3 Ld = normalize(uLightDir);
      vec3 V = normalize(cameraPosition - vWorld);
      vec3 p = normalize(vPos);
      float h = fbm(p * 3.0 + fbm(p * 7.0) * 0.5);
      vec3 base = mix(vec3(0.34, 0.11, 0.045), vec3(0.76, 0.35, 0.14), h);
      base = mix(base, vec3(0.52, 0.20, 0.08), fbm(p * 12.0) * 0.55);
      float canyon = smoothstep(0.48, 0.52, fbm(p * 5.0 + 3.7));
      base *= 0.82 + 0.18 * canyon;
      float cap = smoothstep(0.78, 0.87, abs(p.y) + fbm(p * 9.0) * 0.05);
      base = mix(base, vec3(0.95, 0.92, 0.88), cap);
      float diff = max(dot(Nn, Ld), 0.0);
      vec3 col = base * (diff * 1.35 + 0.02);
      float fres = pow(1.0 - max(dot(Nn, V), 0.0), 3.5);
      col += vec3(0.9, 0.45, 0.25) * fres * 0.18;
      gl_FragColor = vec4(col, 1.0);
    }`,
  }));
  const body = new THREE.Mesh(new THREE.SphereGeometry(ch.r, 80, 80), surf);
  g.add(body);
  addAtmosphere(g, ch.r * 1.1, 0xcc6a3a, L, 0.38);
  g.userData.tick = (dt) => { body.rotation.y += dt * 0.06; };
  scene.add(g); return g;
}

/* ══════════ JUPITER ══════════ */

function buildJupiter(ch){
  const g = new THREE.Group(); g.position.copy(v3(ch.obj));
  const L = lightDirFor(ch);
  const surf = track(new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uLightDir: { value: L } },
    vertexShader: PLANET_VERT,
    fragmentShader: PLANET_FRAG_HEAD + /* glsl */`
    void main(){
      vec3 Nn = normalize(vN);
      vec3 Ld = normalize(uLightDir);
      vec3 V = normalize(cameraPosition - vWorld);
      vec3 p = normalize(vPos);
      float swirl = fbm(vec3(p.x * 2.0, p.y * 8.0, p.z * 2.0) + vec3(uTime * 0.015, 0.0, 0.0));
      float bandv = sin(p.y * 14.0 + swirl * 5.0 + fbm(p * 3.0) * 2.0);
      vec3 base = mix(vec3(0.46, 0.26, 0.13), vec3(0.87, 0.72, 0.51), 0.5 + 0.5 * bandv);
      base = mix(base, vec3(0.93, 0.86, 0.70), smoothstep(0.78, 1.0, fbm(p * 5.0)) * 0.5);
      base = mix(base, vec3(0.38, 0.23, 0.13), smoothstep(0.55, 0.95, abs(p.y)));
      // Great Red Spot — elliptical vortex
      vec3 spotDir = normalize(vec3(-0.35, -0.30, 0.88));
      vec3 dp = p - spotDir; dp.y *= 1.9;
      float sd = length(dp);
      float spot = 1.0 - smoothstep(0.10, 0.30, sd);
      float vortex = fbm(vec3(sd * 22.0 - uTime * 0.12, atan(dp.y, dp.x) * 2.5, 3.0));
      base = mix(base, vec3(0.72, 0.22, 0.10) * (0.75 + 0.5 * vortex), spot * 0.92);
      float diff = max(dot(Nn, Ld), 0.0);
      vec3 col = base * (diff * 1.12 + 0.03);
      float fres = pow(1.0 - max(dot(Nn, V), 0.0), 3.2);
      col += vec3(0.9, 0.7, 0.45) * fres * 0.13;
      gl_FragColor = vec4(col, 1.0);
    }`,
  }));
  const body = new THREE.Mesh(new THREE.SphereGeometry(ch.r, 96, 96), surf);
  g.add(body);
  addAtmosphere(g, ch.r * 1.09, 0xd9a066, L, 0.6);
  g.userData.tick = (dt) => { body.rotation.y += dt * 0.14; };
  scene.add(g); return g;
}

/* ══════════ SATURN + RINGS ══════════ */

function buildSaturn(ch){
  const g = new THREE.Group(); g.position.copy(v3(ch.obj));
  const L = lightDirFor(ch);
  const surf = track(new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uLightDir: { value: L } },
    vertexShader: PLANET_VERT,
    fragmentShader: PLANET_FRAG_HEAD + /* glsl */`
    void main(){
      vec3 Nn = normalize(vN);
      vec3 Ld = normalize(uLightDir);
      vec3 V = normalize(cameraPosition - vWorld);
      vec3 p = normalize(vPos);
      float bandv = sin(p.y * 11.0 + fbm(p * 2.5 + vec3(uTime * 0.01, 0.0, 0.0)) * 1.6) * 0.5 + 0.5;
      vec3 base = mix(vec3(0.70, 0.57, 0.36), vec3(0.90, 0.82, 0.62), bandv);
      base = mix(base, vec3(0.55, 0.46, 0.32), smoothstep(0.6, 0.95, abs(p.y)));
      float diff = max(dot(Nn, Ld), 0.0);
      vec3 col = base * (diff * 1.08 + 0.03);
      float fres = pow(1.0 - max(dot(Nn, V), 0.0), 3.2);
      col += vec3(0.95, 0.85, 0.6) * fres * 0.12;
      gl_FragColor = vec4(col, 1.0);
    }`,
  }));
  const body = new THREE.Mesh(new THREE.SphereGeometry(ch.r, 80, 80), surf);
  g.add(body);

  const inner = ch.r * 1.35, outer = ch.r * 2.3;
  const ringMat = track(new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uInner: { value: inner }, uOuter: { value: outer } },
    transparent: true, side: THREE.DoubleSide, depthWrite: false,
    vertexShader: /* glsl */`
      varying vec3 vPos;
      void main(){ vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: NOISE + /* glsl */`
      uniform float uInner; uniform float uOuter; uniform float uTime;
      varying vec3 vPos;
      void main(){
        float rr = length(vPos.xy);
        float rn = (rr - uInner) / (uOuter - uInner);
        float bands = 0.5 + 0.5 * noise(vec3(rn * 60.0, 0.0, 2.0));
        bands *= 0.62 + 0.38 * noise(vec3(rn * 150.0, 5.0, 7.0));
        float gap = 1.0 - (smoothstep(0.56, 0.585, rn) - smoothstep(0.615, 0.64, rn)); // Cassini division
        float alpha = bands * gap * smoothstep(0.0, 0.05, rn) * (1.0 - smoothstep(0.9, 1.0, rn));
        vec3 col = mix(vec3(0.82, 0.71, 0.5), vec3(0.97, 0.92, 0.78), bands);
        gl_FragColor = vec4(col * 1.05, alpha * 0.92);
      }`,
  }));
  const rings = new THREE.Mesh(new THREE.RingGeometry(inner, outer, 220, 4), ringMat);
  rings.rotation.x = -Math.PI / 2;
  g.add(rings);
  g.rotation.z = 0.28; g.rotation.x = 0.62;   // iconic tilt
  g.userData.tick = (dt) => { body.rotation.y += dt * 0.1; };
  scene.add(g); return g;
}

/* ══════════ SUN ══════════ */

function buildSun(ch){
  const g = new THREE.Group(); g.position.copy(v3(ch.obj));
  const surf = track(new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: PLANET_VERT,
    fragmentShader: PLANET_FRAG_HEAD + /* glsl */`
    void main(){
      vec3 p = normalize(vPos);
      float n = fbm(p * 4.0 + vec3(uTime * 0.06, uTime * 0.045, 0.0));
      float n2 = fbm(p * 9.0 - vec3(0.0, uTime * 0.08, uTime * 0.05));
      float m = n * 0.65 + n2 * 0.35;
      float cells = 1.0 - abs(2.0 * m - 1.0);
      vec3 col = mix(vec3(0.9, 0.22, 0.02), vec3(1.0, 0.55, 0.08), smoothstep(0.2, 0.6, m));
      col = mix(col, vec3(1.0, 0.93, 0.62), smoothstep(0.55, 0.9, cells));
      vec3 V = normalize(cameraPosition - vWorld);
      float limb = pow(max(dot(normalize(vN), V), 0.0), 0.55);
      col *= (0.35 + 0.65 * limb) * 1.3 * vec3(1.05, 0.93, 0.72);
      gl_FragColor = vec4(col, 1.0);
    }`,
  }));
  g.add(new THREE.Mesh(new THREE.SphereGeometry(ch.r, 96, 96), surf));

  const coronaTex = glowTexture([[0, 'rgba(255,200,90,0.9)'], [0.25, 'rgba(255,120,30,0.35)'], [0.6, 'rgba(200,60,10,0.1)'], [1, 'rgba(0,0,0,0)']]);
  const mkCorona = (scale, opacity) => {
    const m = new THREE.SpriteMaterial({ map: coronaTex, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
    const s = new THREE.Sprite(m); s.scale.set(scale, scale, 1); g.add(s); return m;
  };
  const c1 = mkCorona(ch.r * 4.0, 0.5);
  const c2 = mkCorona(ch.r * 6.2, 0.22);
  g.userData.tick = (dt) => { c1.rotation += dt * 0.05; c2.rotation -= dt * 0.03; };
  scene.add(g); return g;
}

/* ══════════ PULSAR ══════════ */

function buildPulsar(ch){
  const g = new THREE.Group(); g.position.copy(v3(ch.obj));

  const core = track(new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: PLANET_VERT,
    fragmentShader: PLANET_FRAG_HEAD + /* glsl */`
    void main(){
      vec3 p = normalize(vPos);
      float n = fbm(p * 8.0 + uTime * 0.4);
      vec3 col = mix(vec3(0.6, 0.75, 1.0), vec3(1.0), n) * 2.6;
      gl_FragColor = vec4(col, 1.0);
    }`,
  }));
  g.add(new THREE.Mesh(new THREE.SphereGeometry(ch.r, 48, 48), core));

  const glowTexB = glowTexture([[0, 'rgba(170,215,255,0.95)'], [0.4, 'rgba(90,140,255,0.25)'], [1, 'rgba(0,0,0,0)']]);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexB, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
  halo.scale.set(ch.r * 6, ch.r * 6, 1);
  halo.material.opacity = 0.45;
  g.add(halo);

  // lighthouse beams along the (tilted) magnetic axis
  const beamMat = track(new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: NOISE + /* glsl */`
      uniform float uTime; varying vec2 vUv;
      void main(){
        float along = vUv.y;
        float a = pow(1.0 - along, 1.9);
        a *= 0.65 + 0.35 * noise(vec3(vUv.x * 12.0, along * 7.0 - uTime * 3.0, 0.0));
        gl_FragColor = vec4(vec3(0.62, 0.8, 1.0) * a * 2.0, a * 0.85);
      }`,
  }));
  const spinner = new THREE.Group();
  const beamGeo = new THREE.CylinderGeometry(2.6, 0.22, 52, 24, 1, true);
  beamGeo.translate(0, 26, 0);
  const beamUp = new THREE.Mesh(beamGeo, beamMat);
  const beamDown = new THREE.Mesh(beamGeo, beamMat);
  beamDown.rotation.z = Math.PI;
  const axis = new THREE.Group();
  axis.add(beamUp, beamDown);
  axis.rotation.z = 0.55;                 // magnetic axis ≠ spin axis
  spinner.add(axis);
  g.add(spinner);

  g.userData.tick = (dt) => { spinner.rotation.y += dt * 7.0; };
  scene.add(g); return g;
}

/* ══════════ BLACK HOLE ══════════ */

let bhWorldPos = null;

function buildBlackHole(ch){
  const g = new THREE.Group(); g.position.copy(v3(ch.obj));
  bhWorldPos = v3(ch.obj);
  const rs = ch.r;

  // the horizon itself — a perfect absence
  g.add(new THREE.Mesh(new THREE.SphereGeometry(rs * 1.02, 64, 64), new THREE.MeshBasicMaterial({ color: 0x000000 })));

  // accretion disk — hot, doppler-boosted, swirling
  const din = rs * 1.28, dout = rs * 3.8;
  const diskMat = track(new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uInner: { value: din }, uOuter: { value: dout } },
    transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      varying vec3 vPos;
      void main(){ vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: NOISE + /* glsl */`
      uniform float uTime; uniform float uInner; uniform float uOuter;
      varying vec3 vPos;
      void main(){
        float r = length(vPos.xy);
        float ang = atan(vPos.y, vPos.x);
        float rn = clamp((r - uInner) / (uOuter - uInner), 0.0, 1.0);
        float sw = fbm(vec3(rn * 6.0 - uTime * 0.5, ang * 3.0 + rn * 16.0 - uTime * 1.1, 1.7));
        float bands = 0.5 + 0.5 * sw;
        vec3 col = mix(vec3(1.0, 0.97, 0.92), vec3(1.0, 0.58, 0.15), smoothstep(0.0, 0.45, rn));
        col = mix(col, vec3(0.5, 0.09, 0.02), smoothstep(0.45, 1.0, rn));
        float doppler = 1.0 + 0.8 * sin(ang);              // relativistic beaming (approaching side brighter)
        float alpha = bands * (1.0 - smoothstep(0.72, 1.0, rn)) * smoothstep(0.0, 0.05, rn);
        col *= (0.9 + 1.5 * pow(1.0 - rn, 2.0)) * doppler;
        gl_FragColor = vec4(col * alpha, alpha);
      }`,
  }));
  const disk = new THREE.Mesh(new THREE.RingGeometry(din, dout, 256, 8), diskMat);
  disk.rotation.x = -Math.PI / 2 + 0.2;
  g.add(disk);

  // billboard group: photon ring + lensed arc + ambient glow, always facing the camera
  const bb = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(rs * 1.08, 0.14, 12, 160),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(1.7, 1.35, 0.85), transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  bb.add(ring);
  const arc = new THREE.Mesh(
    new THREE.TorusGeometry(rs * 1.45, 1.5, 12, 100, Math.PI),
    new THREE.MeshBasicMaterial({ color: 0xff9d45, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  bb.add(arc);
  // donut gradient — keeps the event horizon itself perfectly black
  const bhGlowTex = glowTexture([[0, 'rgba(0,0,0,0)'], [0.2, 'rgba(0,0,0,0)'], [0.3, 'rgba(255,150,60,0.5)'], [0.55, 'rgba(255,90,20,0.16)'], [1, 'rgba(0,0,0,0)']]);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: bhGlowTex, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.scale.set(rs * 9, rs * 9, 1);
  bb.add(glow);
  g.add(bb);

  g.userData.tick = () => { bb.lookAt(camera.position); };
  scene.add(g); return g;
}

/* ══════════ BUILD ALL CHAPTER OBJECTS ══════════ */

const builders = { 1: buildEarth, 2: buildMars, 3: buildJupiter, 4: buildSaturn, 5: buildSun, 6: buildPulsar, 7: buildBlackHole };
const chapterGroups = {};
for (const [idx, fn] of Object.entries(builders)) chapterGroups[idx] = fn(CH[idx]);

/* ══════════ POST-PROCESSING — bloom + gravitational lens ══════════ */

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const LensShader = {
  uniforms: {
    tDiffuse: { value: null },
    uCenter: { value: new THREE.Vector2(0.5, 0.5) },
    uStrength: { value: 0 },
    uAspect: { value: window.innerWidth / window.innerHeight },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform vec2 uCenter; uniform float uStrength; uniform float uAspect;
    varying vec2 vUv;
    void main(){
      vec2 d = vUv - uCenter; d.x *= uAspect;
      float r = length(d) + 1e-4;
      float defl = uStrength * 0.0045 / (r * r + 0.02);
      defl = min(defl, r * 0.85);
      vec2 dir = d / r; dir.x /= uAspect;
      vec2 suv = vUv - dir * defl;
      float ca = defl * 0.1;
      vec3 col;
      col.r = texture2D(tDiffuse, suv - dir * ca * 0.5).r;
      col.g = texture2D(tDiffuse, suv).g;
      col.b = texture2D(tDiffuse, suv + dir * ca * 0.5).b;
      gl_FragColor = vec4(col, 1.0);
    }`,
};
const lensPass = new ShaderPass(LensShader);
composer.addPass(lensPass);

const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.7, 0.4, 0.9);
composer.addPass(bloom);
composer.addPass(new OutputPass());

/* ══════════ VIRTUAL INFINITE SCROLL ══════════ */

let target = 0;      // where the user wants to be (unbounded)
let prog = 0;        // damped actual progress (unbounded)
let hasScrolled = false;

window.addEventListener('wheel', (e) => {
  const dy = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
  target += dy * 0.00016;
  hasScrolled = true;
}, { passive: true });

let touchY = null;
window.addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; }, { passive: true });
window.addEventListener('touchmove', (e) => {
  if (touchY === null) return;
  target += (touchY - e.touches[0].clientY) * 0.00062;
  touchY = e.touches[0].clientY;
  hasScrolled = true;
  e.preventDefault();
}, { passive: false });
window.addEventListener('touchend', () => { touchY = null; });

window.addEventListener('keydown', (e) => {
  const step = 1 / N;
  if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') { target += step * 0.9; hasScrolled = true; }
  if (e.key === 'ArrowUp' || e.key === 'PageUp') { target -= step * 0.9; hasScrolled = true; }
});

/* ══════════ DOM / HUD ══════════ */

const panels = [...document.querySelectorAll('.chapter')];
const hudChNum = document.getElementById('hud-ch-num');
const hudChName = document.getElementById('hud-ch-name');
const hudPct = document.getElementById('hud-pct');
const hudCoord = document.getElementById('hud-coord');
const hudVel = document.getElementById('hud-vel');
const progressFill = document.getElementById('progress-fill');
const blackout = document.getElementById('blackout');
const scrollHint = document.getElementById('scroll-hint');
const root = document.documentElement;

// chapter nav dots
const nav = document.getElementById('ch-nav');
const dots = CH.map((c, i) => {
  const b = document.createElement('button');
  b.setAttribute('aria-label', `Chapter ${i} — ${c.key}`);
  b.addEventListener('click', () => {
    const t = ((prog % 1) + 1) % 1;
    const cf = t * N;
    let d = (i - cf) % N;
    if (d > N / 2) d -= N;
    if (d < -N / 2) d += N;
    target = prog + d / N;
    hasScrolled = true;
  });
  nav.appendChild(b);
  return b;
});

// custom cursor
const curDot = document.getElementById('cursor-dot');
const curRing = document.getElementById('cursor-ring');
let mx = 0, my = 0, rx = 0, ry = 0, pmx = 0, pmy = 0;
window.addEventListener('mousemove', (e) => {
  mx = e.clientX; my = e.clientY;
  pmx = (e.clientX / window.innerWidth - 0.5) * 2;
  pmy = (e.clientY / window.innerHeight - 0.5) * 2;
  curDot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
});
document.addEventListener('mouseover', (e) => {
  curRing.classList.toggle('hover', !!e.target.closest('button, a'));
});

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const pad = (n, w) => String(Math.abs(Math.round(n))).padStart(w, '0');
const coordFmt = (n) => (n < 0 ? '-' : '+') + pad(n, 3);

/* ══════════ PRELOADER ══════════ */

const pre = document.getElementById('preloader');
const prePct = document.getElementById('pre-pct');
const preFill = document.getElementById('pre-fill');
const preStart = performance.now();
(function preTick(){
  const p = Math.min(1, (performance.now() - preStart) / 1700);
  const eased = 1 - Math.pow(1 - p, 3);
  prePct.textContent = pad(eased * 100, 3);
  preFill.style.width = `${eased * 100}%`;
  if (p < 1) setTimeout(preTick, 16);
  else pre.classList.add('done');
})();

/* ══════════ MAIN LOOP ══════════ */

const camPos = new THREE.Vector3();
const lookPos = new THREE.Vector3();
const projected = new THREE.Vector3();
let lastT = performance.now();
let smoothVel = 0;

let rafId = 0;
function arm(){ cancelAnimationFrame(rafId); rafId = requestAnimationFrame(frame); }

function frame(){
  const now = performance.now();
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  const time = now / 1000;

  // damped progress
  const prev = prog;
  prog += (target - prog) * (1 - Math.exp(-3.4 * dt));
  const t = ((prog % 1) + 1) % 1;
  const cf = t * N;

  // camera on the closed spline
  camCurve.getPoint(t, camPos);
  lookCurve.getPoint(t, lookPos);
  // mouse parallax on the look target
  lookPos.x += pmx * 2.2;
  lookPos.y -= pmy * 1.6;
  camera.position.copy(camPos);
  // subtle banking into turns
  const tan1 = camCurve.getTangent(t);
  const tan2 = camCurve.getTangent((t + 0.004) % 1);
  const roll = Math.max(-0.3, Math.min(0.3, (tan2.x - tan1.x) * -10));
  camera.up.set(Math.sin(roll), Math.cos(roll), 0);
  camera.lookAt(lookPos);

  // tick shader clocks
  for (const m of timeMats) m.uniforms.uTime.value = time;

  // per-chapter objects: cull far ones, tick near ones
  for (const [idx, grp] of Object.entries(chapterGroups)){
    let d = Math.abs(cf - Number(idx));
    d = Math.min(d, N - d);
    grp.visible = d < 2.8;
    if (grp.visible && grp.userData.tick) grp.userData.tick(dt);
  }

  // horizon blackout (hides the hidden return leg of the loop)
  const dark = smoothstep(8.2, 8.78, cf) * (1 - smoothstep(10.35, 10.9, cf));
  blackout.style.opacity = dark;

  // gravitational lens strength — ramps up around the black hole
  let lens = smoothstep(6.4, 7.1, cf) * (1 - smoothstep(8.6, 9.1, cf));
  if (bhWorldPos && lens > 0.001){
    projected.copy(bhWorldPos).project(camera);
    if (projected.z < 1){
      lensPass.uniforms.uCenter.value.set(projected.x * 0.5 + 0.5, projected.y * 0.5 + 0.5);
    } else lens = 0;
  }
  lensPass.uniforms.uStrength.value = lens * (1 - dark) * 0.55;

  // panels
  for (const p of panels){
    const i = Number(p.dataset.ch);
    let d = Math.abs(cf - i);
    d = Math.min(d, N - d);
    const vis = Math.max(0, 1 - (d / 0.46) ** 2);
    p.style.opacity = vis;
    const dirSign = ((cf - i + N / 2 + N) % N) - N / 2 > 0 ? -1 : 1;
    const shift = (1 - vis) * 46 * dirSign;
    p.style.transform = p.classList.contains('hero')
      ? `translate(-50%, calc(-50% + ${shift}px))`
      : `translateY(calc(-50% + ${shift}px))`;
  }

  // HUD
  let nearest = Math.round(cf) % N;
  if (nearest > 8) nearest = 8;
  hudChNum.textContent = pad(nearest, 2);
  hudChName.textContent = CH[nearest].key;
  root.style.setProperty('--accent', CH[nearest].accent);
  dots.forEach((b, i) => b.classList.toggle('active', i === nearest));
  hudPct.textContent = pad(t * 100, 3) + '%';
  progressFill.style.width = `${t * 100}%`;
  hudCoord.textContent = `X${coordFmt(camPos.x)} Y${coordFmt(camPos.y)} Z${coordFmt(camPos.z)}`;
  const vel = Math.abs(prog - prev) / Math.max(dt, 1e-4) * 260;
  smoothVel += (vel - smoothVel) * 0.08;
  hudVel.textContent = `V ${smoothVel.toFixed(1).padStart(4, '0')} KM/S`;
  if (hasScrolled) scrollHint.classList.add('hidden');

  // cursor ring lag
  rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
  curRing.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;

  composer.render();
  if (!document.hidden) arm();
}
frame();

/* keep rendering (slowly) when the tab is hidden so the page is
   never frozen when it comes back into view */
document.addEventListener('visibilitychange', () => { if (!document.hidden) arm(); });
setInterval(() => { if (document.hidden) frame(); }, 250);

/* ══════════ RESIZE ══════════ */

/* dev handle — lets tooling jump the camera to a chapter instantly
   and capture the canvas even when the tab is hidden/frozen        */
window.__cosmos = {
  jump(i){ target = i / N; prog = i / N; },
  state(){ return { target, prog }; },
  frame,
  shot(q = 0.55, w = 640){
    frame();
    const c2 = document.createElement('canvas');
    c2.width = w;
    c2.height = Math.max(1, Math.round(canvas.height * w / canvas.width));
    c2.getContext('2d').drawImage(canvas, 0, 0, c2.width, c2.height);
    return c2.toDataURL('image/jpeg', q);
  },
};

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  lensPass.uniforms.uAspect.value = window.innerWidth / window.innerHeight;
});
