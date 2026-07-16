// ============================================================
// XP MATH — pure functions, no state.
// "Pure" means: same input always gives the same output,
// which makes this file trivial to test and reason about.
// ============================================================
import {
  DIFFICULTY, DURATION_XP_PER_30MIN, DURATION_XP_CAP, EVENT_ATTENDANCE_XP,
  LEVEL_BASE_XP, LEVEL_GROWTH, LEVEL_CAP,
} from './config'

const durationBonus = (durationMin) =>
  Math.min(DURATION_XP_CAP, Math.floor((durationMin || 0) / 30) * DURATION_XP_PER_30MIN)

/** XP reward for a quest, from its difficulty + duration. */
export function calcEventXp(difficulty, durationMin = 0) {
  const base = DIFFICULTY[difficulty]?.baseXp ?? DIFFICULTY.medium.baseXp
  return base + durationBonus(durationMin)
}

/** XP for attending a plain event — granted automatically at day's end. */
export function calcAttendanceXp(durationMin = 0) {
  return EVENT_ATTENDANCE_XP + durationBonus(durationMin)
}

/** XP needed to climb from `level` to `level + 1`. */
export function xpForNextLevel(level) {
  const raw = LEVEL_BASE_XP * Math.pow(level, LEVEL_GROWTH)
  return Math.round(raw / 10) * 10 // round to a friendly number
}

/**
 * Convert a lifetime XP total into level info:
 *   { level, into (XP earned inside this level), needed (to next), progress (0..1) }
 */
export function levelFromTotalXp(totalXp) {
  let level = 1
  let remaining = Math.max(0, totalXp)
  while (level < LEVEL_CAP && remaining >= xpForNextLevel(level)) {
    remaining -= xpForNextLevel(level)
    level++
  }
  const needed = xpForNextLevel(level)
  return { level, into: remaining, needed, progress: Math.min(1, remaining / needed) }
}

/**
 * Current streak: consecutive days (ending today or yesterday) that have
 * at least one completed event. "Ending yesterday" keeps the flame alive
 * until midnight — you haven't broken the streak just because it's 9am.
 * `dayKeys` is a Set of 'yyyy-MM-dd' strings for days with completions.
 */
export function calcStreak(dayKeys, todayKey, yesterdayKey, prevDayOf) {
  let cursor = null
  if (dayKeys.has(todayKey)) cursor = todayKey
  else if (dayKeys.has(yesterdayKey)) cursor = yesterdayKey
  if (!cursor) return 0

  let streak = 0
  while (dayKeys.has(cursor)) {
    streak++
    cursor = prevDayOf(cursor)
  }
  return streak
}
