// A compact event pill for the month grid.
// Draggable (HTML5 drag & drop) to reschedule to another day.
import { Check } from 'lucide-react'
import { CATEGORIES, DIFFICULTY } from '../../game/config'
import { useUiStore } from '../../stores/useUiStore'
import { isQuest } from '../../stores/useCalendarStore'
import CompleteButton from './CompleteButton'

export default function EventChip({ event }) {
  const openEditEvent = useUiStore(s => s.openEditEvent)
  const setDraggingId = useUiStore(s => s.setDraggingId)
  const draggingId = useUiStore(s => s.draggingId)
  const cat = CATEGORIES[event.category] ?? CATEGORIES.work
  const quest = isQuest(event)

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
      className={`group flex items-center gap-1.5 px-1.5 py-1 rounded-md text-xs cursor-pointer border border-transparent
        hover:border-edge transition-all duration-150 ${event.completed ? 'opacity-55' : ''}
        ${draggingId === event.id ? 'opacity-30' : ''}`}
      style={{
        background: `color-mix(in oklab, ${cat.color} 16%, var(--surface-2))`,
        // While dragging something, chips shouldn't swallow the drop:
        pointerEvents: draggingId && draggingId !== event.id ? 'none' : undefined,
      }}
      title={quest
        ? `${event.title} · ${DIFFICULTY[event.difficulty]?.label} · ${event.xp} XP`
        : `${event.title}${event.startTime ? ` · ${event.startTime}` : ''} · ${event.xp} XP at day's end`}
    >
      {/* solid dot = quest, hollow ring = plain schedule entry */}
      <span
        className="size-1.5 rounded-full shrink-0"
        style={quest
          ? { background: cat.color }
          : { background: 'transparent', boxShadow: `inset 0 0 0 1.5px ${cat.color}` }}
        aria-hidden
      />
      <span className={`flex-1 truncate font-medium text-ink ${event.completed ? 'line-through' : ''}`}>
        {event.title}
      </span>
      <span className="hidden sm:group-hover:block">
        <CompleteButton event={event} size={16} />
      </span>
      {event.completed && (
        <span className="sm:group-hover:hidden text-success" aria-hidden>
          <Check size={11} strokeWidth={3} />
        </span>
      )}
    </div>
  )
}
