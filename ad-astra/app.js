/* ============================================================
   AD—ASTRA — chapter deck (igloo.inc-style)
   The page does not scroll. Fullscreen scenes; the wheel flies
   the camera between chapters. Stars warp on every jump.
   Touch & reduced-motion fall back to classic document scroll.
   ============================================================ */
"use strict";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer: fine)").matches;
const deckMode = finePointer && !reducedMotion && window.innerWidth > 900;

if ("scrollRestoration" in history) history.scrollRestoration = "manual";
if (!location.hash) window.scrollTo(0, 0);

/* ------------------------------------------------------------
   Preloader
   ------------------------------------------------------------ */
(() => {
  const pre = document.getElementById("preloader");
  const count = document.getElementById("preCount");
  const bar = document.getElementById("preBar");
  document.body.classList.add("preloading");

  function finish() {
    if (!pre.classList.contains("done")) {
      pre.classList.add("done");
      document.body.classList.remove("preloading");
      document.dispatchEvent(new Event("preloaded"));
    }
  }
  if (reducedMotion) {
    count.textContent = "100";
    bar.style.width = "100%";
    setTimeout(finish, 250);
    return;
  }
  const t0 = performance.now();
  const DUR = 1500;
  (function tick(t) {
    const p = Math.min((t - t0) / DUR, 1);
    const eased = 1 - Math.pow(1 - p, 2.4);
    const v = Math.floor(eased * 100);
    count.textContent = String(v).padStart(3, "0");
    bar.style.width = v + "%";
    if (p < 1) requestAnimationFrame(tick);
    else setTimeout(finish, 220);
  })(t0);
  setTimeout(finish, 4000); // failsafe
})();

/* ------------------------------------------------------------
   Line-mask heading reveals
   ------------------------------------------------------------ */
(() => {
  if (reducedMotion) return;
  document.querySelectorAll("h1, .sec-head h2, .bridge-line, .footer-big").forEach((el) => {
    const parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = parts
      .map((p) => `<span class="line"><span class="line-in">${p}</span></span>`)
      .join("");
    el.classList.add("masked");
  });
})();

/* ------------------------------------------------------------
   Particle scene — morphing object + star warp on travel
   ------------------------------------------------------------ */
