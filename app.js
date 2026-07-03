/* ============ Pathfinder — app logic (v2) ============ */

// ---------- state ----------
const STORE_KEY = "pathfinder-state-v1";

const DEFAULTS = {
  profile: {
    name: "", school: "", gradYear: "", gpa: "", sat: "", act: "",
    state: "", interests: "", major: "", clubs: [], leadership: "none",
  },
  myList: [],            // { name, status, appType, deadline }
  tasksDone: {},         // id -> true
  customTasks: [],       // { id, text }
  removedTasks: {},      // id -> true (hidden defaults)
  quizAnswers: [],       // selected option index per question
  track: "undecided",
  essay: { prompt: 0, draft: "" },
  theme: "light",
};

function loadState() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
  catch { return {}; }
}
const _loaded = loadState();
const state = {
  ...DEFAULTS,
  ..._loaded,
  profile: { ...DEFAULTS.profile, ...(_loaded.profile || {}) },
  essay: { ...DEFAULTS.essay, ...(_loaded.essay || {}) },
};
if (!Array.isArray(state.profile.clubs)) state.profile.clubs = [];
state.myList.forEach((c) => { if (!c.reqs) c.reqs = {}; });

function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

// ---------- helpers ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

let toastTimer;
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
}

// ACT → approximate SAT concordance
const ACT_TO_SAT = { 36: 1590, 35: 1540, 34: 1500, 33: 1460, 32: 1430, 31: 1400, 30: 1370, 29: 1340, 28: 1310, 27: 1280, 26: 1240, 25: 1210, 24: 1180, 23: 1140, 22: 1110, 21: 1080, 20: 1040, 19: 1010, 18: 970, 17: 930, 16: 890 };

function effectiveSAT() {
  const p = state.profile;
  if (p.sat) return Number(p.sat);
  if (p.act && ACT_TO_SAT[Math.round(p.act)]) return ACT_TO_SAT[Math.round(p.act)];
  return null;
}

// Current grade (9–12) from graduation year; null if unknown/out of range
function currentGrade() {
  const gy = Number(state.profile.gradYear);
  if (!gy) return null;
  const now = new Date();
  // Academic year rolls over Aug 1 (July counts as "rising" into next grade)
  const efYear = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
  const grade = 12 - (gy - efYear);
  return grade >= 9 && grade <= 12 ? grade : null;
}
const GRADE_NAMES = { 9: "Freshman", 10: "Sophomore", 11: "Junior", 12: "Senior" };

// ---------- theme ----------
function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
  $("#theme-toggle").innerHTML = state.theme === "dark"
    ? `<span class="nav-ico">☀️</span> Light mode`
    : `<span class="nav-ico">🌙</span> Dark mode`;
}
$("#theme-toggle").addEventListener("click", () => {
  state.theme = state.theme === "dark" ? "light" : "dark";
  save(); applyTheme();
});

// ---------- navigation ----------
$$(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => showView(btn.dataset.view));
});

function showView(view) {
  $$(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  $$(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + view));
  if (view === "dashboard") renderDashboard();
  if (view === "colleges") renderColleges();
  window.scrollTo(0, 0);
}

// ============================================================
// DASHBOARD
// ============================================================
function renderDashboard() {
  renderHero();

  const words = countWords(state.essay.draft);
  const submitted = state.myList.filter((c) => ["Submitted", "Accepted 🎉", "Waitlisted", "Denied"].includes(c.status)).length;
  const nextDl = upcomingDeadlines()[0];
  $("#dash-stats").innerHTML = `
    <div class="stat"><div class="stat-ico i1">🏛️</div><div><div class="stat-num">${state.myList.length}</div><div class="stat-label">colleges on my list</div></div></div>
    <div class="stat"><div class="stat-ico i2">📨</div><div><div class="stat-num">${submitted}</div><div class="stat-label">applications submitted</div></div></div>
    <div class="stat"><div class="stat-ico i3">✍️</div><div><div class="stat-num">${words}<span style="font-size:13px;color:var(--ink-soft)"> / 650</span></div><div class="stat-label">essay words drafted</div></div></div>
    <div class="stat"><div class="stat-ico i4">⏰</div><div><div class="stat-num">${nextDl ? nextDl.days + "d" : "—"}</div><div class="stat-label">${nextDl ? "until " + esc(nextDl.name) : "no deadlines set yet"}</div></div></div>`;

  const dls = upcomingDeadlines();
  $("#dash-deadlines").innerHTML = dls.length
    ? dls.slice(0, 6).map((d) => `
        <div class="deadline-row">
          <span><strong>${esc(d.name)}</strong> <span class="muted small">(${esc(d.appType)})</span></span>
          <span class="deadline-days ${d.days <= 14 ? "soon" : "ok"}">${d.days} day${d.days === 1 ? "" : "s"}</span>
        </div>`).join("")
    : `<p class="empty-note">No deadlines yet. Add colleges to <strong>My list</strong> and set their deadlines — they'll show up here with a countdown.</p>`;

  renderTasks();
  renderTimeline();
}

