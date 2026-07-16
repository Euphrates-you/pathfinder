// ============================================================
// GAME BALANCE CONFIG
// Every number that affects "how the game feels" lives here,
// so you can tune the whole game from one file.
// ============================================================

// ---- Difficulty tiers -------------------------------------
// baseXp   : XP granted just for completing an event of this tier
// color    : used for badges / chips (works on every theme)
// rank     : Solo-Leveling-style gate rank shown in the UI
export const DIFFICULTY = {
  easy:   { label: 'Easy',   baseXp: 20,  color: '#4ade80', rank: 'E', rankColor: '#9aa7bd' },
  medium: { label: 'Medium', baseXp: 40,  color: '#60a5fa', rank: 'C', rankColor: '#38bdf8' },
  hard:   { label: 'Hard',   baseXp: 75,  color: '#fb923c', rank: 'A', rankColor: '#fb7185' },
  epic:   { label: 'Epic',   baseXp: 130, color: '#e879f9', rank: 'S', rankColor: '#fcd34d' },
}

// Longer events give a small XP bonus so a 2h workout beats a 15min one.
export const DURATION_XP_PER_30MIN = 5   // +5 XP per half hour...
export const DURATION_XP_CAP = 40        // ...but never more than +40

// ---- Level curve ------------------------------------------
// XP needed to go from level N to N+1 = LEVEL_BASE_XP * N ^ LEVEL_GROWTH
// (rounded to the nearest 10). Growth > 1 means early levels are fast
// and later levels slow down — the classic RPG feel.
export const LEVEL_BASE_XP = 100
export const LEVEL_GROWTH = 1.5
export const LEVEL_CAP = 99

// ---- Streaks ----------------------------------------------
// Days in a row with at least one completed event.
// Milestones are granted through achievements (see achievements.js).
export const STREAK_MILESTONES = [3, 7, 14, 30]

// ---- Quest rewards ----------------------------------------
export const QUEST_XP = {
  daily: 50,        // default XP for a daily quest
  weekly: 120,      // default XP for a weekly quest
  customPerStep: 25 // custom quests pay out target × this
}
export const DAILY_QUEST_COUNT = 3   // how many dailies you get per day
export const WEEKLY_QUEST_COUNT = 2  // how many weeklies per week

// ---- Event categories -------------------------------------
export const CATEGORIES = {
  work:     { label: 'Work',     color: '#60a5fa' },
  health:   { label: 'Health',   color: '#34d399' },
  learning: { label: 'Learning', color: '#c084fc' },
  social:   { label: 'Social',   color: '#f472b6' },
  chores:   { label: 'Chores',   color: '#fbbf24' },
  creative: { label: 'Creative', color: '#fb923c' },
}

// Week starts on Monday everywhere in the app (date-fns option).
export const WEEK_STARTS_ON = 1