const Scene = (() => {
  const canvas = document.getElementById("scene");
  const ctx = canvas.getContext("2d");
  const N = 1500;
  const cur = new Float32Array(N * 3);
  const tgt = new Float32Array(N * 3);
  let stars = [];
  let w = 0, h = 0, dpr = 1;
  let mx = 0, my = 0;
  let tint = [159, 212, 255];
  let tintTgt = [159, 212, 255];
  let time = 0;
  let sTarget = 0, sSmooth = 0, warpImpulse = 0;
  let ax = 0, axTgt = 0, as = 1.12, asTgt = 1.12;

  const rnd = Math.random;
  const TAU = Math.PI * 2;

  function set(arr, i, x, y, z) { arr[i * 3] = x; arr[i * 3 + 1] = y; arr[i * 3 + 2] = z; }

  const shapes = {
    sphere(out) {
      const ga = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < N; i++) {
        const y = 1 - (i / (N - 1)) * 2;
        const r = Math.sqrt(1 - y * y);
        const th = ga * i;
        set(out, i, Math.cos(th) * r * 0.85, y * 0.85, Math.sin(th) * r * 0.85);
      }
    },
    scatter(out) {
      for (let i = 0; i < N; i++) {
        const r = 0.7 + rnd() * 1.1;
        const th = rnd() * TAU, ph = Math.acos(2 * rnd() - 1);
        set(out, i, r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th));
      }
    },
    atom(out) {
      for (let i = 0; i < N; i++) {
        if (i < N * 0.14) {
          set(out, i, (rnd() - 0.5) * 0.22, (rnd() - 0.5) * 0.22, (rnd() - 0.5) * 0.22);
        } else {
          const ring = i % 3;
          const a = rnd() * TAU;
          let x = Math.cos(a) * 0.95, y = Math.sin(a) * 0.95, z = (rnd() - 0.5) * 0.05;
          if (ring === 1) { const t = y; y = t * 0.5 - z * 0.87; z = t * 0.87 + z * 0.5; const t2 = x; x = t2 * 0.5 - y * 0.5; }
          if (ring === 2) { const t = x; x = z; z = -t; const t2 = y; y = t2 * 0.5 + z * 0.6; }
          set(out, i, x, y, z);
        }
      }
    },
    sun(out) {
      for (let i = 0; i < N; i++) {
        if (i < N * 0.82) {
          const r = 0.55 * Math.cbrt(rnd());
          const th = rnd() * TAU, ph = Math.acos(2 * rnd() - 1);
          set(out, i, r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th));
        } else {
          const r = 0.6 + rnd() * 0.65;
          const th = rnd() * TAU, ph = Math.acos(2 * rnd() - 1);
          set(out, i, r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th));
        }
      }
    },
    torus(out) {
      const tilt = 1.13;
      const ct = Math.cos(tilt), st = Math.sin(tilt);
      for (let i = 0; i < N; i++) {
        if (i < N * 0.07) { set(out, i, (rnd() - 0.5) * 0.1, (rnd() - 0.5) * 0.1, (rnd() - 0.5) * 0.1); continue; }
        const u = rnd() * TAU, v = rnd() * TAU;
        const R = 0.9, r = 0.13;
        let x = (R + r * Math.cos(v)) * Math.cos(u);
        let y = r * Math.sin(v);
        let z = (R + r * Math.cos(v)) * Math.sin(u);
        const y2 = y * ct - z * st, z2 = y * st + z * ct;
        set(out, i, x, y2, z2);
      }
    },
    wave(out) {
      for (let i = 0; i < N; i++) {
        const x = (rnd() - 0.5) * 3;
        const z = (rnd() - 0.5) * 1.4;
        const y = 0.3 * Math.sin(4 * x) + 0.07 * Math.sin(7 * z);
        set(out, i, x, y, z);
      }
    },
    burst(out) {
      for (let i = 0; i < N; i++) {
        const r = Math.pow(rnd(), 0.32) * 1.5;
        const th = rnd() * TAU, ph = Math.acos(2 * rnd() - 1);
        set(out, i, r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th));
      }
    },
    spiral(out) {
      for (let i = 0; i < N; i++) {
        const arm = i % 2 === 0 ? 0 : Math.PI;
        const t = rnd() * 4.2 * Math.PI;
        const r = Math.min(0.1 * Math.exp(0.155 * t), 1.4);
        const jitter = (rnd() - 0.5) * 0.12 * (1 + r);
        set(out, i, Math.cos(t + arm) * r + jitter, (rnd() - 0.5) * 0.08, Math.sin(t + arm) * r + jitter);
      }
    },
    rocket(out) {
      for (let i = 0; i < N; i++) {
        const u = rnd();
        let y, r;
        if (u < 0.78) {
          const t = rnd();
          if (t < 0.3) { const k = t / 0.3; y = -1.05 + k * 0.6; r = 0.22 * k; }
          else if (t < 0.78) { const k = (t - 0.3) / 0.48; y = -0.45 + k * 0.95; r = 0.22; }
          else if (t < 0.88) { const k = (t - 0.78) / 0.1; y = 0.5 + k * 0.12; r = 0.22 + k * 0.05; }
          else { const k = (t - 0.88) / 0.12; y = 0.62 + k * 0.23; r = 0.27 - k * 0.13 + k * k * 0.16; }
          const a = rnd() * TAU;
          set(out, i, Math.cos(a) * r, y, Math.sin(a) * r);
        } else {
          const k = rnd();
          y = 0.9 + k * 0.65;
          r = 0.05 + k * 0.3 * rnd();
          const a = rnd() * TAU;
          set(out, i, Math.cos(a) * r, y, Math.sin(a) * r);
        }
      }
    },
    curve(out) {
      for (let i = 0; i < N; i++) {
        const x = rnd() * 2.6 - 1.3;
        const y = -(Math.log(1 + (x + 1.3) * 2.4) / Math.log(7.3)) * 1.5 + 0.75;
        set(out, i, x, y + (rnd() - 0.5) * 0.06, (rnd() - 0.5) * 0.2);
      }
    },
    clusters(out) {
      const cx = [0, -0.85, 0.85], cy = [-0.7, 0.55, 0.55];
      for (let i = 0; i < N; i++) {
        const c = i % 3;
        const g = () => (rnd() + rnd() + rnd() - 1.5) * 0.36;
        set(out, i, cx[c] + g(), cy[c] + g(), g());
      }
    },
    orbits(out) {
      const tilt = 1.05, ct = Math.cos(tilt), st = Math.sin(tilt);
      for (let i = 0; i < N; i++) {
        if (i < N * 0.1) { set(out, i, (rnd() - 0.5) * 0.14, (rnd() - 0.5) * 0.14, (rnd() - 0.5) * 0.14); continue; }
        const ring = i % 3;
        const a = [0.5, 0.85, 1.2][ring];
        const th = rnd() * TAU;
        let x = Math.cos(th) * a;
        let z = Math.sin(th) * a * 0.62;
        let y = (rnd() - 0.5) * 0.03;
        const y2 = y * ct - z * st, z2 = y * st + z * ct;
        set(out, i, x, y2, z2);
      }
    },
  };

  const TINTS = {
    ice: [200, 215, 255],
    violet: [178, 145, 255],
    magenta: [242, 130, 205],
    cyan: [115, 225, 245],
    gold: [255, 205, 125],
    warm: [255, 175, 115],
  };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = Array.from({ length: 130 }, () => {
      // stellar temperatures: most white-ish, some gold, blue, and rose
      const t = rnd();
      const hue = t < 0.58 ? "208,215,255" : t < 0.76 ? "255,216,160" : t < 0.9 ? "160,190,255" : "255,170,195";
      return { x: rnd() * w, y: rnd() * h, r: rnd() * 1.1 + 0.3, a: rnd() * 0.5 + 0.15, tw: rnd() * TAU, hue };
    });
  }

  function setShape(name, tintName) {
    (shapes[name] || shapes.sphere)(tgt);
    tintTgt = TINTS[tintName] || TINTS.ice;
    if (reducedMotion) { cur.set(tgt); tint = tintTgt.slice(); draw(0); }
  }
  function setFraming(x, scale) {
    axTgt = x; asTgt = scale;
    if (reducedMotion) { ax = x; as = scale; }
  }
  // camera jump between chapters: stars stream + warp punch
  function travel(dir) {
    sTarget += dir * h * 1.35;
    warpImpulse += dir * 220;
  }
  shapes.sphere(tgt); cur.set(tgt);

  function draw(vel) {
    ctx.clearRect(0, 0, w, h);

    const warp = Math.min(Math.abs(vel) * 0.28, 120);
    for (const s of stars) {
      const depth = s.a * 1.6;
      const sy = ((s.y - sSmooth * 0.07 * depth) % h + h) % h;
      const alpha = reducedMotion ? s.a : s.a * (0.6 + 0.4 * Math.sin(s.tw + time * 1.4));
      const len = warp * depth;
      if (len > 3) {
        ctx.fillStyle = `rgba(${s.hue},${(alpha * 0.6).toFixed(3)})`;
        ctx.fillRect(s.x, vel > 0 ? sy : sy - len, s.r * 0.8, len + s.r);
      } else {
        ctx.fillStyle = `rgba(${s.hue},${alpha.toFixed(3)})`;
        ctx.fillRect(s.x, sy, s.r, s.r);
      }
    }

    ax += (axTgt - ax) * 0.045;
    as += (asTgt - as) * 0.045;
    const narrow = w < 900;
    const R = Math.min(w, h) * 0.36 * (narrow ? 1 : as);
    const cx = w / 2 + (narrow ? 0 : ax * w * 0.26);
    const cy = h * 0.52;
    const ry = time * 0.14 + mx * 0.45 + vel * 0.0012;
    const rx = -0.16 + my * 0.28;
    const cyr = Math.cos(ry), syr = Math.sin(ry);
    const cxr = Math.cos(rx), sxr = Math.sin(rx);

    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < N; i++) {
      const ix = i * 3;
      cur[ix] += (tgt[ix] - cur[ix]) * 0.055;
      cur[ix + 1] += (tgt[ix + 1] - cur[ix + 1]) * 0.055;
      cur[ix + 2] += (tgt[ix + 2] - cur[ix + 2]) * 0.055;
      let x = cur[ix] * cyr + cur[ix + 2] * syr;
      let z = -cur[ix] * syr + cur[ix + 2] * cyr;
      let y = cur[ix + 1] * cxr - z * sxr;
      z = cur[ix + 1] * sxr + z * cxr;
      const persp = 2.9 / (2.9 + z);
      const sx = cx + x * R * persp;
      const sy = cy + y * R * persp;
      const depth = Math.min(Math.max((persp - 0.72) * 2.4, 0), 1);
      const size = 0.5 + depth * 1.5;
      const alpha = 0.1 + depth * 0.5;
      ctx.fillStyle = `rgba(${tint[0]},${tint[1]},${tint[2]},${alpha.toFixed(3)})`;
      ctx.fillRect(sx, sy, size, size);
    }
    ctx.globalCompositeOperation = "source-over";

    for (let c = 0; c < 3; c++) tint[c] += (tintTgt[c] - tint[c]) * 0.04;
  }

  function loop() {
    time += 0.016;
    if (!deckMode) sTarget = window.scrollY;
    warpImpulse *= 0.9;
    const vel = (sTarget - sSmooth) * 0.5 + warpImpulse;
    sSmooth += (sTarget - sSmooth) * 0.09;
    draw(vel);
    requestAnimationFrame(loop);
  }

  window.addEventListener("resize", resize);
  if (finePointer) {
    window.addEventListener("mousemove", (e) => {
      mx = (e.clientX / w - 0.5) * 2;
      my = (e.clientY / h - 0.5) * 2;
    }, { passive: true });
  }
  resize();
  if (reducedMotion) draw(0);
  else requestAnimationFrame(loop);

  return { setShape, setFraming, travel };
})();

