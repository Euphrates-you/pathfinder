// ============================================================
// GAME STORE — the RPG brain: XP, levels, quests, achievements.
//
// Design rule: this store never touches calendar events directly.
// The calendar store calls into it ("I completed an event worth
// 40 XP, here's the new event list — react to it"). That keeps
// the two stores decoupled and easy to reason about.
// ============================================================
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format, subDays, parseISO } from 'date-fns'
import { appStorage, SAVE_VERSION } from './storage'
import { levelFromTotalXp, calcStreak } from '../game/xp'
import { ACHIEVEMENTS } from '../game/achievements'
import { rewardsBetween } from '../game/rewards'
import { play } from '../game/sound'

/** Current streak, derived fresh from the events array every time. */
export function streakFromEvents(events) {
  const days = new Set(
    events.filter(e => e.completed && e.completedDay).map(e => e.completedDay),
  )
  const now = new Date()
  return calcStreak(
    days,
    format(now, 'yyyy-MM-dd'),
    format(subDays(now, 1), 'yyyy-MM-dd'),
    d => format(subDays(parseISO(d), 1), 'yyyy-MM-dd'),
  )
}

let toastId = 0

export const useGameStore = create(
  persist(
    (set, get) => ({
      // ---- persisted state --------------------------------
      totalXp: 0,
      claimedQuests: {},        // { questKey: ISO date claimed }
      customQuests: [],         // player-defined long-term quests
      unlockedAchievements: {}, // { achievementId: ISO date unlocked }

      // ---- ephemeral state (not saved, see partialize) ----
      levelUp: null,   // { from, to, rewards } → triggers full-screen overlay
      toasts: [],      // achievement popups
      xpBursts: [],    // floating "+40 XP" numbers { id, x, y, amount }

      /**
       * Add (or remove, if negative) XP. Detects level-ups and
       * queues the celebration overlay with any new cosmetic unlocks.
       */
      grantXp(amount) {
        const before = levelFromTotalXp(get().totalXp)
        const totalXp = Math.max(0, get().totalXp + amount)
        const after = levelFromTotalXp(totalXp)
        set({ totalXp })
        if (after.level > before.level) {
          play('levelup')
          set({
            levelUp: {
              from: before.level,
              to: after.level,
              rewards: rewardsBetween(before.level, after.level),
            },
          })
        }
        // Leveling DOWN (un-completing an event) is silent on purpose.
      },

      dismissLevelUp: () => set({ levelUp: null }),

      /** Floating "+XP" number at screen position (x, y). */
      addBurst({ x, y, amount }) {
        const id = ++toastId
        set(s => ({ xpBursts: [...s.xpBursts, { id, x, y, amount }] }))
        setTimeout(() => {
          set(s => ({ xpBursts: s.xpBursts.filter(b => b.id !== id) }))
        }, 1400)
      },

      /** Claim a finished quest's XP (each quest key claimable once). */
      claimQuest(questKey, xp, events) {
        if (get().claimedQuests[questKey]) return
        set(s => ({
          claimedQuests: { ...s.claimedQuests, [questKey]: new Date().toISOString() },
        }))
        play('claim')
        get().grantXp(xp)
        get().checkAchievements(events)
      },

      addCustomQuest(quest) {
        set(s => ({ customQuests: [...s.customQuests, quest] }))
      },
      removeCustomQuest(id) {
        set(s => ({ customQuests: s.customQuests.filter(q => q.id !== id) }))
      },

      /**
       * Scan all achievement definitions and unlock any newly earned.
       * Runs up to 3 passes because unlocks grant XP, which can raise
       * your level, which can unlock *level* achievements in cascade.
       */
      checkAchievements(events) {
        for (let pass = 0; pass < 3; pass++) {
          const s = get()
          const ctx = {
            events,
            completed: events.filter(e => e.completed),
            level: levelFromTotalXp(s.totalXp).level,
            streak: streakFromEvents(events),
            claimedQuests: Object.keys(s.claimedQuests).length,
          }
          const fresh = ACHIEVEMENTS.filter(
            a => !s.unlockedAchievements[a.id] && a.check(ctx),
          )
          if (fresh.length === 0) return

          const now = new Date().toISOString()
          const unlocked = { ...s.unlockedAchievements }
          for (const a of fresh) unlocked[a.id] = now
          set({ unlockedAchievements: unlocked })

          for (const a of fresh) {
            play('badge')
            const id = ++toastId
            set(st => ({ toasts: [...st.toasts, { id, achievementId: a.id }] }))
            get().grantXp(a.xp)
          }
        }
      },

      popToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),

      /** Wipe all progress (used by the settings danger zone). */
      resetGame: () => set({
        totalXp: 0, claimedQuests: {}, customQuests: [], unlockedAchievements: {},
        levelUp: null, toasts: [], xpBursts: [],
      }),
    }),
    {
      name: 'questcal-game',
      version: SAVE_VERSION,
      storage: appStorage,
      // Only save durable progress — celebrations don't survive reloads.
      partialize: (s) => ({
        totalXp: s.totalXp,
        claimedQuests: s.claimedQuests,
        customQuests: s.customQuests,
        unlockedAchievements: s.unlockedAchievements,
      }),
    },
  ),
)
