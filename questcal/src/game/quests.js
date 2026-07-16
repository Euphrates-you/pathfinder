// ============================================================
// QUESTS
// Daily & weekly quests are picked from template pools using a
// seed derived from the date — so everyone gets the same quests
// for a given day, they rotate automatically, and nothing needs
// to be stored except which ones you've claimed.
//
// Progress is always COMPUTED from your events (never stored),
// so it can't drift out of sync with the calendar.
// ============================================================
import {
  format, startOfWeek, endOfWeek, isWithinInterval, parseISO,
} from 'date-fns'
import { QUEST_XP, DAILY_QUEST_COUNT, WEEKLY_QUEST_COUNT, WEEK_STARTS_ON, CATEGORIES } from './config'

// --- tiny seeded picker ------------------------------------
// Turns a string like '2026-07-12' into a number, then uses it
// to pick N stable-but-different items from a pool.
function hashString(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

function seededPick(pool, count, seedStr) {
  const items = [...pool]
  const picked = []
  let seed = hashString(seedStr)
  while (picked.length < count && items.length > 0) {
    seed = (seed * 1103515245 + 12345) % 2147483647
    picked.push(items.splice(seed % items.length, 1)[0])
  }
  return picked
}

// --- helpers over the events array -------------------------
const completedOnDay = (events, dayKey) =>
  events.filter(e => e.completed && e.completedDay === dayKey)

const completedInWeek = (events, anyDayInWeek) => {
  const start = startOfWeek(anyDayInWeek, { weekStartsOn: WEEK_STARTS_ON })
  const end = endOfWeek(anyDayInWeek, { weekStartsOn: WEEK_STARTS_ON })
  return events.filter(e =>
    e.completed && e.completedDay &&
    isWithinInterval(parseISO(e.completedDay), { start, end }))
}

// --- DAILY QUEST POOL ---------------------------------------
// Each template: id, name, desc, target, and a progress(events, dayKey)
// function that returns how far along the player is.
const DAILY_POOL = [
  {
    id: 'slay3', name: 'Task Slayer', desc: 'Complete 3 tasks today', target: 3,
    progress: (ev, day) => completedOnDay(ev, day).length,
  },
  {
    id: 'hard1', name: 'Face the Beast', desc: 'Complete a Hard or Epic task today', target: 1,
    progress: (ev, day) =>
      completedOnDay(ev, day).filter(e => e.difficulty === 'hard' || e.difficulty === 'epic').length,
  },
  {
    id: 'dawn', name: 'Dawn Raid', desc: 'Complete a task before 10:00 AM', target: 1,
    progress: (ev, day) =>
      completedOnDay(ev, day).filter(e => e.completedAt && new Date(e.completedAt).getHours() < 10).length,
  },
  {
    id: 'variety', name: 'Jack of Trades', desc: 'Complete tasks in 2 different categories', target: 2,
    progress: (ev, day) => new Set(completedOnDay(ev, day).map(e => e.category)).size,
  },
  {
    id: 'focus90', name: 'Deep Focus', desc: 'Complete 90 minutes of scheduled time', target: 90,
    unit: 'min',
    progress: (ev, day) => completedOnDay(ev, day).reduce((sum, e) => sum + (e.durationMin || 0), 0),
  },
  {
    id: 'clean1', name: 'First Strike', desc: 'Complete any task today', target: 1,
    progress: (ev, day) => completedOnDay(ev, day).length,
  },
]

// --- WEEKLY QUEST POOL --------------------------------------
const WEEKLY_POOL = [
  {
    id: 'hard5', name: 'Monster Hunter', desc: 'Complete 5 Hard or Epic events this week', target: 5,
    progress: (ev, day) =>
      completedInWeek(ev, day).filter(e => e.difficulty === 'hard' || e.difficulty === 'epic').length,
  },
  {
    id: 'twelve', name: 'Dozen Down', desc: 'Complete 12 events this week', target: 12,
    progress: (ev, day) => completedInWeek(ev, day).length,
  },
  {
    id: 'spread5', name: 'Marathon, Not Sprint', desc: 'Complete tasks on 5 different days this week', target: 5,
    progress: (ev, day) => new Set(completedInWeek(ev, day).map(e => e.completedDay)).size,
  },
  {
    id: 'xp500', name: 'Power Grind', desc: 'Earn 500 XP from events this week', target: 500,
    unit: 'XP',
    progress: (ev, day) => completedInWeek(ev, day).reduce((sum, e) => sum + (e.xp || 0), 0),
  },
]

/**
 * Get today's quests with live progress.
 * Each result: { key, name, desc, target, current, done, xp }
 * `key` (e.g. "daily:2026-07-12:slay3") is what gets stored when claimed.
 */
export function getDailyQuests(events, date = new Date()) {
  const dayKey = format(date, 'yyyy-MM-dd')
  return seededPick(DAILY_POOL, DAILY_QUEST_COUNT, dayKey).map(q => {
    const current = Math.min(q.target, q.progress(events, dayKey))
    return {
      key: `daily:${dayKey}:${q.id}`,
      kind: 'daily',
      name: q.name, desc: q.desc, unit: q.unit,
      target: q.target, current, done: current >= q.target,
      xp: QUEST_XP.daily,
    }
  })
}

/** Same idea, seeded by the ISO week (e.g. "2026-W28"). */
export function getWeeklyQuests(events, date = new Date()) {
  const weekKey = format(date, "RRRR-'W'II") // ISO week-year + week number
  return seededPick(WEEKLY_POOL, WEEKLY_QUEST_COUNT, weekKey).map(q => {
    const current = Math.min(q.target, q.progress(events, date))
    return {
      key: `weekly:${weekKey}:${q.id}`,
      kind: 'weekly',
      name: q.name, desc: q.desc, unit: q.unit,
      target: q.target, current, done: current >= q.target,
      xp: QUEST_XP.weekly,
    }
  })
}

/**
 * Custom long-term quests are created by the player and stored in the
 * game store as { id, name, category, target, startDay, endDay }.
 * They auto-track completed events whose category matches.
 */
export function getCustomQuestProgress(quest, events) {
  const matches = events.filter(e =>
    e.completed && e.completedDay &&
    e.completedDay >= quest.startDay && e.completedDay <= quest.endDay &&
    (quest.category === 'any' || e.category === quest.category))
  const current = Math.min(quest.target, matches.length)
  const catLabel = quest.category === 'any' ? 'task' : CATEGORIES[quest.category]?.label
  return {
    key: `custom:${quest.id}`,
    kind: 'custom',
    name: quest.name,
    desc: `${quest.target}× ${catLabel} by ${quest.endDay}`,
    target: quest.target, current, done: current >= quest.target,
    xp: quest.target * QUEST_XP.customPerStep,
    quest, // keep the raw quest around for the delete button
  }
}