/* ------------------------------------------------------------
   Shared chapter data
   ------------------------------------------------------------ */
const FRAMING = {
  hero: [0, 1.12], scale: [0.65, 0.8], concepts: [-0.65, 0.8], stars: [0.65, 0.85],
  blackholes: [0.7, 0.7], light: [-0.65, 0.75], bigbang: [0.65, 0.85], bridge: [0, 1.1],
  rockets: [0.65, 0.8], anatomy: [-0.7, 0.7], equation: [0.7, 0.7], engines: [-0.65, 0.75],
  orbit: [0.7, 0.7], footer: [0, 1.1],
};
const frameKey = (sec) => sec.id || (sec.classList.contains("bridge") ? "bridge" : sec.classList.contains("footer") ? "footer" : "hero");

/* ------------------------------------------------------------
   Deck — fullscreen chapter navigation (desktop)
   ------------------------------------------------------------ */
const Deck = (() => {
  if (!deckMode) return { active: false };

  document.body.classList.add("deck");
  const els = [...document.querySelectorAll("[data-chapter]")];
  const hudChapter = document.getElementById("hudChapter");
  const hudScroll = document.getElementById("hudScroll");
  const fill = document.getElementById("progressFill");
  const rail = document.getElementById("chapterRail");
  const navLinks = [...document.querySelectorAll(".hud-links a")];
  const n = els.length;

  // wrap each chapter's content in an internal scroll container
  const scenes = els.map((el) => {
    const inner = document.createElement("div");
    inner.className = "scene-inner";
    while (el.firstChild) inner.appendChild(el.firstChild);
    el.appendChild(inner);
    const more = document.createElement("span");
    more.className = "scene-more mono";
    more.textContent = "SCROLL FOR MORE ↓";
    el.appendChild(more);
    el.classList.add("scene");
    return { el, inner, target: 0 };
  });

  const dots = scenes.map((s, i) => {
    const b = document.createElement("button");
    b.className = "rail-dot";
    b.setAttribute("aria-label", s.el.dataset.chapter);
    b.addEventListener("click", () => go(i));
    rail.appendChild(b);
    return b;
  });

  let cur = -1;
  let transitioning = false;
  let acc = 0, lastWheel = 0;

  const maxScroll = (s) => Math.max(0, s.inner.scrollHeight - s.inner.clientHeight);

  function revealScene(scene) {
    const items = scene.el.querySelectorAll(".reveal:not(.visible), .donut-panel:not(.visible)");
    items.forEach((el, i) => {
      setTimeout(() => el.classList.add("visible"), 140 + Math.min(i * 70, 640));
    });
  }

  function go(i, instant = false) {
    i = Math.max(0, Math.min(n - 1, i));
    if (i === cur || transitioning) return;
    const dir = i > cur ? 1 : -1;
    const prev = cur;
    cur = i;
    const scene = scenes[i];

    if (!instant) { transitioning = true; Scene.travel(dir); }
    scenes.forEach((s, idx) => {
      s.el.classList.toggle("above", idx < i);
      s.el.classList.toggle("active", idx === i);
    });

    // entering from below shows the end of a long chapter
    scene.target = prev >= 0 && dir < 0 ? maxScroll(scene) : 0;
    scene.inner.scrollTop = scene.target;

    hudChapter.textContent = scene.el.dataset.chapter;
    hudScroll.textContent = `CH ${String(i + 1).padStart(2, "0")} / ${n}`;
    fill.style.width = (i / (n - 1)) * 100 + "%";
    const [fx, fs] = FRAMING[frameKey(scene.el)] || [0, 1];
    Scene.setShape(scene.el.dataset.shape, scene.el.dataset.tint);
    Scene.setFraming(fx, fs);
    dots.forEach((d, idx) => d.classList.toggle("active", idx === i));
    navLinks.forEach((a) => a.classList.toggle("active", scene.el.id && a.getAttribute("href") === "#" + scene.el.id));
    if (scene.el.id) history.replaceState(null, "", "#" + scene.el.id);

    revealScene(scene);
    document.dispatchEvent(new CustomEvent("scenechange", { detail: { el: scene.el, index: i } }));
    if (!instant) setTimeout(() => { transitioning = false; }, 880);
  }

  // wheel: feed the chapter's internal scroll first, then jump chapters
  window.addEventListener("wheel", (e) => {
    e.preventDefault();
    if (transitioning || cur < 0) return;
    const d = e.deltaY * (e.deltaMode === 1 ? 16 : 1);
    const s = scenes[cur];
    const max = maxScroll(s);
    const canConsume = (d > 0 && s.target < max - 1) || (d < 0 && s.target > 1);
    if (canConsume) {
      s.target = Math.max(0, Math.min(max, s.target + d));
      acc = 0;
      return;
    }
    const now = performance.now();
    if (now - lastWheel > 260) acc = 0;
    lastWheel = now;
    acc += d;
    if (Math.abs(acc) > 130) {
      const dir = Math.sign(acc);
      acc = 0;
      go(cur + dir);
    }
  }, { passive: false });

  // keyboard flight
  window.addEventListener("keydown", (e) => {
    if (e.target.closest("input, textarea, select")) return;
    const s = scenes[cur];
    if (!s) return;
    const max = maxScroll(s);
    const innerStep = (d) => {
      const can = (d > 0 && s.target < max - 1) || (d < 0 && s.target > 1);
      if (can) { s.target = Math.max(0, Math.min(max, s.target + d)); return true; }
      return false;
    };
    switch (e.key) {
      case "ArrowDown": case "PageDown":
        e.preventDefault(); if (!innerStep(e.key === "PageDown" ? 400 : 140)) go(cur + 1); break;
      case " ":
        if (e.target.closest("button, a")) return;
        e.preventDefault(); if (!innerStep(400)) go(cur + 1); break;
      case "ArrowUp": case "PageUp":
        e.preventDefault(); if (!innerStep(e.key === "PageUp" ? -400 : -140)) go(cur - 1); break;
      case "Home": e.preventDefault(); go(0); break;
      case "End": e.preventDefault(); go(n - 1); break;
    }
  });

  // in-page anchors fly to their chapter
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    e.preventDefault();
    const hash = a.getAttribute("href");
    const idx = hash === "#top" ? 0 : scenes.findIndex((s) => "#" + s.el.id === hash);
    if (idx < 0) return;
    go(idx);
    if (a.classList.contains("skip-link")) {
      scenes[idx].el.setAttribute("tabindex", "-1");
      scenes[idx].el.focus({ preventScroll: true });
    }
  });

  // ease internal scroll + "more below" cue
  (function frame() {
    const s = scenes[cur];
    if (s) {
      const max = maxScroll(s);
      s.target = Math.min(s.target, max);
      s.inner.scrollTop += (s.target - s.inner.scrollTop) * 0.12;
      s.el.classList.toggle("has-more", s.inner.scrollTop < max - 6);
    }
    requestAnimationFrame(frame);
  })();

  // start at the hash chapter (or the hero) once the preloader lifts
  function start() {
    const idx = location.hash ? Math.max(0, scenes.findIndex((s) => "#" + s.el.id === location.hash)) : 0;
    go(idx, true);
  }
  if (document.getElementById("preloader").classList.contains("done")) start();
  else document.addEventListener("preloaded", start, { once: true });

  return { active: true, go };
})();

