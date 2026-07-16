// ============================================================
// CALENDAR STORE — the events themselves.
//
// An event looks like:
// {
//   id: 'uuid',
//   title: 'Gym — leg day',
//   date: '2026-07-12',      // the day it's scheduled on
//   startTime: '18:00',      // '' means "any time that day"
//   durationMin: 60,
//   category: 'health',      // see CATEGORIES in game/config.js
//   difficulty: 'hard',      // easy | medium | hard | epic
//   notes: '',
//   xp: 85,                  // auto-calculated, stored so history is stable
//   completed: false,
//   completedAt: null,       // full ISO timestamp (for night-owl checks etc.)
//   completedDay: null,      // 'yyyy-MM-dd' local day (for streaks/quests)
// }
// ============================================================
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format, addDays } from 'date-fns'
import { appStorage, SAVE_VERSION } from './storage'
import { calcEventXp } from '../game/xp'
import { useGameStore } from './useGameStore'
import { play } from '../game/sound'

const uid = () => crypto.randomUUID()

export const useCalendarStore = create(
  persist(
    (set, get) => ({
      events: [],
      seeded: false, // did we already create the sample events?

      addEvent(data) {
        const event = {
          id: uid(),
          title: 'Untitled quest',
          date: format(new Date(), 'yyyy-MM-dd'),
          startTime: '',
          durationMin: 60,
          category: 'work',
          difficulty: 'medium',
          notes: '',
          completed: false,
          completedAt: null,
          completedDay: null,
          ...data,
        }
        // XP is always derived from difficulty + duration:
        event.xp = calcEventXp(event.difficulty, event.durationMin)
        set(s => ({ events: [...s.events, event] }))
        return event
      },

      updateEvent(id, patch) {
        set(s => ({
          events: s.events.map(e => {
            if (e.id !== id) return e
            const next = { ...e, ...patch }
            next.xp = calcEventXp(next.difficulty, next.durationMin)
            return next
          }),
        }))
      },

      deleteEvent(id) {
        set(s => ({ events: s.events.filter(e => e.id !== id) }))
      },

      /** Drag-and-drop reschedule: new day, optionally a new start time. */
      moveEvent(id, newDate, newStartTime) {
        set(s => ({
          events: s.events.map(e =>
            e.id === id
              ? { ...e, date: newDate, ...(newStartTime !== undefined ? { startTime: newStartTime } : {}) }
              : e,
          ),
        }))
        play('click')
      },

      /**
       * The heart of the game: completing an event.
       * `burstPos` is the screen {x, y} of the click, so the floating
       * XP number and confetti can erupt exactly where you tapped.
       */
      toggleComplete(id, burstPos) {
        const event = get().events.find(e => e.id === id)
        if (!event) return
        const game = useGameStore.getState()

        if (!event.completed) {
          const now = new Date()
          const patched = {
            completed: true,
            completedAt: now.toISOString(),
            completedDay: format(now, 'yyyy-MM-dd'),
          }
          set(s => ({ events: s.events.map(e => (e.id === id ? { ...e, ...patched } : e)) }))
          play('complete')
          game.grantXp(event.xp)
          if (burstPos) game.addBurst({ ...burstPos, amount: event.xp })
          game.checkAchievements(get().events)
        } else {
          // Un-completing takes the XP back — no farming the same task!
          set(s => ({
            events: s.events.map(e =>
              e.id === id ? { ...e, completed: false, completedAt: null, completedDay: null } : e,
            ),
          }))
          play('undo')
          game.grantXp(-event.xp)
        }
      },

      /** First-run sample events so the app doesn't start empty. */
      seedIfEmpty() {
        if (get().seeded || get().events.length > 0) return
        const today = new Date()
        const d = (offset) => format(addDays(today, offset), 'yyyy-MM-dd')
        const samples = [
          { title: 'Morning run',        date: d(0), startTime: '07:30', durationMin: 45,  category: 'health',   difficulty: 'medium' },
          { title: 'Study session',      date: d(0), startTime: '10:00', durationMin: 90,  category: 'learning', difficulty: 'hard' },
          { title: 'Clean the kitchen',  date: d(0), startTime: '',      durationMin: 30,  category: 'chores',   difficulty: 'easy' },
          { title: 'Project deep work',  date: d(1), startTime: '09:00', durationMin: 120, category: 'work',     difficulty: 'epic' },
          { title: 'Coffee with Sam',    date: d(1), startTime: '16:00', durationMin: 60,  category: 'social',   difficulty: 'easy' },
          { title: 'Sketch practice',    date: d(2), startTime: '19:00', durationMin: 60,  category: 'creative', difficulty: 'medium' },
          { title: 'Gym — strength',     date: d(3), startTime: '18:00', durationMin: 75,  category: 'health',   difficulty: 'hard' },
          { title: 'Read 30 pages',      date: d(4), startTime: '21:00', durationMin: 40,  category: 'learning', difficulty: 'easy' },
        ]
        samples.forEach(sample => get().addEvent(sample))
        set({ seeded: true })
      },

      /** Wipe the calendar (settings danger zone). */
      resetCalendar: () => set({ events: [], seeded: true }),
    }),
    {
      name: 'questcal-events',
      version: SAVE_VERSION,
      storage: appStorage,
      partialize: (s) => ({ events: s.events, seeded: s.seeded }),
    },
  ),
)