function renderHero() {
  const p = state.profile;
  const grade = currentGrade();
  const tasks = visibleTasks();
  const done = tasks.filter((t) => state.tasksDone[t.id]).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const R = 30, CIRC = 2 * Math.PI * R;

  const chips = [];
  if (grade) chips.push(`🎓 ${GRADE_NAMES[grade]}${p.school ? " at " + esc(p.school) : ""}`);
  else if (p.school) chips.push(`🎓 ${esc(p.school)}`);
  if (p.gradYear) chips.push(`🎉 Class of ${esc(p.gradYear)}`);
  if (p.major) chips.push(`🎯 ${esc(p.major)}`);
  if (p.clubs.length) chips.push(`🎪 ${p.clubs.length} activit${p.clubs.length === 1 ? "y" : "ies"}`);

  $("#dash-hero").innerHTML = `
    <div class="hero">
      <div class="hero-main">
        <div class="hero-avatar">${p.name ? esc(p.name[0]) : "🧭"}</div>
        <div class="hero-text">
          <h1>${p.name ? `Hey, ${esc(p.name)}! 👋` : "Welcome to Pathfinder! 👋"}</h1>
          <div class="hero-chips">
            ${chips.join("") ? chips.map((c) => `<span class="hero-chip">${c}</span>`).join("") : ""}
            ${!p.name || !p.gradYear ? `<button class="hero-chip click" id="hero-setup-btn">✨ Set up My Profile →</button>` : ""}
          </div>
        </div>
      </div>
      <div class="hero-ring" title="${done} of ${tasks.length} tasks done">
        <svg width="76" height="76" viewBox="0 0 76 76">
          <circle class="ring-track" cx="38" cy="38" r="${R}"></circle>
          <circle class="ring-fill" cx="38" cy="38" r="${R}"
            stroke-dasharray="${CIRC.toFixed(1)}"
            stroke-dashoffset="${(CIRC * (1 - pct / 100)).toFixed(1)}"></circle>
        </svg>
        <div class="ring-label">${pct}%<span>TASKS DONE</span></div>
      </div>
    </div>`;

  const setup = $("#hero-setup-btn");
  if (setup) setup.addEventListener("click", () => showView("profile"));
}

function upcomingDeadlines() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return state.myList
    .filter((c) => c.deadline)
    .map((c) => ({ ...c, days: Math.round((new Date(c.deadline + "T00:00") - today) / 86400000) }))
    .filter((c) => c.days >= 0)
    .sort((a, b) => a.days - b.days);
}

// ----- tasks -----
function visibleTasks() {
  const grade = currentGrade() || 11;
  const defaults = (DEFAULT_TASKS[grade] || []).map((text, i) => ({ id: `d${grade}-${i}`, text }));
  return defaults.filter((t) => !state.removedTasks[t.id]).concat(state.customTasks);
}

function renderTasks() {
  const tasks = visibleTasks();
  $("#dash-tasks").innerHTML = tasks.map((t) => `
    <div class="task-row ${state.tasksDone[t.id] ? "done" : ""}">
      <input type="checkbox" data-task="${t.id}" ${state.tasksDone[t.id] ? "checked" : ""}>
      <span class="task-text">${esc(t.text)}</span>
      <button class="task-del" data-del="${t.id}" title="Remove task">✕</button>
    </div>`).join("");

  $$("#dash-tasks input[type=checkbox]").forEach((cb) => {
    cb.addEventListener("change", () => {
      state.tasksDone[cb.dataset.task] = cb.checked;
      save(); renderDashboard();
    });
  });
  $$("#dash-tasks .task-del").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.del;
      if (id.startsWith("c-")) state.customTasks = state.customTasks.filter((t) => t.id !== id);
      else state.removedTasks[id] = true;
      delete state.tasksDone[id];
      save(); renderDashboard();
    });
  });
}

$("#add-task-btn").addEventListener("click", addTask);
$("#new-task-input").addEventListener("keydown", (e) => { if (e.key === "Enter") addTask(); });
function addTask() {
  const input = $("#new-task-input");
  const text = input.value.trim();
  if (!text) return;
  state.customTasks.push({ id: "c-" + Date.now(), text });
  input.value = "";
  save(); renderDashboard();
}

// ----- timeline -----
function renderTimeline() {
  const grade = currentGrade();
  let currentIdx = -1;
  if (grade) {
    currentIdx = grade - 9;                       // 9→0, 10→1, 11→2, 12→3 (fall)
    if (grade === 12 && new Date().getMonth() <= 5) currentIdx = 4; // Jan–Jun of senior year
  }
  $("#dash-timeline").innerHTML = TIMELINE.map((step, i) => `
    <div class="tl-item ${i === currentIdx ? "current" : i < currentIdx ? "past" : ""}">
      <div class="tl-grade">${esc(step.grade)}</div>
      <div class="tl-dotcol"><div class="tl-dot"></div><div class="tl-line"></div></div>
      <div class="tl-body">
        <strong>${i === currentIdx ? `You are here<span class="badge-now">NOW</span>` : i < currentIdx ? "Done ✓" : "Coming up"}</strong>
        <ul>${step.items.map((it) => `<li>${esc(it)}</li>`).join("")}</ul>
      </div>
    </div>`).join("");
}