/* ------------------------------------------------------------
   Classic mode (touch / reduced motion): document scroll + IO
   ------------------------------------------------------------ */
(() => {
  if (Deck.active) return;

  const chapters = [...document.querySelectorAll("[data-chapter]")];
  const hudChapter = document.getElementById("hudChapter");
  const rail = document.getElementById("chapterRail");
  const navLinks = [...document.querySelectorAll(".hud-links a")];

  const dots = chapters.map((sec) => {
    const b = document.createElement("button");
    b.className = "rail-dot";
    b.setAttribute("aria-label", sec.dataset.chapter);
    b.addEventListener("click", () => sec.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" }));
    rail.appendChild(b);
    return b;
  });

  const obs = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const sec = e.target;
      const idx = chapters.indexOf(sec);
      hudChapter.textContent = sec.dataset.chapter;
      Scene.setShape(sec.dataset.shape, sec.dataset.tint);
      const [fx, fs] = FRAMING[frameKey(sec)] || [0, 1];
      Scene.setFraming(fx, fs);
      dots.forEach((d, i) => d.classList.toggle("active", i === idx));
      if (sec.id) navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + sec.id));
    }
  }, { rootMargin: "-38% 0px -48% 0px" });
  chapters.forEach((c) => obs.observe(c));

  const revealObs = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add("visible"); revealObs.unobserve(e.target); }
    }
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll(".reveal, .donut-panel").forEach((el) => revealObs.observe(el));

  const fill = document.getElementById("progressFill");
  const hudScroll = document.getElementById("hudScroll");
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      fill.style.width = p * 100 + "%";
      hudScroll.textContent = "SCROLL " + String(Math.round(p * 100)).padStart(3, "0") + "%";
      ticking = false;
    });
  }, { passive: true });
})();

