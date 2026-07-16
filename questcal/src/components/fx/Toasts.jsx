// Achievement unlocks styled as Solo-Leveling SYSTEM MESSAGE
// windows — glass panel, corner brackets, glowing header.
import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { icons } from 'lucide-react'
import { useGameStore } from '../../stores/useGameStore'
import { ACHIEVEMENTS, TIER_STYLE } from '../../game/achievements'

function Toast({ toast }) {
  const popToast = useGameStore(s => s.popToast)
  const a = ACHIEVEMENTS.find(x => x.id === toast.achievementId)

  // Auto-dismiss after 5s.
  useEffect(() => {
    const t = setTimeout(() => popToast(toast.id), 5000)
    return () => clearTimeout(t)
  }, [toast.id, popToast])

  if (!a) return null
  const Icon = icons[a.icon] ?? icons.Trophy
  const tier = TIER_STYLE[a.tier]

  return (
    <motion.button
      layout
      onClick={() => popToast(toast.id)}
      className="glass-strong sys-frame w-80 px-4 py-3 rounded-lg cursor-pointer text-left"
      initial={{ opacity: 0, x: 80, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      aria-live="polite"
    >
      {/* System window header */}
      <span className="flex items-center gap-2 mb-2">
        <span className="grid place-items-center size-4 rotate-45 border border-accent" aria-hidden>
          <span className="-rotate-45 text-accent text-[10px] font-bold leading-none">!</span>
        </span>
        <span className="font-display font-bold text-[11px] uppercase tracking-[0.25em] text-accent"
          style={{ textShadow: '0 0 12px color-mix(in oklab, var(--accent) 70%, transparent)' }}>
          System message
        </span>
      </span>

      <span className="flex items-center gap-3">
        <span
          className="grid place-items-center size-10 rounded-md shrink-0 border"
          style={{
            background: `color-mix(in oklab, ${tier.color} 16%, transparent)`,
            borderColor: `color-mix(in oklab, ${tier.color} 45%, transparent)`,
            color: tier.color,
            boxShadow: `0 0 16px color-mix(in oklab, ${tier.color} 30%, transparent)`,
          }}
        >
          <Icon size={20} aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block text-[10px] uppercase tracking-widest" style={{ color: tier.color }}>
            Achievement unlocked
          </span>
          <span className="block font-display font-bold text-ink text-sm truncate">{a.name}</span>
          <span className="block text-xs text-ink-muted">+{a.xp} XP · {a.desc}</span>
        </span>
      </span>
    </motion.button>
  )
}

export default function Toasts() {
  const toasts = useGameStore(s => s.toasts)
  return (
    <div className="fixed top-20 right-4 z-[80] flex flex-col gap-3">
      <AnimatePresence>
        {toasts.map(t => <Toast key={t.id} toast={t} />)}
      </AnimatePresence>
    </div>
  )
}