// ============================================================
// PROFILE
// ============================================================
function initProfile() {
  const sel = $("#p-gradyear");
  const thisYear = new Date().getFullYear();
  sel.innerHTML = `<option value="">Select…</option>` +
    Array.from({ length: 7 }, (_, i) => thisYear + i)
      .map((y) => `<option value="${y}">${y}</option>`).join("");

  const p = state.profile;
  $("#p-name").value = p.name;
  $("#p-school").value = p.school;
  $("#p-gradyear").value = p.gradYear;
  $("#p-gpa").value = p.gpa;
  $("#p-sat").value = p.sat;
  $("#p-act").value = p.act;
  $("#p-state").value = p.state;
  $("#p-interests").value = p.interests;
  $("#p-leadership").value = p.leadership || "none";

  $("#save-profile-btn").addEventListener("click", () => {
    Object.assign(state.profile, {
      name: $("#p-name").value.trim(),
      school: $("#p-school").value.trim(),
      gradYear: $("#p-gradyear").value,
      gpa: $("#p-gpa").value,
      sat: $("#p-sat").value,
      act: $("#p-act").value,
      state: $("#p-state").value.trim(),
      interests: $("#p-interests").value.trim(),
    });
    setMajor($("#p-major").value, { silent: true });
    save();
    toast("Profile saved ✓ Your recommendations just got smarter.");
    renderDashboard();
    renderColleges();
  });

  $("#p-leadership").addEventListener("change", () => {
    state.profile.leadership = $("#p-leadership").value;
    save(); renderColleges();
  });

  renderClubChips();
  $("#add-club-btn").addEventListener("click", addClub);
  $("#new-club-input").addEventListener("keydown", (e) => { if (e.key === "Enter") addClub(); });

  // GPA converter
  const updateConverter = () => {
    const w = parseFloat($("#conv-weighted").value);
    const scale = parseFloat($("#conv-scale").value);
    const ok = w > 0 && scale > 0;
    $("#conv-result").textContent = ok ? clamp((w * 4) / scale, 0, 4).toFixed(2) : "—";
    $("#conv-apply").disabled = !ok;
  };
  $("#conv-weighted").addEventListener("input", updateConverter);
  $("#conv-scale").addEventListener("input", updateConverter);
  $("#conv-apply").addEventListener("click", () => {
    const est = $("#conv-result").textContent;
    if (est === "—") return;
    state.profile.gpa = est;
    $("#p-gpa").value = est;
    save();
    toast(`GPA set to ${est} ✓ (double-check against your transcript!)`);
    renderColleges();
  });
}

function renderClubChips() {
  const custom = state.profile.clubs.filter((c) => !CLUBS.includes(c));
  const all = [...CLUBS, ...custom];
  $("#club-chips").innerHTML = all.map((c) => `
    <button class="club-chip ${state.profile.clubs.includes(c) ? "selected" : ""}" data-club="${esc(c)}">${esc(c)}</button>`).join("");
  $$("#club-chips .club-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const club = chip.dataset.club;
      const i = state.profile.clubs.indexOf(club);
      if (i >= 0) state.profile.clubs.splice(i, 1);
      else state.profile.clubs.push(club);
      save(); renderClubChips(); renderColleges();
    });
  });
}

function addClub() {
  const input = $("#new-club-input");
  const club = input.value.trim();
  if (!club) return;
  if (!state.profile.clubs.includes(club)) state.profile.clubs.push(club);
  input.value = "";
  save(); renderClubChips(); renderColleges();
  toast(`${club} added ✓`);
}

// ============================================================
// MAJOR SELECTION + MATCH QUIZ
// ============================================================
function initMajors() {
  const opts = `<option value="">Undecided / not sure yet</option>` +
    MAJORS.map((m) => `<option value="${esc(m.name)}">${esc(m.name)}</option>`).join("");
  $("#p-major").innerHTML = opts;
  $("#major-select").innerHTML = opts;
  $("#p-major").value = state.profile.major;
  $("#major-select").value = state.profile.major;

  $("#major-select").addEventListener("change", () => setMajor($("#major-select").value));
  renderChosenMajor();
}

function setMajor(name, { silent } = {}) {
  state.profile.major = name;
  const m = MAJORS.find((x) => x.name === name);
  if (m) {
    state.track = m.track;
    const trackSel = $("#track-select");
    if (trackSel) { trackSel.value = m.track; renderTrack(); }
  }
  save();
  $("#p-major").value = name;
  $("#major-select").value = name;
  renderChosenMajor();
  if (!silent) toast(name ? `${name} set as your major 🎯` : "Major cleared — the quiz can help!");
}