/* ------------------------------------------------------------
   Custom cursor
   ------------------------------------------------------------ */
(() => {
  if (!finePointer || reducedMotion) return;
  const dot = document.getElementById("cursor");
  const ring = document.getElementById("cursorRing");
  document.body.classList.add("custom-cursor");
  let x = -100, y = -100, rx = -100, ry = -100;

  window.addEventListener("mousemove", (e) => {
    x = e.clientX; y = e.clientY;
    const t = e.target.closest && e.target.closest("a, button, input, [role='tab'], .a-item");
    ring.classList.toggle("hover", !!t);
  }, { passive: true });

  (function loop() {
    rx += (x - rx) * 0.18;
    ry += (y - ry) * 0.18;
    dot.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  })();

  document.addEventListener("mouseleave", () => { dot.style.opacity = 0; ring.style.opacity = 0; });
  document.addEventListener("mouseenter", () => { dot.style.opacity = ""; ring.style.opacity = ""; });
})();

/* ------------------------------------------------------------
   Hero stat counters
   ------------------------------------------------------------ */
(() => {
  const nums = document.querySelectorAll(".stat-num");
  let done = false;

  function run() {
    if (done) return;
    done = true;
    nums.forEach((el) => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      const decimals = el.dataset.count.includes(".") ? 1 : 0;
      if (reducedMotion) { el.textContent = target.toFixed(decimals) + suffix; return; }
      const t0 = performance.now(), dur = 1600;
      (function tick(t) {
        const p = Math.min((t - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    });
  }

  if (Deck.active) {
    document.addEventListener("scenechange", (e) => {
      if (e.detail.el.querySelector(".stat-num")) run();
    });
  } else {
    const obs = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { obs.disconnect(); run(); }
    }, { threshold: 0.4 });
    nums.forEach((n) => obs.observe(n));
  }
})();

/* ------------------------------------------------------------
   01 — Scale of the universe
   ------------------------------------------------------------ */
(() => {
  const steps = [
    { name: "Earth", size: "12,742 KM ACROSS", grad: "radial-gradient(circle at 32% 30%, #bcd8f0, #4a7fb0 55%, #0e1b2b)", glow: "rgba(108,196,255,.35)",
      desc: "Home. Every person who has ever lived, every war, every song — all of it happened on this rock." },
    { name: "The Sun", size: "1.39 MILLION KM — 109 EARTHS WIDE", grad: "radial-gradient(circle at 35% 32%, #fdf6d8, #e8c46a 55%, #8a6420)", glow: "rgba(232,196,106,.45)",
      desc: "99.86% of the solar system's mass. If the Sun were a basketball, Earth would be a peppercorn 26 meters away." },
    { name: "The Solar System", size: "~9 BILLION KM TO NEPTUNE", grad: "radial-gradient(circle at 50% 50%, #e8c46a 4%, #0a1420 6%, #0a1420 100%)", glow: "rgba(108,196,255,.3)",
      desc: "Voyager 1, our fastest outbound machine, took 35 years just to reach the edge of the Sun's influence." },
    { name: "One Light-Year", size: "9.46 TRILLION KM", grad: "radial-gradient(circle at 50% 50%, #9fd4ff 2%, #0a1420 5%, #0a1420 100%)", glow: "rgba(159,212,255,.35)",
      desc: "The distance light covers in a year — and light is fast enough to lap Earth 7.5 times per second." },
    { name: "Proxima Centauri", size: "4.25 LIGHT-YEARS AWAY", grad: "radial-gradient(circle at 40% 35%, #f0b8a8, #b0563c 55%, #2b0f08)", glow: "rgba(240,140,110,.35)",
      desc: "The nearest star to the Sun. Our fastest probe would need about 75,000 years to get there. Interstellar travel is hard." },
    { name: "The Milky Way", size: "~100,000 LIGHT-YEARS ACROSS", grad: "radial-gradient(ellipse at 50% 50%, #e6f1f8 5%, #6a8fc0 25%, #0e1b2b 70%)", glow: "rgba(140,180,235,.4)",
      desc: "Our galaxy: 100–400 billion stars in a slow spiral. The Sun completes one lap every 230 million years." },
    { name: "The Local Group", size: "~10 MILLION LIGHT-YEARS", grad: "radial-gradient(circle at 38% 40%, #cfe6ff 4%, #2c4b6e 30%, #0a1420 75%)", glow: "rgba(159,212,255,.3)",
      desc: "Our galactic neighborhood: the Milky Way, Andromeda, and ~80 dwarf galaxies. Andromeda arrives in ~4.5 billion years." },
    { name: "The Observable Universe", size: "93 BILLION LIGHT-YEARS", grad: "conic-gradient(from 0deg, #0e1b2b, #2c4b6e, #6cc4ff, #cfe6ff, #0e1b2b)", glow: "rgba(159,212,255,.45)",
      desc: "Roughly 2 trillion galaxies. And it's only the part we can see — the whole thing may well be infinite." },
  ];
  const slider = document.getElementById("scaleSlider");
  const orb = document.getElementById("scaleOrb");
  const nameEl = document.getElementById("scaleName");
  const sizeEl = document.getElementById("scaleSize");
  const descEl = document.getElementById("scaleDesc");
  const stepEl = document.getElementById("scaleStep");

  function update() {
    const i = +slider.value;
    const s = steps[i];
    stepEl.textContent = `STOP ${i + 1} / ${steps.length}`;
    nameEl.textContent = s.name;
    sizeEl.textContent = s.size;
    descEl.textContent = s.desc;
    orb.style.background = s.grad;
    orb.style.boxShadow = `0 0 55px ${s.glow}`;
    orb.style.transform = `scale(${0.75 + i * 0.05})`;
  }
  slider.addEventListener("input", update);
  update();
})();

/* ------------------------------------------------------------
   03 — Stellar lifecycle
   ------------------------------------------------------------ */
(() => {
  const paths = {
    sun: {
      note: "Stars like the Sun live long, quiet lives — about 10 billion years on the main sequence — and exit gently. In ~5 billion years the Sun will swell past Mercury and Venus, puff off its outer layers, and settle down as a white dwarf: an Earth-sized ember that cools for eternity.",
      stages: [
        { t: "Nebula", time: "T = 0", c: "#8fb4dd", d: "A cold cloud of gas and dust begins to collapse under gravity." },
        { t: "Protostar", time: "~500K YRS", c: "#e8c46a", d: "The core heats as it contracts — not yet a star, but glowing." },
        { t: "Main sequence", time: "10 BILLION YRS", c: "#f5e6a8", d: "Fusion ignites. Gravity and pressure balance. The long, stable adulthood." },
        { t: "Red giant", time: "~1 BILLION YRS", c: "#e0836a", d: "Core hydrogen runs out; the star swells hundreds of times over." },
        { t: "Planetary nebula", time: "~10K YRS", c: "#6cc4ff", d: "Outer layers drift away in glowing shells of gas." },
        { t: "White dwarf", time: "FOREVER", c: "#e8f1f8", d: "The exposed core: Earth-sized, a spoonful weighs a ton. It just… cools." },
      ],
    },
    massive: {
      note: "Mass is destiny — and a curse. A star of 8–25 solar masses burns furiously and dies in mere tens of millions of years, ending in a supernova that briefly outshines its entire galaxy and forges the heavy elements. What's left collapses into a neutron star: a city-sized sphere where one sugar-cube of material outweighs all of humanity.",
      stages: [
        { t: "Nebula", time: "T = 0", c: "#8fb4dd", d: "A larger clump of cloud collapses faster and hotter." },
        { t: "Protostar", time: "~100K YRS", c: "#e8c46a", d: "Bigger mass, stronger gravity, faster ignition." },
        { t: "Main sequence", time: "10–50 MILLION YRS", c: "#9ecfff", d: "Burns blue-hot and reckless — thousands of times the Sun's power." },
        { t: "Red supergiant", time: "~1 MILLION YRS", c: "#e0836a", d: "Fuses ever-heavier elements, shell by shell, until iron. Iron fusion costs energy. Game over." },
        { t: "Supernova", time: "SECONDS", c: "#ffb37a", d: "The core collapses at a quarter the speed of light; the star detonates." },
        { t: "Neutron star", time: "FOREVER", c: "#e8f1f8", d: "20 km wide, spinning up to hundreds of times per second." },
      ],
    },
    giant: {
      note: "Above roughly 25 solar masses, not even the pressure of pure neutrons can hold the collapsing core. It caves in on itself completely, and gravity wins the ultimate victory: a black hole — a region where escape velocity exceeds the speed of light and the star effectively deletes itself from the visible universe.",
      stages: [
        { t: "Nebula", time: "T = 0", c: "#8fb4dd", d: "A monster is born from an unusually massive collapsing cloud." },
        { t: "Protostar", time: "~50K YRS", c: "#e8c46a", d: "Collapse is violent and fast at this mass." },
        { t: "Main sequence", time: "FEW MILLION YRS", c: "#b8ccf0", d: "Lives fast: a blue hypergiant torching its fuel at absurd rates." },
        { t: "Supergiant", time: "~500K YRS", c: "#e0836a", d: "Builds an iron core it cannot support." },
        { t: "Hypernova", time: "SECONDS", c: "#ffb37a", d: "One of the most energetic events in the universe — may fire gamma-ray bursts visible across billions of light-years." },
        { t: "Black hole", time: "FOREVER", c: "#3a4a5c", d: "Collapse never stops. An event horizon forms. Exit, universe." },
      ],
    },
  };
  const container = document.getElementById("lifecycle");
  const note = document.getElementById("lifecycleNote");
  const tabs = document.querySelectorAll(".mass-tab");

  function render(key) {
    const path = paths[key];
    container.innerHTML = "";
    path.stages.forEach((s, i) => {
      const node = document.createElement("div");
      node.className = "stage-node";
      node.style.setProperty("--i", i);
      node.style.setProperty("--node-c", s.c);
      node.innerHTML = `<h4>${s.t}</h4><span class="mono">${s.time}</span><p>${s.d}</p>`;
      container.appendChild(node);
    });
    note.innerHTML = path.note.replace(/(supernova|black hole|neutron star|white dwarf)/i, "<strong>$1</strong>");
  }
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => { t.classList.remove("active"); t.setAttribute("aria-selected", "false"); });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
      render(tab.dataset.mass);
    });
  });
  render("sun");
})();

