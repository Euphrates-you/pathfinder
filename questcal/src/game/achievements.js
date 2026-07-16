// ============================================================
// ACHIEVEMENTS — defined as pure data + a check() function.
// To add a new badge, just add an entry here. Nothing else
// in the app needs to change; the trophy shelf and the unlock
// checker both read this list.
//
// check(ctx) receives:
//   ctx.events     — all calendar events
//   ctx.completed  — only completed events
//   ctx.level      — current level
//   ctx.streak     — current day streak
//   ctx.claimedQuests — number of quests claimed
// ============================================================

export const ACHIEVEMENTS = [
  {
    id: 'first-blood', name: 'First Blood', icon: 'Sword',
    desc: 'Complete your first event', xp: 25, tier: 'bronze',
    check: c => c.completed.length >= 1,
  },
  {
    id: 'ten-down', name: 'Getting Serious', icon: 'Swords',
    desc: 'Complete 10 events', xp: 50, tier: 'bronze',
    check: c => c.completed.length >= 10,
  },
  {
    id: 'fifty-down', name: 'Veteran', icon: 'Shield',
    desc: 'Complete 50 events', xp: 150, tier: 'silver',
    check: c => c.completed.length >= 50,
  },
  {
    id: 'centurion', name: 'Centurion', icon: 'Crown',
    desc: 'Complete 100 events', xp: 300, tier: 'gold',
    check: c => c.completed.length >= 100,
  },
  {
    id: 'streak-3', name: 'Kindling', icon: 'Flame',
    desc: '3-day streak', xp: 40, tier: 'bronze',
    check: c => c.streak >= 3,
  },
  {
    id: 'streak-7', name: 'On Fire', icon: 'Flame',
    desc: '7-day streak', xp: 100, tier: 'silver',
    check: c => c.streak >= 7,
  },
  {
    id: 'streak-14', name: 'Inferno', icon: 'Flame',
    desc: '14-day streak', xp: 200, tier: 'gold',
    check: c => c.streak >= 14,
  },
  {
    id: 'streak-30', name: 'Eternal Flame', icon: 'Flame',
    desc: '30-day streak', xp: 500, tier: 'epic',
    check: c => c.streak >= 30,
  },
  {
    id: 'level-5', name: 'Apprentice', icon: 'Star',
    desc: 'Reach level 5', xp: 75, tier: 'bronze',
    check: c => c.level >= 5,
  },
  {
    id: 'level-10', name: 'Adept', icon: 'Sparkles',
    desc: 'Reach level 10', xp: 150, tier: 'silver',
    check: c => c.level >= 10,
  },
  {
    id: 'level-20', name: 'Master', icon: 'Gem',
    desc: 'Reach level 20', xp: 400, tier: 'epic',
    check: c => c.level >= 20,
  },
  {
    id: 'epic-slayer', name: 'Epic Slayer', icon: 'Zap',
    desc: 'Complete an Epic task', xp: 80, tier: 'silver',
    check: c => c.completed.some(e => e.difficulty === 'epic'),
  },
  {
    id: 'night-owl', name: 'Night Owl', icon: 'Moon',
    desc: 'Complete a task after 10 PM', xp: 30, tier: 'bronze',
    check: c => c.completed.some(e => e.completedAt && new Date(e.completedAt).getHours() >= 22),
  },
  {
    id: 'early-bird', name: 'Early Bird', icon: 'Sunrise',
    desc: 'Complete a task before 7 AM', xp: 30, tier: 'bronze',
    check: c => c.completed.some(e => e.completedAt && new Date(e.completedAt).getHours() < 7),
  },
  {
    id: 'quest-taster', name: 'Quest Taster', icon: 'Scroll',
    desc: 'Claim your first quest reward', xp: 25, tier: 'bronze',
    check: c => c.claimedQuests >= 1,
  },
  {
    id: 'quest-master', name: 'Quest Master', icon: 'ScrollText',
    desc: 'Claim 10 quest rewards', xp: 120, tier: 'silver',
    check: c => c.claimedQuests >= 10,
  },
  {
    id: 'big-day', name: 'Clean Sweep', icon: 'Trophy',
    desc: 'Complete 5 events in a single day', xp: 90, tier: 'silver',
    check: c => {
      const perDay = {}
      for (const e of c.completed) {
        if (!e.completedDay) continue
        perDay[e.completedDay] = (perDay[e.completedDay] || 0) + 1
        if (perDay[e.completedDay] >= 5) return true
      }
      return false
    },
  },
]

// Visual style per tier (used by the trophy shelf).
export const TIER_STYLE = {
  bronze: { label: 'Bronze', color: '#d08a4e' },
  silver: { label: 'Silver', color: '#b6c2d9' },
  gold:   { label: 'Gold',   color: '#fbbf24' },
  epic:   { label: 'Epic',   color: '#e879f9' },
}
