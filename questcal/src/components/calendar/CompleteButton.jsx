// ============================================================
// COMPLETE BUTTON — the most satisfying click in the app.
// Completing an event fires confetti from the exact click point,
// floats a "+XP" number, plays a chime and fills the XP bar
// (those last three happen via the calendar/game stores).
// ============================================================
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Check } from 'lucide-react'
import { useCalendarStore, isQuest } from '../../stores/useCalendarStore'

function themeColors() {
  const css = getComputedStyle(document.documentElement)
  return ['--accent', '--accent-2', '--gold']
    .map(v => css.getPropertyValue(v).trim())
    .filter(Boolean)
}

export default function CompleteButton({ event, size = 22 }) {
  const toggleComplete = useCalendarStore(s => s.toggleComplete)

  // Plain schedule entries have nothing to complete.
  if (!isQuest(event)) return null

  const onClick = (e) => {
    e.stopPropagation() // don't also open the edit modal behind us
    const rect = e.currentTarget.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2

    if (!event.completed) {
      confetti({
        particleCount: 45,
        spread: 70,
        startVelocity: 28,
        scalar: 0.8,
        ticks: 90,
        origin: { x: x / window.innerWidth, y: y / window.innerHeight },
        colors: themeColors(),
        disableForReducedMotion: true,
      })
    }
    toggleComplete(event.id, { x, y })
  }

  return (
    <motion.button
      whileTap={{ scale: 0.75 }}
      whileHover={{ scale: 1.12 }}
      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
      onClick={onClick}
      className={`grid place-items-center rounded-full border-2 shrink-0 cursor-pointer transition-colors duration-200 ${
        event.completed
          ? 'border-success text-white'
          : 'border-ink-muted/60 text-transparent hover:border-accent hover:text-accent/50'
      }`}
      style={{
        width: size, height: size,
        background: event.completed ? 'var(--success)' : 'transparent',
      }}
      aria-label={event.completed ? `Mark "${event.title}" as not done` : `Complete "${event.title}" for ${event.xp} XP`}
      title={event.completed ? 'Undo' : `Complete (+${event.xp} XP)`}
    >
      <Check size={size * 0.62} strokeWidth={3.5} aria-hidden />
    </motion.button>
  )
}
