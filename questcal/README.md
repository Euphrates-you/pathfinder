# QuestCal — your life, but it's an RPG

A personal productivity calendar that plays like a game: completing events
earns XP, levels you up, feeds quests and streaks, and unlocks cosmetics.

## Run it

```bash
npm install
npm run dev        # opens on http://localhost:5173
```

> Node.js lives at `C:\Users\RyanY\.tools\node-v24.18.0-win-x64` on this
> machine (portable install, already on your user PATH — new terminals will
> find `node` and `npm` automatically).

## How it's organized

```
src/
  game/          The rules of the game — pure logic, no UI
    config.js      ← every balance number (XP, level curve, rewards). Tune here!
    xp.js          XP math: event XP, level curve, streak calculation
    quests.js      daily/weekly quest pools + custom quest tracking
    achievements.js  badge definitions as data (add a badge = add an entry)
    rewards.js     what each level unlocks (themes, accents, frames)
    sound.js       tiny Web-Audio synthesizer (no audio files)
  stores/        App state (Zustand), persisted to localStorage
    storage.js     the ONE place that decides where data is saved —
                   swap this adapter to add a backend later
    useCalendarStore.js  events + complete/uncomplete (grants/refunds XP)
    useGameStore.js      XP total, claims, achievements, level-up events
    useSettingsStore.js  theme, accent, font, density, mute
    useUiStore.js        page, calendar view, modal state (not persisted)
  themes/        Theme metadata (colors live in src/index.css as CSS vars)
  components/
    hud/           header: avatar, XP bar, streak flame, nav
    calendar/      month/week/day views, event modal, complete button
    quests/        quest log page
    achievements/  trophy shelf
    settings/      customization page
    fx/            juice: level-up overlay, XP bursts, achievement toasts
```

## Game rules (current tuning)

- **Event XP** = difficulty base (Easy 20 / Medium 40 / Hard 75 / Epic 130)
  + 5 XP per 30 min of duration (capped at +40)
- **Level curve**: XP to next level = `100 × level^1.5` — fast early, slower later
- **Streak**: consecutive days with ≥1 completed event (alive until midnight)
- **Un-completing an event takes its XP back** — no farming!
- Daily quests rotate at midnight, weeklies on Monday; both are picked
  deterministically from pools in `game/quests.js`
- Custom quests auto-track completed events by category

All of these are numbers in `src/game/config.js` — change them and the whole
game rebalances.

## Debugging

In dev, the stores are exposed on `window.qc` — try in the browser console:

```js
qc.game.getState().totalXp
qc.calendar.getState().events
```
