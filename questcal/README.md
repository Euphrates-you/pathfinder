# QuestCal — your life, but it's an RPG

A personal productivity calendar that plays like a Solo-Leveling-style game:
completing events earns XP, levels you from E-Rank to S-Rank Student, feeds
quests and streaks, and unlocks themes — all wrapped in a holographic
glass "System" UI. Includes an in-app AI assistant powered by the Claude API.

## Run it

```bash
npm install
npm run dev        # opens on http://localhost:5173
```

Requires Node.js 20+.

## Features

- **Calendar** — month / week / day views, drag-and-drop rescheduling,
  event modal with live XP preview and gate ranks (E/C/A/S)
- **Game systems** — XP & levels, Student ranks, daily/weekly/custom quests,
  streaks, 17 achievements, level-gated cosmetics
- **Status window** — six stats (STR/INT/FOC/CHA/VIT/DEX) trained by the
  event categories you actually complete
- **Themes** — The System (default), Dark Fantasy, Clean Minimal,
  Cyberpunk Neon, Cozy Pixel — all CSS variables, some level-locked
- **System Assistant** — a Claude-powered agent (sparkle button) that
  creates/moves/completes events, expands "every Monday" into real dates,
  starts quests, and changes settings. Bring your own Anthropic API key —
  it's stored only in your browser's localStorage.
- **Juice** — confetti, floating XP numbers, Web-Audio sound effects,
  full-screen level-up + rank-up celebrations

## How it's organized

```
src/
  game/          The rules of the game — pure logic, no UI
    config.js      ← every balance number (XP, level curve, rewards). Tune here!
    xp.js          XP math: event XP, level curve, streak calculation
    ranks.js       Student ranks E→S + category-trained stats
    quests.js      daily/weekly quest pools + custom quest tracking
    achievements.js  badge definitions as data (add a badge = add an entry)
    rewards.js     what each level unlocks (themes, accents, frames)
    assistant.js   the Claude agent: tools, system prompt, tool-use loop
    sound.js       tiny Web-Audio synthesizer (no audio files)
  stores/        App state (Zustand), persisted to localStorage
    storage.js     the ONE place that decides where data is saved
  themes/        Theme metadata (colors live in src/index.css as CSS vars)
  components/    HUD, calendar views, quests, trophies, status, settings,
                 assistant panel, and fx/ (level-up overlay, toasts, bursts)
```

## Game rules (current tuning)

- **Event XP** = difficulty base (Easy 20 / Medium 40 / Hard 75 / Epic 130)
  + 5 XP per 30 min of duration (capped at +40)
- **Level curve**: XP to next level = `100 × level^1.5` — fast early, slower later
- **Streak**: consecutive days with ≥1 completed event (alive until midnight)
- **Un-completing an event takes its XP back** — no farming!
- Daily quests rotate at midnight, weeklies on Monday; custom quests
  auto-track completed events by category

All of these are numbers in `src/game/config.js` — change them and the whole
game rebalances.

## Builds

```bash
npm run build            # normal production build → dist/
npm run build:artifact   # single-file offline build → dist/artifact.html
```

The artifact build inlines all JS/CSS and embeds the fonts, producing one
self-contained HTML file (the AI assistant is disabled there since sandboxed
pages can't reach the network).

## Debugging

In dev, the stores are exposed on `window.qc` — try in the browser console:

```js
qc.game.getState().totalXp
qc.calendar.getState().events
```
