// Reusable animated progress bar (XP bar, quest progress...).
// `value` is 0..1. Color defaults to the accent; pass `gold` for XP.
import { motion } from 'framer-motion'

export default function ProgressBar({ value, gold = false, height = 8 }) {
  return (
    <div
      className="w-full rounded-full bg-surface-2 border border-edge overflow-hidden bar-sheen"
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(value * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className="h-full rounded-full"
        style={{
          background: gold
            ? 'linear-gradient(90deg, var(--gold), color-mix(in oklab, var(--gold) 60%, var(--accent-2)))'
            : 'linear-gradient(90deg, var(--accent), color-mix(in oklab, var(--accent) 55%, var(--accent-2)))',
        }}
        initial={false}
        animate={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      />
    </div>
  )
}
