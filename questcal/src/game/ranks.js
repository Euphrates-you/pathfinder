// ============================================================
// HUNTER RANKS & STATS — the Solo-Leveling layer.
// Your level maps to a Hunter rank (E → S), and your completed
// events feed six stats, one per event category.
// ============================================================
import { CATEGORIES } from './config'

// Rank thresholds. Each entry: minimum level + signature color.
export const HUNTER_RANKS = [
  { id: 'E', name: 'E-Rank', min: 1,  color: '#9aa7bd' },
  { id: 'D', name: 'D-Rank', min: 5,  color: '#4ade80' },
  { id: 'C', name: 'C-Rank', min: 10, color: '#38bdf8' },
  { id: 'B', name: 'B-Rank', min: 15, color: '#a78bfa' },
  { id: 'A', name: 'A-Rank', min: 20, color: '#fb7185' },
  { id: 'S', name: 'S-Rank', min: 30, color: '#fcd34d' },
]

/** The highest rank whose minimum level you've reached. */
export function rankForLevel(level) {
  let rank = HUNTER_RANKS[0]
  for (const r of HUNTER_RANKS) if (level >= r.min) rank = r
  return rank
}

// Which stat each event category trains.
export const STATS = [
  { id: 'str', label: 'Strength',     category: 'health' },
  { id: 'int', label: 'Intelligence', category: 'learning' },
  { id: 'foc', label: 'Focus',        category: 'work' },
  { id: 'cha', label: 'Charisma',     category: 'social' },
  { id: 'vit', label: 'Vitality',     category: 'chores' },
  { id: 'dex', label: 'Dexterity',    category: 'creative' },
]

/**
 * Compute stat values from completed events.
 * Every stat starts at 10 (a normal human) and gains +1 per 40 XP
 * earned in its category — complete things to literally get stronger.
 */
export function calcStats(events, level) {
  const xpByCategory = {}
  for (const e of events) {
    if (!e.completed) continue
    xpByCategory[e.category] = (xpByCategory[e.category] || 0) + (e.xp || 0)
  }
  return STATS.map(s => {
    const xp = xpByCategory[s.category] || 0
    return {
      ...s,
      xp,
      value: 10 + level + Math.floor(xp / 40),
      color: CATEGORIES[s.category]?.color ?? 'var(--accent)',
    }
  })
}