function renderChosenMajor() {
  const m = MAJORS.find((x) => x.name === state.profile.major);
  $("#chosen-major-card").innerHTML = m ? `
    <div class="chosen-major">
      <p>${esc(m.desc)}</p>
      <div class="chips">${m.careers.map((c) => `<span class="chip">${esc(c)}</span>`).join("")}</div>
      <p style="margin-top:10px"><strong>High school classes that help:</strong></p>
      <div class="chips">${m.classes.map((c) => `<span class="chip green">${esc(c)}</span>`).join("")}</div>
      <div class="row-end" style="margin-top:12px">
        <button class="btn btn-ghost btn-small" id="chosen-major-plan">See my 4-year course plan →</button>
      </div>
    </div>` : `
    <div class="chosen-major">
      <p class="muted">No major picked yet — and that's completely fine. Take the quiz below, or browse the dropdown. You can change this anytime.</p>
    </div>`;
  const btn = $("#chosen-major-plan");
  if (btn) btn.addEventListener("click", () => showView("courses"));
}

function initQuiz() {
  $("#quiz-questions").innerHTML = QUIZ.map((q, qi) => `
    <div class="quiz-q">
      <h3>${qi + 1}. ${esc(q.q)}</h3>
      <div class="quiz-opts">
        ${q.opts.map((o, oi) => `
          <label class="quiz-opt ${state.quizAnswers[qi] === oi ? "selected" : ""}">
            <input type="radio" name="q${qi}" value="${oi}" ${state.quizAnswers[qi] === oi ? "checked" : ""}>
            <span>${esc(o.t)}</span>
          </label>`).join("")}
      </div>
    </div>`).join("");

  $$("#quiz-questions input[type=radio]").forEach((r) => {
    r.addEventListener("change", () => {
      const qi = Number(r.name.slice(1));
      state.quizAnswers[qi] = Number(r.value);
      save();
      $$(`#quiz-questions input[name=q${qi}]`).forEach((inp) =>
        inp.closest(".quiz-opt").classList.toggle("selected", inp.checked));
    });
  });

  $("#quiz-submit-btn").addEventListener("click", showQuizResults);
  $("#quiz-reset-btn").addEventListener("click", () => {
    state.quizAnswers = [];
    save();
    $("#quiz-results").innerHTML = "";
    initQuiz();
  });
}

function showQuizResults() {
  const answered = QUIZ.filter((_, i) => state.quizAnswers[i] != null).length;
  if (answered < QUIZ.length) {
    toast(`Answer all ${QUIZ.length} questions first (${answered}/${QUIZ.length} done)`);
    return;
  }
  const user = {};
  QUIZ.forEach((q, qi) => {
    const w = q.opts[state.quizAnswers[qi]].w;
    for (const [t, v] of Object.entries(w)) user[t] = (user[t] || 0) + v;
  });
  const traits = ["tech", "stem", "health", "business", "humanities", "arts", "social"];
  const mag = (v) => Math.sqrt(traits.reduce((s, t) => s + (v[t] || 0) ** 2, 0));
  const results = MAJORS.map((m) => {
    const dot = traits.reduce((s, t) => s + (user[t] || 0) * (m.traits[t] || 0), 0);
    return { m, score: dot / (mag(user) * mag(m.traits) || 1) };
  }).sort((a, b) => b.score - a.score).slice(0, 3);

  $("#quiz-results").innerHTML = `<h2 style="margin:6px 0 14px">Your top matches</h2>` +
    results.map(({ m, score }, i) => `
      <div class="match-card">
        <div class="match-head">
          <h3>${["🥇", "🥈", "🥉"][i]} ${esc(m.name)}</h3>
          <span class="match-pct">${Math.round(score * 100)}% match</span>
        </div>
        <p>${esc(m.desc)}</p>
        <div class="chips">${m.careers.map((c) => `<span class="chip">${esc(c)}</span>`).join("")}</div>
        <p style="margin-top:10px"><strong>High school classes that help:</strong></p>
        <div class="chips">${m.classes.map((c) => `<span class="chip green">${esc(c)}</span>`).join("")}</div>
        <div class="row-end" style="margin-top:12px">
          <button class="btn btn-ghost btn-small" data-plan="${m.track}">See course plan →</button>
          <button class="btn btn-primary btn-small" data-setmajor="${esc(m.name)}">🎯 Set as my major</button>
        </div>
      </div>`).join("") +
    `<div class="card tip-card">💡 Treat these as starting points, not verdicts. About a third of college students change majors — what matters now is picking classes and activities that keep your best doors open.</div>`;

  $$("#quiz-results [data-plan]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.track = btn.dataset.plan;
      save();
      $("#track-select").value = state.track;
      renderTrack();
      showView("courses");
    });
  });
  $$("#quiz-results [data-setmajor]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setMajor(btn.dataset.setmajor);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
  $("#quiz-results").scrollIntoView({ behavior: "smooth" });
}

