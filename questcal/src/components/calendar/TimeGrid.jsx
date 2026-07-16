// ============================================================
// TIME GRID — hour-by-hour columns, shared by Week and Day view.
// - Events with a start time are positioned absolutely by time.
// - Events without one live in the "all day" strip at the top.
// - Hour cells are drop targets (drag an event to a new day+hour)
//   and click targets (create an event at that slot).
// ============================================================
import { useEffect, useRef, useState } from 'react'
import { format, isToday } from 'date-fns'
import { useCalendarStore, isQuest } from '../../stores/useCalendarStore'
import { useUiStore } from '../../stores/useUiStore'
import { useSettingsStore } from '../../stores/useSettingsStore'
import { CATEGORIES, DIFFICULTY } from '../../game/config'
import CompleteButton from './CompleteButton'

const HOURS = Array.from({ length: 24 }, (_, i) => i)

function hourLabel(h) {
  if (h === 0) return '12 AM'
  if (h < 12) return `${h} AM`
  if (h === 12) return '12 PM'
  return `${h - 12} PM`
}

/** Read the --hour-h CSS variable so density settings Just Work. */
function useHourHeight() {
  const density = useSettingsStore(s => s.density) // re-read when density changes
  const [h, setH] = useState(56)
  useEffect(() => {
    const v = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--hour-h'))
    if (v) setH(v)
  }, [density])
  return h
}

function minutesOf(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

/** A timed event, absolutely positioned inside its day column. */
function EventBlock({ event, hourH }) {
  const { openEditEvent, draggingId, setDraggingId } = useUiStore()
  const cat = CATEGORIES[event.category] ?? CATEGORIES.work
  const top = (minutesOf(event.startTime) / 60) * hourH
  const height = Math.max(30, ((event.durationMin || 30) / 60) * hourH)

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', event.id)
        e.dataTransfer.effectAllowed = 'move'
        setDraggingId(event.id)
      }}
      onDragEnd={() => setDraggingId(null)}
      onClick={(e) => { e.stopPropagation(); openEditEvent(event.id) }}
      className={`absolute inset-x-1 rounded-lg px-2 py-1 text-xs cursor-pointer overflow-hidden
        border-l-3 shadow-sm transition-opacity duration-150
        ${event.completed ? 'opacity-50' : 'hover:brightness-110'}
        ${draggingId === event.id ? 'opacity-30' : ''}`}
      style={{
        top, height,
        background: `color-mix(in oklab, ${cat.color} 20%, var(--surface-2))`,
        borderLeftColor: cat.color,
        // don't block drops on the cells underneath while dragging another event
        pointerEvents: draggingId && draggingId !== event.id ? 'none' : undefined,
      }}
      title={isQuest(event)
        ? `${event.title} · ${DIFFICULTY[event.difficulty]?.label} · ${event.xp} XP`
        : `${event.title} · ${event.startTime} · ${event.xp} XP at day's end`}
    >
      <div className="flex items-start gap-1.5">
        <span className="mt-0.5"><CompleteButton event={event} size={15} /></span>
        <span className="min-w-0">
          <span className={`block font-semibold text-ink truncate ${event.completed ? 'line-through' : ''}`}>
            {event.title}
          </span>
          {height > 44 && (
            <span className="block text-[10px] text-ink-muted">
              {event.startTime} · {event.durationMin}min · <span className="text-gold">{event.xp} XP</span>
            </span>
          )}
        </span>
      </div>
    </div>
  )
}

/** The current-time indicator line. */
function NowLine({ hourH }) {
  const [, tick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => tick(n => n + 1), 60_000)
    return () => clearInterval(t)
  }, [])
  const now = new Date()
  const top = ((now.getHours() * 60 + now.getMinutes()) / 60) * hourH
  return (
    <div className="absolute inset-x-0 z-10 pointer-events-none" style={{ top }} aria-hidden>
      <div className="h-0.5" style={{ background: 'var(--danger)' }} />
      <div className="absolute -left-1 -top-[3px] size-2 rounded-full" style={{ background: 'var(--danger)' }} />
    </div>
  )
}

