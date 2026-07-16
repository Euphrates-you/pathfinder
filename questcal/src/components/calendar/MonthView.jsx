// ============================================================
// MONTH VIEW — a fixed 6×7 grid (42 cells) so the layout never
// jumps between months. Day cells are drop targets for
// drag-and-drop rescheduling.
// ============================================================
import { useState } from 'react'
import {
  format, startOfMonth, startOfWeek, addDays, isSameMonth, isToday,
} from 'date-fns'
import { useCalendarStore } from '../../stores/useCalendarStore'
import { useUiStore } from '../../stores/useUiStore'
import { WEEK_STARTS_ON } from '../../game/config'
import EventChip from './EventChip'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MAX_CHIPS = 3 // chips shown per cell before "+n more"

function DayCell({ date, inMonth }) {
  const dayKey = format(date, 'yyyy-MM-dd')
  const events = useCalendarStore(s => s.events)
  const moveEvent = useCalendarStore(s => s.moveEvent)
  const { openNewEvent, setFocusDate, setView, draggingId, setDraggingId } = useUiStore()
  const [isOver, setIsOver] = useState(false)

  const dayEvents = events
    .filter(e => e.date === dayKey)
    .sort((a, b) => (a.startTime || '99') < (b.startTime || '99') ? -1 : 1)
  const overflow = dayEvents.length - MAX_CHIPS
  const today = isToday(date)

  return (
    <div
      onClick={() => openNewEvent({ date: dayKey })}
      onDragOver={(e) => { e.preventDefault(); setIsOver(true) }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsOver(false)
        const id = e.dataTransfer.getData('text/plain')
        if (id) moveEvent(id, dayKey)
        setDraggingId(null)
      }}
      className={`relative flex flex-col gap-1 p-1.5 border-t border-l border-edge cursor-pointer
        transition-colors duration-150 min-h-[var(--month-cell)]
        ${inMonth ? 'cell-in' : 'cell-out'}
        ${isOver && draggingId ? 'bg-surface-2 ring-2 ring-accent ring-inset' : 'hover:bg-surface-2/70'}`}
      role="gridcell"
      aria-label={format(date, 'EEEE, MMMM d')}
    >
      <button
        onClick={(e) => { e.stopPropagation(); setFocusDate(date); setView('day') }}
        aria-label={`Open ${format(date, 'MMMM d')} in day view`}
        className={`self-start grid place-items-center size-6 rounded-full text-xs font-semibold tabular-nums cursor-pointer transition-colors duration-150
          ${today ? 'text-white glow-accent' : inMonth ? 'text-ink hover:bg-surface-2' : 'text-ink-muted/60'}`}
        style={today ? { background: 'var(--accent)' } : undefined}
      >
        {format(date, 'd')}
      </button>

      {dayEvents.slice(0, MAX_CHIPS).map(e => <EventChip key={e.id} event={e} />)}

      {overflow > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); setFocusDate(date); setView('day') }}
          className="text-[11px] text-ink-muted hover:text-accent text-left px-1.5 cursor-pointer"
        >
          +{overflow} more
        </button>
      )}
    </div>
  )
}

export default function MonthView() {
  const focusDate = useUiStore(s => s.focusDate)
  const gridStart = startOfWeek(startOfMonth(focusDate), { weekStartsOn: WEEK_STARTS_ON })
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))

  return (
    <div className="glass rounded-xl overflow-hidden" role="grid" aria-label="Month calendar">
      {/* weekday header */}
      <div className="grid grid-cols-7 bg-surface-2/60">
        {WEEKDAYS.map(d => (
          <div key={d} className="px-2 py-2 text-[11px] font-semibold uppercase tracking-widest text-ink-muted text-center">
            {d}
          </div>
        ))}
      </div>
      {/* 6 weeks × 7 days */}
      <div className="grid grid-cols-7">
        {cells.map(date => (
          <DayCell key={date.toISOString()} date={date} inMonth={isSameMonth(date, focusDate)} />
        ))}
      </div>
    </div>
  )
}
