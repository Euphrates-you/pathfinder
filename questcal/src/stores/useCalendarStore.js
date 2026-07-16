// ============================================================
// CALENDAR STORE — the events themselves.
//
// An event looks like:
// {
//   id: 'uuid',
//   kind: 'quest',           // 'quest' = completable task that earns XP
//                            // 'event' = plain schedule entry (class,
//                            //   appointment) — no XP, no checkbox
//   title: 'Gym — leg day',
//   date: '2026-07-12',      // the day it's scheduled on
//   startTime: '18:00',      // '' means "any time that day"
//   durationMin: 60,
//   category: 'health',      // see CATEGORIES in game/config.js
//   difficulty: 'hard',      // easy | medium | hard | epic (quests only)
//   notes: '',
//   xp: 85,                  // auto-calculated (0 for plain events)
//   completed: false,
//   completedAt: null,       // full ISO timestamp (for night-owl checks etc.)
//   completedDay: null,      // 'yyyy-MM-dd' local day (for streaks/quests)
// }
// Saves from before the kind field existed have no `kind` — treat
// missing as 'quest' everywhere (isQuest helper below).
// ============================================================
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format, addDays } from 'date-fns'
import { appStorage, SAVE_VERSION } from './storage'
import { calcEventXp, calcAttendanceXp } from '../game/xp'
import { useGameStore } from './useGameStore'
import { play } from '../game/sound'

const uid = () => crypto.randomUUID()

/** Older saves have no `kind` — anything not explicitly 'event' is a quest. */
export const isQuest = (e) => e.kind !== 'event'

export const useCalendarStore = create(
  persist(
    (set, get) => ({
      events: [],
      seeded: false, // did we already create the sample events?

      addEvent(data) {
        const event = {
          id: uid(),
          kind: 'quest',
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
        // Quests derive XP from difficulty + duration; plain events earn
        // attendance XP (paid out automatically when their day ends).
        event.xp = isQuest(event)
          ? calcEventXp(event.difficulty, event.durationMin)
          : calcAttendanceXp(event.durationMin)
        set(s => ({ events: [...s.events, event] }))
        return event
      },

      updateEvent(id, patch) {
        set(s => ({
          events: s.events.map(e => {
            if (e.id !== id) return e
            const next = { ...e, ...patch }
            next.xp = isQuest(next)
              ? calcEventXp(next.difficulty, next.durationMin)
              : calcAttendanceXp(next.durationMin)
            // Changing the kind of an already-completed entry would strand
            // its granted XP — refund it and clear the completion. Quests
            // can be re-checked; past events re-settle on the next sweep.
            if (isQuest(next) !== isQuest(e) && e.completed) {
              useGameStore.getState().grantXp(-e.xp)
              next.completed = false
              next.completedAt = null
              next.completedDay = null
            }
            return next
          }),
        }))
      },

      /**
       * Auto-settle plain events whose day has ended: mark them completed
       * and pay their attendance XP. Runs on app load and once a minute,
       * so it also fires if the app is left open past midnight.
       */
      settleEvents() {
        const todayKey = format(new Date(), 'yyyy-MM-dd')
        const due = get().events.filter(e => !isQuest(e) && !e.completed && e.date < todayKey)
        if (due.length === 0) return 0

        const dueIds = new Set(due.map(e => e.id))
        set(s => ({
          events: s.events.map(e => dueIds.has(e.id)
            ? {
                ...e,
                completed: true,
                // Anchor the timestamp to the event's own start (or midday)
                // so time-based achievements reflect when it happened.
                completedAt: `${e.date}T${e.startTime || '12:00'}:00`,
                completedDay: e.date,
              }
            : e),
        }))

        const game = useGameStore.getState()
        for (const e of due) game.grantXp(e.xp)
        game.checkAchievements(get().events)
        return due.length
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
        if (!event || !isQuest(event)) return // plain events can't be completed
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
