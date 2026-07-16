// ============================================================
// DAY VIEW — single-day timeline plus a "quest log" side panel
// with big, satisfying complete buttons and the day's loot.
// ============================================================
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { Plus, Swords, CalendarDays } from 'lucide-react'
import { useCalendarStore, isQuest } from '../../stores/useCalendarStore'
import { useUiStore } from '../../stores/useUiStore'
import { CATEGORIES, DIFFICULTY } from '../../game/config'
import TimeGrid from './TimeGrid'
import CompleteButton from './CompleteButton'

function LogRow({ event, index }) {
  const openEditEvent = useUiStore(s => s.openEditEvent)
  const cat = CATEGORIES[event.category] ?? CATEGORIES.work
  const diff = DIFFICULTY[event.difficulty] ?? DIFFICULTY.medium

  return (
    <motion.li
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2, ease: 'easeOut' }}
    >
      {/* A div (not a button) because it CONTAINS the complete button —
          nested <button>s are invalid HTML. Keyboard: Enter opens edit. */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => openEditEvent(event.id)}
        onKeyDown={(e) => { if (e.key === 'Enter') openEditEvent(event.id) }}
        className={`hover-lift w-full flex items-center gap-3 p-2.5 rounded-xl border border-edge bg-surface hover:bg-surface-2
          cursor-pointer text-left ${event.completed ? 'opacity-60' : ''}`}
      >
        {isQuest(event) ? (
          <CompleteButton event={event} size={26} />
        ) : (
          <span className="grid place-items-center size-[26px] shrink-0 text-ink-muted" aria-hidden>
            <CalendarDays size={17} />
          </span>
        )}
        <span className="flex-1 min-w-0">
          <span className={`block font-medium text-sm text-ink truncate ${event.completed ? 'line-through' : ''}`}>
            {event.title}
          </span>
          <span className="block text-xs text-ink-muted">
            {event.startTime || 'Any time'} · {event.durationMin} min ·{' '}
            <span style={{ color: cat.color }}>{cat.label}</span>
          </span>
        </span>
        <span className="text-right shrink-0">
          {isQuest(event) ? (
            <>
              {/* Solo-Leveling gate rank instead of a plain difficulty word */}
              <span className="block text-[10px] font-display font-bold uppercase tracking-wider"
                style={{ color: diff.rankColor, textShadow: `0 0 10px color-mix(in oklab, ${diff.rankColor} 50%, transparent)` }}>
                {diff.rank}-Rank
              </span>
              <span className="block text-xs font-bold text-gold tabular-nums">{event.xp} XP</span>
            </>
          ) : (
            <span className="block text-[10px] font-display font-bold uppercase tracking-wider text-ink-muted">
              Event
            </span>
          )}
        </span>
      </div>
    </motion.li>
  )
}

export default function DayView() {
  const { focusDate, openNewEvent } = useUiStore()
  const events = useCalendarStore(s => s.events)

  const dayKey = format(focusDate, 'yyyy-MM-dd')
  const dayEvents = events
    .filter(e => e.date === dayKey)
    .sort((a, b) => ((a.startTime || '99') < (b.startTime || '99') ? -1 : 1))
  // Progress stats only make sense for quests — plain events just happen.
  const dayQuests = dayEvents.filter(isQuest)
  const done = dayQuests.filter(e => e.completed)
  const xpBanked = done.reduce((s, e) => s + e.xp, 0)
  const xpPossible = dayQuests.reduce((s, e) => s + e.xp, 0)

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-4 items-start">
      <TimeGrid days={[focusDate]} />

      {/* ---- side panel: the day's quest log ---- */}
      <aside className="glass rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <Swords size={16} className="text-accent" aria-hidden />
          <h2 className="font-display font-bold text-ink">Day log</h2>
        </div>
        <p className="text-xs text-ink-muted mb-4">
          {done.length}/{dayQuests.length} quests cleared ·{' '}
          <span className="text-gold font-semibold tabular-nums">{xpBanked}/{xpPossible} XP</span> banked
          {dayEvents.length > dayQuests.length && <> · {dayEvents.length - dayQuests.length} event(s)</>}
        </p>

        {dayEvents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-ink-muted mb-4">A quiet day... too quiet.</p>
            <button
              onClick={() => openNewEvent({ date: dayKey })}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer glow-accent"
              style={{ background: 'var(--accent)' }}
            >
              <Plus size={15} aria-hidden /> Add a quest
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {dayEvents.map((e, i) => <LogRow key={e.id} event={e} index={i} />)}
          </ul>
        )}
      </aside>
    </div>
  )
}