export default function TimeGrid({ days }) {
  const events = useCalendarStore(s => s.events)
  const moveEvent = useCalendarStore(s => s.moveEvent)
  const { openNewEvent, draggingId, setDraggingId } = useUiStore()
  const hourH = useHourHeight()
  const scrollRef = useRef(null)

  // Start the view scrolled to ~7 AM instead of midnight.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 7 * hourH
  }, [hourH, days.length])

  const gridCols = { gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))` }
  const dayKey = (d) => format(d, 'yyyy-MM-dd')
  const allDayOf = (d) => events.filter(e => e.date === dayKey(d) && !e.startTime)
  const timedOf = (d) => events.filter(e => e.date === dayKey(d) && e.startTime)

  const dropProps = (key, startTime) => ({
    onDragOver: (e) => e.preventDefault(),
    onDrop: (e) => {
      e.preventDefault()
      const id = e.dataTransfer.getData('text/plain')
      if (id) moveEvent(id, key, startTime)
      setDraggingId(null)
    },
  })

  return (
    <div className="glass rounded-xl overflow-hidden">
      {/* ---- day headers (only useful with multiple days) ---- */}
      {days.length > 1 && (
        <div className="grid border-b border-edge bg-surface-2/60" style={gridCols}>
          <div />
          {days.map(d => (
            <div key={dayKey(d)} className="px-2 py-2 text-center">
              <span className="text-[11px] uppercase tracking-widest text-ink-muted">{format(d, 'EEE')}</span>
              <span
                className={`ml-1.5 inline-grid place-items-center size-6 rounded-full text-xs font-bold tabular-nums
                  ${isToday(d) ? 'text-white' : 'text-ink'}`}
                style={isToday(d) ? { background: 'var(--accent)' } : undefined}
              >
                {format(d, 'd')}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ---- all-day strip (events without a time) ---- */}
      <div className="grid border-b border-edge" style={gridCols}>
        <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-ink-muted self-center">All day</div>
        {days.map(d => (
          <div
            key={dayKey(d)}
            className={`min-h-9 p-1 flex flex-col gap-1 border-l border-edge ${draggingId ? 'bg-surface-2/40' : ''}`}
            {...dropProps(dayKey(d), '')}
          >
            {allDayOf(d).map(e => {
              const cat = CATEGORIES[e.category] ?? CATEGORIES.work
              return (
                <div
                  key={e.id}
                  draggable
                  onDragStart={(ev) => { ev.dataTransfer.setData('text/plain', e.id); useUiStore.getState().setDraggingId(e.id) }}
                  onDragEnd={() => setDraggingId(null)}
                  onClick={() => useUiStore.getState().openEditEvent(e.id)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs cursor-pointer ${e.completed ? 'opacity-50' : ''}`}
                  style={{ background: `color-mix(in oklab, ${cat.color} 18%, var(--surface-2))` }}
                >
                  <CompleteButton event={e} size={15} />
                  <span className={`truncate font-medium text-ink ${e.completed ? 'line-through' : ''}`}>{e.title}</span>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* ---- scrollable hour grid ---- */}
      <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: '62vh' }}>
        <div className="grid" style={gridCols}>
          {/* time gutter */}
          <div>
            {HOURS.map(h => (
              <div key={h} className="relative border-b border-edge/50 text-right pr-2" style={{ height: hourH }}>
                <span className="text-[10px] text-ink-muted relative -top-1.5">{h > 0 ? hourLabel(h) : ''}</span>
              </div>
            ))}
          </div>

          {/* one column per day */}
          {days.map(d => (
            <div key={dayKey(d)} className="relative border-l border-edge">
              {HOURS.map(h => (
                <div
                  key={h}
                  className="border-b border-edge/50 hover:bg-surface-2/60 cursor-pointer transition-colors duration-150"
                  style={{ height: hourH }}
                  onClick={() => openNewEvent({ date: dayKey(d), startTime: `${String(h).padStart(2, '0')}:00` })}
                  {...dropProps(dayKey(d), `${String(h).padStart(2, '0')}:00`)}
                  aria-label={`${format(d, 'MMM d')} at ${hourLabel(h)}`}
                />
              ))}
              {timedOf(d).map(e => <EventBlock key={e.id} event={e} hourH={hourH} />)}
              {isToday(d) && <NowLine hourH={hourH} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
