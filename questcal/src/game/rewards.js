// ============================================================
// LEVEL REWARDS — cosmetics unlocked by leveling up.
// The settings page checks this list to decide what's locked,
// and the level-up overlay uses it to announce new unlocks.
// ============================================================

export const LEVEL_REWARDS = [
  { level: 2,  type: 'theme',  id: 'minimal',    name: 'Clean Minimal theme' },
  { level: 3,  type: 'accent', id: 'ember',      name: 'Ember accent color' },
  { level: 3,  type: 'frame',  id: 'bronze',     name: 'Bronze avatar frame' },
  { level: 4,  type: 'theme',  id: 'cyberpunk',  name: 'Cyberpunk Neon theme' },
  { level: 5,  type: 'accent', id: 'gold',       name: 'Gold accent color' },
  { level: 6,  type: 'frame',  id: 'silver',     name: 'Silver avatar frame' },
  { level: 7,  type: 'theme',  id: 'pixel',      name: 'Cozy Pixel theme' },
  { level: 10, type: 'frame',  id: 'gold',       name: 'Gold avatar frame' },
  { level: 12, type: 'accent', id: 'emerald',    name: 'Emerald accent color' },
  { level: 15, type: 'frame',  id: 'mythic',     name: 'Mythic avatar frame' },
]

/** Everything unlocked at or below `level`. */
export function unlockedRewards(level) {
  return LEVEL_REWARDS.filter(r => r.level <= level)
}

/** Rewards gained when climbing from level `from` to `to` (exclusive/inclusive). */
export function rewardsBetween(from, to) {
  return LEVEL_REWARDS.filter(r => r.level > from && r.level <= to)
}

/** Is one specific cosmetic unlocked yet? */
export function isRewardUnlocked(type, id, level) {
  const r = LEVEL_REWARDS.find(r => r.type === type && r.id === id)
  return !r || r.level <= level // things not in the list are free
}
