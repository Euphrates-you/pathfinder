// ============================================================
// CALENDAR PAGE — header (title, prev/today/next, view switch)
// plus the active view (month / week / day) with animated
// transitions between them.
// ============================================================
import { motion } from 'framer-motion'
import {
  format, addMonths, addWeeks, addDays, startOfWeek, endOfWeek,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useUiStore } from '../../stores/useUiStore'
import { WEEK_STARTS_ON } from '../../game/config'
import { play } from '../../game/sound'
import MonthView from './MonthView'
import WeekView from './WeekView'
import DayView from './DayView'

const VIEWS = ['month', 'week', 'day']

function headerTitle(view, date) {
  if (view === 'month') return format(date, 'MMMM yyyy')
  if (view === 'day') return format(date, 'EEEE, MMM d')
  const start = startOfWeek(date, { weekStartsOn: WEEK_STARTS_ON })
  const end = endOfWeek(date, { weekStartsOn: WEEK_STARTS_ON })
  return `${format(start, 'MMM d')} – ${format(end, start.getMonth() === end.getMonth() ? 'd' : 'MMM d')}`
}

export default function CalendarPage() {
  const { view, setView, focusDate, setFocusDate } = useUiStore()

  const step = (dir) => {
    play('click')
    if (view === 'month') setFocusDate(addMonths(focusDate, dir))
    else if (view === 'week') setFocusDate(addWeeks(focusDate, dir))
    else setFocusDate(addDays(focusDate, dir))
  }

  // A key that changes whenever the visible range changes → drives the
  // enter/exit animation between views and when paging through time.
  const viewKey = `${view}-${format(focusDate, view === 'month' ? 'yyyy-MM' : 'yyyy-MM-dd')}`

  return (
    <div>
      {/* ---------- header ---------- */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h1 className="font-display font-bold text-xl sm:text-2xl text-holo min-w-44 uppercase tracking-wide">
          {headerTitle(view, focusDate)}
        </h1>

        <div className="flex items-center gap-1">
          <button onClick={() => step(-1)} aria-label="Previous"
            className="p-2 rounded-lg border border-edge bg-surface hover:bg-surface-2 text-ink-muted hover:text-ink cursor-pointer transition-colors duration-200">
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => { setFocusDate(new Date()); play('click') }}
            className="px-3 py-1.5 rounded-lg border border-edge bg-surface hover:bg-surface-2 text-sm font-medium text-ink cursor-pointer transition-colors duration-200">
            Today
          </button>
          <button onClick={() => step(1)} aria-label="Next"
            className="p-2 rounded-lg border border-edge bg-surface hover:bg-surface-2 text-ink-muted hover:text-ink cursor-pointer transition-colors duration-200">
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex-1" />

        {/* view switcher with a sliding highlight pill */}
        <div className="flex p-1 rounded-xl border border-edge bg-surface" role="tablist" aria-label="Calendar view">
          {VIEWS.map(v => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => { setView(v); play('click') }}
              className={`relative px-3.5 py-1.5 rounded-lg text-sm font-medium capitalize cursor-pointer transition-colors duration-200 ${
                view === v ? 'text-white' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {view === v && (
                <motion.span
                  layoutId="view-pill"
                  className="absolute inset-0 rounded-lg"
                  style={{ background: 'var(--accent)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">{v}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ---------- active view ---------- */}
      {/* CSS entrance (see .page-enter) — throttle-proof view switching */}
      <div key={viewKey} className="page-enter">
        {view === 'month' && <MonthView />}
        {view === 'week' && <WeekView />}
        {view === 'day' && <DayView />}
      </div>
    </div>
  )
}