// ============================================================
// COURSE PLANNER
// ============================================================
function initCourses() {
  const sel = $("#track-select");
  sel.innerHTML = Object.entries(TRACKS)
    .map(([key, t]) => `<option value="${key}">${esc(t.label)}</option>`).join("");
  sel.value = TRACKS[state.track] ? state.track : "undecided";
  sel.addEventListener("change", () => {
    state.track = sel.value;
    save(); renderTrack();
  });
  renderTrack();
}

function renderTrack() {
  const track = TRACKS[state.track] || TRACKS.undecided;
  $("#track-plan").innerHTML =
    Object.entries(track.years).map(([year, subjects]) => `
      <div class="course-year">
        <h3>${esc(year)}</h3>
        <table class="course-table">
          ${Object.entries(subjects).map(([subj, cls]) => `<tr><td>${esc(subj)}</td><td>${esc(cls)}</td></tr>`).join("")}
        </table>
      </div>`).join("") +
    `<div class="card tip-card track-tip">💡 <strong>Counselor's note:</strong> ${esc(track.tip)}</div>`;
}

// ============================================================
// COLLEGES — admission chance model
// ============================================================
// Rough heuristic: start from the school's acceptance rate, scale by how the
// student's GPA/SAT compare to typical admits, nudge for activities/leadership.
function admitChance(c) {
  const gpa = Number(state.profile.gpa) || null;
  const sat = effectiveSAT();
  if (!gpa && !sat) return null;

  const factors = [];
  if (sat) {
    const p = (sat - c.sat25) / (c.sat75 - c.sat25); // 0 = 25th pct, 1 = 75th pct
    factors.push(clamp(0.6 + p * 1.3, 0.2, 2.1));
  }
  if (gpa) {
    factors.push(clamp(1 + (gpa - c.gpa) * 3, 0.2, 1.7));
  }
  let f = factors.reduce((a, b) => a + b, 0) / factors.length;

  const leadBoost = { none: 0.92, member: 1.0, officer: 1.08, president: 1.18 }[state.profile.leadership] || 1;
  f *= leadBoost * (1 + Math.min(state.profile.clubs.length, 5) * 0.015);

  let chance = c.acc * f;
  // ultra-selective schools are a lottery even for perfect stats
  if (c.acc < 10) chance = Math.min(chance, c.acc * 4);
  else if (c.acc < 20) chance = Math.min(chance, c.acc * 3);
  return Math.round(clamp(chance, 2, 95));
}

function fitFromChance(c, chance) {
  if (chance == null) return null;
  if (c.acc < 15) return "Reach";                 // sub-15% acceptance = reach for everyone
  if (chance >= 70) return "Safety";
  if (chance >= 35) return "Match";
  return "Reach";
}

const MONO_PALETTE = 6;
function monoClass(name) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return "m" + (h % MONO_PALETTE);
}
function monogram(name) {
  return name.split(/\s+/).filter((w) => /^[A-Z(]/.test(w)).slice(0, 2)
    .map((w) => w.replace("(", "")[0]).join("") || name.slice(0, 2);
}

function chanceHtml(c, chance, fit) {
  if (chance == null) return "";
  return `
    <div class="chance-row" title="Rough estimate — real admissions also read essays, recs & context">
      <div class="chance-track"><div class="chance-fill cb-${fit}" style="width:${chance}%"></div></div>
      <span class="chance-pct">~${chance}% chance</span>
    </div>`;
}

function renderColleges() {
  if (!$("#college-list")) return;
  const hasStats = Number(state.profile.gpa) || effectiveSAT();
  $("#fit-note").textContent = hasStats
    ? "Chance estimates use your GPA, test score, activities & leadership vs. each school's typical admits. Real admissions read essays, recs, and context we can't see — treat these as ballpark, never guarantees."
    : "Add your GPA or a test score in My Profile to see personalized admission chances and Reach / Match / Safety badges.";

  const q = $("#college-search").value.trim().toLowerCase();
  const fitF = $("#college-fit-filter").value;
  const typeF = $("#college-type-filter").value;
  const sort = $("#college-sort").value;

  let list = COLLEGES.map((c) => {
    const chance = admitChance(c);
    return { ...c, chance, fit: fitFromChance(c, chance) };
  });
  if (q) list = list.filter((c) =>
    c.name.toLowerCase().includes(q) || c.state.toLowerCase().includes(q) ||
    c.tags.some((t) => t.toLowerCase().includes(q)));
  if (fitF !== "all") list = list.filter((c) => c.fit === fitF);
  if (typeF !== "all") list = list.filter((c) => c.type === typeF);
  list.sort((a, b) =>
    sort === "chance" ? (b.chance ?? b.acc) - (a.chance ?? a.acc) :
    sort === "acc-desc" ? b.acc - a.acc :
    sort === "acc-asc" ? a.acc - b.acc :
    a.name.localeCompare(b.name));

  const onList = new Set(state.myList.map((c) => c.name));
  $("#college-list").innerHTML = list.length ? list.map((c) => `
    <div class="college-card">
      <div class="college-top">
        <div class="college-mono ${monoClass(c.name)}">${esc(monogram(c.name))}</div>
        <div class="college-namebox">
          <h3>${esc(c.name)}</h3>
          <div class="college-loc">${esc(c.state)} · ${esc(c.type)}</div>
        </div>
        <span class="fit-badge ${c.fit ? "fit-" + c.fit : "fit-none"}">${c.fit || "add stats"}</span>
      </div>
      <div class="college-stats">
        <div><strong>${c.acc}%</strong>acceptance</div>
        <div><strong>${c.sat25}–${c.sat75}</strong>SAT range</div>
        <div><strong>${c.gpa.toFixed(2)}</strong>avg GPA</div>
      </div>
      ${chanceHtml(c, c.chance, c.fit)}
      <div class="college-foot">
        <div class="college-tags">${c.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
        ${onList.has(c.name)
          ? `<button class="btn btn-ghost btn-small" disabled>✓ On my list</button>`
          : `<button class="btn btn-primary btn-small" data-add="${esc(c.name)}">+ Add to list</button>`}
      </div>
    </div>`).join("")
    : `<p class="empty-note">No colleges match those filters.</p>`;

  $$("#college-list [data-add]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.myList.push({ name: btn.dataset.add, status: "Researching", appType: "RD", deadline: "", reqs: {} });
      save();
      toast(`${btn.dataset.add} added to your list ✓`);
      renderColleges();
    });
  });

  $("#mylist-count").textContent = state.myList.length;
  renderMyList();
}