/* ------------------------------------------------------------
   05 — Redshift demo
   ------------------------------------------------------------ */
(() => {
  const LINES = [393, 486, 517, 589, 656];
  const MIN_NM = 380, MAX_NM = 750;
  const rest = document.getElementById("specRest");
  const shifted = document.getElementById("specShift");
  const slider = document.getElementById("velSlider");
  const velOut = document.getElementById("velReadout");
  const zOut = document.getElementById("zReadout");
  const dirOut = document.getElementById("shiftDir");

  const pos = (nm) => ((nm - MIN_NM) / (MAX_NM - MIN_NM)) * 100;

  function makeLines(el) {
    return LINES.map((nm) => {
      const line = document.createElement("span");
      line.className = "spec-line";
      line.style.left = pos(nm) + "%";
      el.appendChild(line);
      return line;
    });
  }
  makeLines(rest);
  const shiftLines = makeLines(shifted);

  function update() {
    const beta = +slider.value / 100;
    const z = Math.sqrt((1 + beta) / (1 - beta)) - 1;
    shiftLines.forEach((line, i) => {
      const nm = LINES[i] * (1 + z);
      const p = pos(nm);
      line.style.left = Math.min(Math.max(p, 0), 100) + "%";
      line.style.opacity = p > 100 || p < 0 ? 0 : 1;
    });
    velOut.textContent = `v = ${beta >= 0 ? "" : "−"}${Math.abs(beta).toFixed(2)}c`;
    zOut.textContent = `z = ${z >= 0 ? "" : "−"}${Math.abs(z).toFixed(2)}`;
    if (beta > 0.005) { dirOut.textContent = "REDSHIFT →"; dirOut.className = "shift-red"; }
    else if (beta < -0.005) { dirOut.textContent = "← BLUESHIFT"; dirOut.className = "shift-blue"; }
    else { dirOut.textContent = "AT REST"; dirOut.className = ""; }
  }
  slider.addEventListener("input", update);
  update();
})();

