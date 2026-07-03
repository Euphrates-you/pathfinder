/* ============ PATHFINDER — fx.js ============
   Visual layer: preloader, wireframe ice crystal, particle field,
   custom cursor, staggered reveals. No dependencies. */

(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // shared mouse state (normalized -1..1 from screen center)
  const mouse = { x: 0, y: 0, px: 0, py: 0 };
  window.addEventListener("mousemove", (e) => {
    mouse.px = e.clientX;
    mouse.py = e.clientY;
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  });

  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  // ============================================================
  // BACKGROUND PARTICLE FIELD (ice dust)
  // ============================================================
  const bg = document.getElementById("bg-canvas");
  const bctx = bg.getContext("2d");
  let parts = [];

  function sizeBg() {
    bg.width = window.innerWidth * DPR;
    bg.height = window.innerHeight * DPR;
    const n = reduced ? 0 : Math.min(130, Math.round((window.innerWidth * window.innerHeight) / 14000));
    parts = Array.from({ length: n }, () => ({
      x: Math.random() * bg.width,
      y: Math.random() * bg.height,
      z: 0.25 + Math.random() * 0.75,            // depth → size, speed, parallax
      vy: (0.05 + Math.random() * 0.14) * DPR,   // slow upward drift
      tw: Math.random() * Math.PI * 2,           // twinkle phase
      ts: 0.4 + Math.random() * 1.2,             // twinkle speed
    }));
  }
  sizeBg();
  window.addEventListener("resize", sizeBg);

  let smx = 0, smy = 0; // smoothed parallax
  function drawBg(t) {
    bctx.clearRect(0, 0, bg.width, bg.height);
    smx += (mouse.x - smx) * 0.03;
    smy += (mouse.y - smy) * 0.03;
    for (const p of parts) {
      p.y -= p.vy * p.z;
      if (p.y < -8) { p.y = bg.height + 8; p.x = Math.random() * bg.width; }
      const a = (0.10 + 0.16 * p.z) * (0.55 + 0.45 * Math.sin(t * 0.001 * p.ts + p.tw));
      const px = p.x - smx * 26 * p.z * DPR;
      const py = p.y - smy * 26 * p.z * DPR;
      const r = (0.5 + p.z * 1.1) * DPR;
      bctx.beginPath();
      bctx.arc(px, py, r, 0, Math.PI * 2);
      bctx.fillStyle = `rgba(179, 224, 255, ${a.toFixed(3)})`;
      bctx.fill();
    }
    requestAnimationFrame(drawBg);
  }
  if (!reduced) requestAnimationFrame(drawBg);

  // ============================================================
  // INTRO CRYSTAL — wireframe icosahedron, projected in 2D canvas
  // ============================================================
  const cr = document.getElementById("crystal-canvas");
  const cctx = cr.getContext("2d");
  let crystalOn = true;

  function sizeCrystal() {
    const rect = cr.getBoundingClientRect();
    cr.width = rect.width * DPR;
    cr.height = rect.height * DPR;
  }
  sizeCrystal();
  window.addEventListener("resize", sizeCrystal);

  // icosahedron vertices (normalized) + edges by minimal distance
  const PHI = (1 + Math.sqrt(5)) / 2;
  const RAW = [
    [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
    [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
    [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1],
  ];
  const VERTS = RAW.map(([x, y, z]) => {
    const m = Math.hypot(x, y, z);
    return [x / m, y / m, z / m];
  });
  const EDGES = [];
  {
    let minD = Infinity;
    const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) minD = Math.min(minD, d(VERTS[i], VERTS[j]));
    for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++)
      if (d(VERTS[i], VERTS[j]) < minD * 1.05) EDGES.push([i, j]);
  }

  function rotate([x, y, z], rx, ry) {
    let cy = Math.cos(rx), sy = Math.sin(rx);
    let y1 = y * cy - z * sy, z1 = y * sy + z * cy;
    let cx = Math.cos(ry), sx = Math.sin(ry);
    let x1 = x * cx + z1 * sx, z2 = -x * sx + z1 * cx;
    return [x1, y1, z2];
  }

  let rx = 0.35, ry = 0, tiltX = 0, tiltY = 0;

  function drawShape(cx, cy, scale, rxx, ryy, alphaMul) {
    const proj = VERTS.map((v) => {
      const [x, y, z] = rotate(v, rxx, ryy);
      const persp = 3 / (3 + z);
      return [cx + x * persp * scale, cy + y * persp * scale, z];
    });
    for (const [i, j] of EDGES) {
      const depth = 1 - (proj[i][2] + proj[j][2]) / 2; // 0(back)..2(front)
      const a = (0.07 + depth * 0.20) * alphaMul;
      cctx.beginPath();
      cctx.moveTo(proj[i][0], proj[i][1]);
      cctx.lineTo(proj[j][0], proj[j][1]);
      cctx.strokeStyle = `rgba(159, 216, 255, ${a.toFixed(3)})`;
      cctx.lineWidth = 1 * DPR;
      cctx.stroke();
    }
    for (const [px, py, z] of proj) {
      const depth = 1 - z;
      cctx.beginPath();
      cctx.arc(px, py, (0.8 + depth * 1.1) * DPR, 0, Math.PI * 2);
      cctx.fillStyle = `rgba(217, 241, 255, ${(0.25 + depth * 0.4) * alphaMul})`;
      cctx.fill();
    }
  }

  function drawCrystal(t) {
    if (!crystalOn) return;
    cctx.clearRect(0, 0, cr.width, cr.height);
    const cx = cr.width / 2, cy = cr.height / 2;
    const scale = Math.min(cr.width, cr.height) * 0.30;

    tiltX += (mouse.y * 0.25 - tiltX) * 0.04;
    tiltY += (mouse.x * 0.35 - tiltY) * 0.04;
    rx += 0.0016;
    ry += 0.0023;

    // halo
    const g = cctx.createRadialGradient(cx, cy, scale * 0.1, cx, cy, scale * 1.6);
    g.addColorStop(0, "rgba(108, 196, 255, 0.10)");
    g.addColorStop(1, "rgba(108, 196, 255, 0)");
    cctx.fillStyle = g;
    cctx.fillRect(0, 0, cr.width, cr.height);

    // orbit ring + satellites
    cctx.save();
    cctx.translate(cx, cy);
    cctx.rotate(-0.28);
    cctx.beginPath();
    cctx.ellipse(0, 0, scale * 1.45, scale * 0.42, 0, 0, Math.PI * 2);
    cctx.strokeStyle = "rgba(159, 216, 255, 0.10)";
    cctx.lineWidth = 1 * DPR;
    cctx.stroke();
    for (let k = 0; k < 3; k++) {
      const ang = t * 0.00022 + (k * Math.PI * 2) / 3;
      const ox = Math.cos(ang) * scale * 1.45;
      const oy = Math.sin(ang) * scale * 0.42;
      cctx.beginPath();
      cctx.arc(ox, oy, 1.6 * DPR, 0, Math.PI * 2);
      cctx.fillStyle = "rgba(217, 241, 255, 0.75)";
      cctx.fill();
    }
    cctx.restore();

    drawShape(cx, cy, scale, rx + tiltX, ry + tiltY, 1);          // outer
    drawShape(cx, cy, scale * 0.52, -rx * 1.4 + tiltX, -ry * 1.4 + tiltY, 0.65); // inner, counter-rotating

    requestAnimationFrame(drawCrystal);
  }
  if (!reduced) requestAnimationFrame(drawCrystal);
  else { // static single frame for reduced motion
    drawCrystal(0);
    crystalOn = false;
  }

  // ============================================================
  // PRELOADER → intro reveal
  // ============================================================
  const intro = document.getElementById("intro");
  const pctEl = document.getElementById("loader-pct");
  const fillEl = document.getElementById("loader-fill");
  const DUR = reduced ? 1 : 1500;
  const t0 = performance.now();

  function tickLoader(now) {
    const raw = Math.min(1, (now - t0) / DUR);
    const eased = 1 - Math.pow(1 - raw, 3);
    const pct = Math.round(eased * 100);
    pctEl.textContent = String(pct).padStart(3, "0");
    fillEl.style.width = pct + "%";
    if (raw < 1) requestAnimationFrame(tickLoader);
    else intro.classList.add("ready");
  }
  requestAnimationFrame(tickLoader);

  // ============================================================
  // ENTER → app shell
  // ============================================================
  const shell = document.getElementById("shell");
  let entered = false;

  function enterApp() {
    if (entered || !intro.classList.contains("ready")) return;
    entered = true;
    intro.classList.add("hide");
    shell.classList.add("on");
    document.body.classList.remove("lock");
    setTimeout(() => {
      intro.style.display = "none";
      crystalOn = false; // stop the intro render loop
    }, 950);
    const active = document.querySelector(".view.active");
    if (active) fxReveal(active);
  }
  document.getElementById("enter-btn").addEventListener("click", enterApp);
  window.addEventListener("keydown", (e) => { if (e.key === "Enter") enterApp(); });

  // ============================================================
  // STAGGERED REVEALS (called by app.js on every view switch)
  // ============================================================
  window.fxReveal = function (root) {
    const els = root.querySelectorAll(".reveal");
    els.forEach((el, i) => {
      el.classList.remove("in");
      el.style.transitionDelay = Math.min(i * 70, 560) + "ms";
    });
    requestAnimationFrame(() =>
      requestAnimationFrame(() => els.forEach((el) => el.classList.add("in"))));
  };

  // ============================================================
  // CURSOR GLOW RING — trails the native cursor (which stays visible)
  // ============================================================
  if (fine && !reduced) {
    const ring = document.querySelector(".cursor-ring");
    let rxp = -100, ryp = -100;
    mouse.px = -100; mouse.py = -100;

    (function moveCursor() {
      rxp += (mouse.px - rxp) * 0.16;
      ryp += (mouse.py - ryp) * 0.16;
      ring.style.left = rxp + "px";
      ring.style.top = ryp + "px";
      requestAnimationFrame(moveCursor);
    })();

    const HOT = "a, button, label, select, input, textarea, summary, .club-chip, .nav-item, .subtab";
    document.addEventListener("mouseover", (e) => {
      ring.classList.toggle("big", !!e.target.closest(HOT));
    });
  }
})();