const STATUSES = ["Researching", "Essays in progress", "Ready to submit", "Submitted", "Accepted 🎉", "Waitlisted", "Denied"];
const APP_TYPES = ["ED", "EA", "REA", "RD", "Rolling"];

function renderMyList() {
  if (!state.myList.length) {
    $("#list-balance").innerHTML = "";
    $("#mylist-body").innerHTML = `<p class="empty-note">Your list is empty. Head to <strong>Explore colleges</strong> and add schools — then track statuses and deadlines here.<br><br>A balanced list: 2–3 safeties · 3–4 matches · 2–3 reaches.</p>`;
    return;
  }

  const byName = Object.fromEntries(COLLEGES.map((c) => [c.name, c]));
  const info = (name) => {
    const c = byName[name];
    if (!c) return { chance: null, fit: null };
    const chance = admitChance(c);
    return { chance, fit: fitFromChance(c, chance) };
  };

  // balance meter
  const counts = { Reach: 0, Match: 0, Safety: 0 };
  state.myList.forEach((c) => { const f = info(c.name).fit; if (f) counts[f]++; });
  const rated = counts.Reach + counts.Match + counts.Safety;
  let advice = "";
  if (rated) {
    if (!counts.Safety) advice = "⚠️ No safeties yet — add 1–2 schools you'd be happy at with great odds.";
    else if (!counts.Match) advice = "⚠️ Add a few match schools — they're where most students end up.";
    else if (!counts.Reach) advice = "You've got room to dream — consider adding a reach or two.";
    else advice = "✨ Nice balance!";
  }
  $("#list-balance").innerHTML = rated ? `
    <div class="balance-bar">
      <span>⚖️ List balance:</span>
      <span class="fit-badge fit-Reach">${counts.Reach} Reach</span>
      <span class="fit-badge fit-Match">${counts.Match} Match</span>
      <span class="fit-badge fit-Safety">${counts.Safety} Safety</span>
      <span style="font-weight:600;color:var(--ink-soft)">${advice}</span>
    </div>` : "";

  $("#mylist-body").innerHTML = state.myList.map((c, i) => {
    const { chance, fit } = info(c.name);
    const reqs = c.reqs || {};
    const done = REQUIREMENTS.filter(([k]) => reqs[k]).length;
    return `
    <div class="mylist-item">
      <div class="mylist-head">
        <h3>${esc(c.name)}
          ${fit ? `<span class="fit-badge fit-${fit}">${fit}</span>` : ""}
          ${chance != null ? `<span class="mylist-chance">~${chance}% chance</span>` : ""}
        </h3>
        <button class="remove-btn" data-rm="${i}">Remove</button>
      </div>
      <div class="mylist-controls">
        <label>Status
          <select class="status-select" data-status="${i}">
            ${STATUSES.map((s) => `<option ${c.status === s ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </label>
        <label>Applying
          <select data-apptype="${i}">
            ${APP_TYPES.map((t) => `<option ${c.appType === t ? "selected" : ""}>${t}</option>`).join("")}
          </select>
        </label>
        <label>Deadline
          <input type="date" value="${esc(c.deadline)}" data-deadline="${i}">
        </label>
      </div>
      <details class="req-details" ${done > 0 && done < REQUIREMENTS.length ? "open" : ""}>
        <summary>📋 Application requirements
          <span class="req-sum-bar"><span class="req-sum-fill" style="width:${(done / REQUIREMENTS.length) * 100}%"></span></span>
          <span class="req-count">${done}/${REQUIREMENTS.length}</span>
        </summary>
        <div class="req-grid">
          ${REQUIREMENTS.map(([k, label]) => `
            <label class="req-row ${reqs[k] ? "done" : ""}">
              <input type="checkbox" data-req="${k}" data-idx="${i}" ${reqs[k] ? "checked" : ""}> ${esc(label)}
            </label>`).join("")}
        </div>
      </details>
    </div>`;
  }).join("");

  $$("#mylist-body [data-req]").forEach((cb) => cb.addEventListener("change", () => {
    const item = state.myList[Number(cb.dataset.idx)];
    item.reqs = item.reqs || {};
    item.reqs[cb.dataset.req] = cb.checked;
    save();
    cb.closest(".req-row").classList.toggle("done", cb.checked);
    const det = cb.closest(".req-details");
    const done = REQUIREMENTS.filter(([k]) => item.reqs[k]).length;
    det.querySelector(".req-count").textContent = `${done}/${REQUIREMENTS.length}`;
    det.querySelector(".req-sum-fill").style.width = (done / REQUIREMENTS.length) * 100 + "%";
    if (done === REQUIREMENTS.length) toast(`${item.name}: all requirements done! 🎉`);
  }));

  $$("#mylist-body [data-rm]").forEach((b) => b.addEventListener("click", () => {
    const removed = state.myList.splice(Number(b.dataset.rm), 1)[0];
    save(); toast(`${removed.name} removed`); renderColleges();
  }));
  $$("#mylist-body [data-status]").forEach((s) => s.addEventListener("change", () => {
    state.myList[Number(s.dataset.status)].status = s.value; save();
  }));
  $$("#mylist-body [data-apptype]").forEach((s) => s.addEventListener("change", () => {
    state.myList[Number(s.dataset.apptype)].appType = s.value; save();
  }));
  $$("#mylist-body [data-deadline]").forEach((inp) => inp.addEventListener("change", () => {
    state.myList[Number(inp.dataset.deadline)].deadline = inp.value; save();
  }));
}

function initColleges() {
  ["college-search", "college-fit-filter", "college-type-filter", "college-sort"].forEach((id) => {
    document.getElementById(id).addEventListener("input", renderColleges);
  });
  $$("#view-colleges .subtab").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$("#view-colleges .subtab").forEach((t) => t.classList.toggle("active", t === tab));
      $$("#view-colleges .subview").forEach((v) =>
        v.classList.toggle("active", v.id === "subview-" + tab.dataset.subtab));
    });
  });
}

// ============================================================
// ESSAY COACH
// ============================================================
function countWords(text) {
  return (text || "").trim().split(/\s+/).filter(Boolean).length;
}

function initEssay() {
  $("#essay-prompts").innerHTML = ESSAY_PROMPTS.map((p, i) => `
    <label class="prompt-opt ${state.essay.prompt === i ? "selected" : ""}">
      <input type="radio" name="prompt" value="${i}" ${state.essay.prompt === i ? "checked" : ""}>
      <span><strong>Prompt ${i + 1}.</strong> ${esc(p)}</span>
    </label>`).join("");

  $$("#essay-prompts input").forEach((r) => r.addEventListener("change", () => {
    state.essay.prompt = Number(r.value);
    save();
    $$("#essay-prompts .prompt-opt").forEach((el) =>
      el.classList.toggle("selected", el.querySelector("input").checked));
  }));

  $("#brainstorm-list").innerHTML = BRAINSTORM_QS.map((q) => `<li>${esc(q)}</li>`).join("");

  const draft = $("#essay-draft");
  draft.value = state.essay.draft;
  updateWordcount();
  let saveTimer;
  draft.addEventListener("input", () => {
    updateWordcount();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { state.essay.draft = draft.value; save(); }, 400);
  });

  $("#essay-feedback-btn").addEventListener("click", giveEssayFeedback);
}

function updateWordcount() {
  const n = countWords($("#essay-draft").value);
  const el = $("#essay-wordcount");
  el.textContent = `${n} / 650 words`;
  el.className = "wordcount " + (n > 650 ? "over" : n >= 450 ? "good" : "");
}

function giveEssayFeedback() {
  const text = $("#essay-draft").value;
  const n = countWords(text);
  const items = [];
  const add = (kind, icon, msg) => items.push({ kind, icon, msg });

  if (n === 0) { add("warn", "📝", "Nothing here yet! Start with one honest paragraph about a specific moment — you can shape it later."); }
  else if (n < 150) add("warn", "📝", `${n} words so far — keep going. Don't edit yet; get the whole story down first.`);
  else if (n <= 650) add("good", "✅", `${n} words — inside the 650 limit. ${n < 500 ? "You have room to add detail if you need it." : "Great length."}`);
  else add("bad", "✂️", `${n} words — that's ${n - 650} over the Common App limit. Cut ruthlessly: your weakest paragraph, not your favorite one.`);

  const found = CLICHE_TOPICS.filter((c) => c.pattern.test(text));
  found.forEach((c) => add("warn", "⚠️", c.label));
  if (n > 150 && !found.length) add("good", "✅", "No classic essay clichés detected — good sign.");

  if (n > 0) {
    const weak = WEAK_WORDS
      .map((w) => ({ w, count: (text.toLowerCase().match(new RegExp(`\\b${w.replace(" ", "\\s+")}\\b`, "g")) || []).length }))
      .filter((x) => x.count > 0);
    const total = weak.reduce((s, x) => s + x.count, 0);
    if (total >= 3) add("warn", "🔍", `Vague words to replace with specifics: ${weak.map((x) => `"${x.w}" ×${x.count}`).join(", ")}. "Amazing" tells; a detail shows.`);
  }

  if (n > 200) {
    const paras = text.split(/\n\s*\n/).filter((p) => p.trim());
    if (paras.length === 1) add("warn", "📐", "One giant paragraph — break it into 4–6. White space is your friend; readers skim.");
    const iCount = (text.match(/\bI\b/g) || []).length;
    if (iCount < n / 100) add("warn", "🪞", "This reads as more about the topic than about YOU. The essay's real subject is always you — your choices, changes, and voice.");
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 2);
    const avgLen = n / Math.max(sentences.length, 1);
    if (avgLen > 28) add("warn", "✏️", `Average sentence length is ~${Math.round(avgLen)} words — long. Mix in short sentences. They hit harder.`);
  }

  if (n > 400 && items.every((i) => i.kind === "good")) {
    add("good", "🌟", "Strong shape! Next step: read it out loud (you'll catch clunky lines instantly), then ask one adult and one friend: \"Does this sound like me?\"");
  }

  $("#essay-feedback").innerHTML = items
    .map((i) => `<div class="feedback-item ${i.kind}"><span>${i.icon}</span><span>${esc(i.msg)}</span></div>`).join("");
}

// ============================================================
// OPPORTUNITIES
// ============================================================
let oppTab = "programs";

function initOpps() {
  $$("#view-opps .subtab").forEach((tab) => {
    tab.addEventListener("click", () => {
      oppTab = tab.dataset.opptab;
      $$("#view-opps .subtab").forEach((t) => t.classList.toggle("active", t === tab));
      fillOppCategories();
      renderOpps();
    });
  });
  ["opp-search", "opp-cat-filter", "opp-cost-filter"].forEach((id) =>
    document.getElementById(id).addEventListener("input", renderOpps));
  fillOppCategories();
  renderOpps();
}

function fillOppCategories() {
  const items = oppTab === "programs" ? PROGRAMS : SCHOLARSHIPS;
  const cats = [...new Set(items.map((i) => i.cat))].sort();
  $("#opp-cat-filter").innerHTML = `<option value="all">All categories</option>` +
    cats.map((c) => `<option>${esc(c)}</option>`).join("");
}

function renderOpps() {
  const q = $("#opp-search").value.trim().toLowerCase();
  const cat = $("#opp-cat-filter").value;
  const cost = $("#opp-cost-filter").value;
  const isPrograms = oppTab === "programs";
  let items = isPrograms ? PROGRAMS : SCHOLARSHIPS;

  if (q) items = items.filter((i) => (i.name + " " + i.desc + " " + (i.who || "") + " " + (i.grades || "")).toLowerCase().includes(q));
  if (cat !== "all") items = items.filter((i) => i.cat === cat);
  if (cost === "free" && isPrograms) items = items.filter((i) => /free|paid to you/i.test(i.cost));

  $("#opp-list").innerHTML = items.length ? items.map((i) => `
    <div class="opp-card">
      <h3>${esc(i.name)}</h3>
      <div class="opp-meta">${isPrograms
        ? `${esc(i.grades)} · ${esc(i.when)}`
        : `${esc(i.who)} · ${esc(i.when)}`}</div>
      <p>${esc(i.desc)}</p>
      <div class="opp-badges">
        <span class="chip">${esc(i.cat)}</span>
        ${isPrograms
          ? `<span class="chip green">${esc(i.cost)}</span><span class="chip">${esc(i.sel)}</span>`
          : `<span class="chip green">${esc(i.amount)}</span>`}
      </div>
    </div>`).join("")
    : `<p class="empty-note">Nothing matches those filters.</p>`;
}

// ============================================================
// boot
// ============================================================
applyTheme();
initProfile();
initMajors();
initQuiz();
initCourses();
initColleges();
initEssay();
initOpps();
renderDashboard();
renderColleges();