/* ------------------------------------------------------------
   08 — Rocket anatomy hover/click sync
   ------------------------------------------------------------ */
(() => {
  const items = [...document.querySelectorAll(".a-item")];
  const parts = [...document.querySelectorAll(".a-part")];

  function highlight(name) {
    items.forEach((i) => i.classList.toggle("active", i.dataset.part === name));
    parts.forEach((p) => p.classList.toggle("hl", p.dataset.part === name));
  }
  items.forEach((i) => {
    i.addEventListener("mouseenter", () => highlight(i.dataset.part));
    i.addEventListener("focus", () => highlight(i.dataset.part));
    i.addEventListener("click", () => highlight(i.dataset.part));
  });
  parts.forEach((p) => {
    p.addEventListener("mouseenter", () => highlight(p.dataset.part));
    p.addEventListener("click", () => highlight(p.dataset.part));
  });
  highlight("fairing");
})();

/* ------------------------------------------------------------
   09 — Rocket equation calculator
   ------------------------------------------------------------ */
(() => {
  const ve = document.getElementById("veSlider");
  const mr = document.getElementById("mrSlider");
  const veVal = document.getElementById("veVal");
  const mrVal = document.getElementById("mrVal");
  const dvVal = document.getElementById("dvVal");
  const dvFill = document.getElementById("dvFill");
  const verdict = document.getElementById("dvVerdict");
  const BAR_MAX = 13;

  function update() {
    const v = +ve.value / 10;
    const r = +mr.value / 10;
    const dv = v * Math.log(r);
    veVal.textContent = `${v.toFixed(1)} km/s`;
    mrVal.textContent = `${r.toFixed(1)}×`;
    dvVal.textContent = dv.toFixed(2);
    dvFill.style.width = Math.min((dv / BAR_MAX) * 100, 100) + "%";

    let msg, ok = false;
    if (dv < 2) msg = "BARELY OFF THE PAD. A FIREWORK WITH AMBITION.";
    else if (dv < 7.8) msg = "SUBORBITAL HOP — UP, THEN STRAIGHT BACK DOWN.";
    else if (dv < 9.4) msg = "SO CLOSE. YOU CAN TOUCH SPACE, BUT YOU CAN'T STAY.";
    else if (dv < 12.2) { msg = "ORBIT ACHIEVED. YOU ARE OFFICIALLY A SATELLITE."; ok = true; }
    else { msg = "TRANSLUNAR CAPABLE. THE MOON IS WITHIN REACH."; ok = true; }
    verdict.textContent = msg;
    verdict.classList.toggle("ok", ok);
  }
  ve.addEventListener("input", update);
  mr.addEventListener("input", update);
  update();
})();

/* ------------------------------------------------------------
   11 — Newton's cannonball orbit simulator
   ------------------------------------------------------------ */
(() => {
  const canvas = document.getElementById("orbitCanvas");
  const ctx = canvas.getContext("2d");
  const slider = document.getElementById("orbitSlider");
  const speedVal = document.getElementById("orbitSpeedVal");
  const statusEl = document.getElementById("orbitStatus");
  const replayBtn = document.getElementById("orbitReplay");

  const GM = 398600;
  const R_EARTH = 6371;
  const ALT = 500;
  const R0 = R_EARTH + ALT;
  const W = canvas.width, H = canvas.height;
  const CX = W / 2, CY = H / 2 + 10;
  const PX_PER_KM = 95 / R0;
  const DT = 4;
  const SUBSTEPS = 14;

  let body = null;
  let trail = [];
  let state = "flying";
  let running = false;

  function launch() {
    const v = +slider.value / 10;
    body = { x: 0, y: -R0, vx: v, vy: 0 };
    trail = [[0, -R0]];
    state = "flying";
    updateStatusPrediction(v);
  }

  function updateStatusPrediction(v) {
    const vCirc = Math.sqrt(GM / R0);
    const vEsc = Math.sqrt(2 * GM / R0);
    speedVal.textContent = `${v.toFixed(1)} km/s`;
    if (v < vCirc * 0.72) statusEl.textContent = "STATUS: FALLING BACK — TOO SLOW";
    else if (v < vCirc * 0.985) statusEl.textContent = "STATUS: LOW ELLIPSE — RE-ENTRY RISK";
    else if (v < vCirc * 1.06) statusEl.textContent = "STATUS: STABLE ORBIT — FALLING FOREVER";
    else if (v < vEsc) statusEl.textContent = "STATUS: ELLIPTICAL ORBIT — HIGH APOGEE";
    else statusEl.textContent = "STATUS: ESCAPE TRAJECTORY — GOODBYE, EARTH";
  }

  function step() {
    if (state !== "flying") return;
    for (let i = 0; i < SUBSTEPS; i++) {
      const r = Math.hypot(body.x, body.y);
      if (r <= R_EARTH) { state = "crashed"; statusEl.textContent = "STATUS: LITHOBRAKING (CRASHED)"; return; }
      if (r > R0 * 14) { state = "escaped"; statusEl.textContent = "STATUS: ESCAPED EARTH'S GRAVITY"; return; }
      const a = -GM / (r * r * r);
      body.vx += a * body.x * DT;
      body.vy += a * body.y * DT;
      body.x += body.vx * DT;
      body.y += body.vy * DT;
    }
    trail.push([body.x, body.y]);
    if (trail.length > 1400) trail.shift();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    const atm = ctx.createRadialGradient(CX, CY, R_EARTH * PX_PER_KM, CX, CY, R_EARTH * PX_PER_KM + 26);
    atm.addColorStop(0, "rgba(108,196,255,0.3)");
    atm.addColorStop(1, "rgba(108,196,255,0)");
    ctx.fillStyle = atm;
    ctx.beginPath();
    ctx.arc(CX, CY, R_EARTH * PX_PER_KM + 26, 0, Math.PI * 2);
    ctx.fill();

    const pg = ctx.createRadialGradient(CX - 24, CY - 28, 12, CX, CY, R_EARTH * PX_PER_KM);
    pg.addColorStop(0, "#7fa8cc");
    pg.addColorStop(0.55, "#3c6a94");
    pg.addColorStop(1, "#0c1b2e");
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(CX, CY, R_EARTH * PX_PER_KM, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#e8f1f8";
    ctx.beginPath();
    ctx.arc(CX, CY - R0 * PX_PER_KM, 3, 0, Math.PI * 2);
    ctx.fill();

    if (trail.length > 1) {
      ctx.beginPath();
      ctx.moveTo(CX + trail[0][0] * PX_PER_KM, CY + trail[0][1] * PX_PER_KM);
      for (let i = 1; i < trail.length; i++) {
        ctx.lineTo(CX + trail[i][0] * PX_PER_KM, CY + trail[i][1] * PX_PER_KM);
      }
      ctx.strokeStyle = state === "escaped" ? "rgba(255,157,138,0.9)"
        : state === "crashed" ? "rgba(255,179,122,0.9)"
        : "rgba(142,240,192,0.9)";
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }

    if (state !== "crashed") {
      const px = CX + body.x * PX_PER_KM;
      const py = CY + body.y * PX_PER_KM;
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.shadowColor = "#6cc4ff";
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      const last = trail[trail.length - 1];
      ctx.beginPath();
      ctx.arc(CX + last[0] * PX_PER_KM, CY + last[1] * PX_PER_KM, 7, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,179,122,0.85)";
      ctx.fill();
    }
  }

  function loop() {
    if (running) step();
    draw();
    requestAnimationFrame(loop);
  }

  slider.addEventListener("input", launch);
  replayBtn.addEventListener("click", launch);

  if (Deck.active) {
    document.addEventListener("scenechange", (e) => { running = e.detail.el.contains(canvas); });
  } else {
    const visObs = new IntersectionObserver((entries) => {
      running = entries[0].isIntersecting;
    }, { threshold: 0.05 });
    visObs.observe(canvas);
  }

  launch();
  if (reducedMotion) {
    for (let i = 0; i < 500; i++) step();
    draw();
    slider.addEventListener("input", () => { launch(); for (let i = 0; i < 500; i++) step(); draw(); });
  } else {
    requestAnimationFrame(loop);
  }
})();
