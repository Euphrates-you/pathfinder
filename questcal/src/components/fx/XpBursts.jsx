// Floating "+40 XP" numbers that rise from wherever you clicked.
// The game store keeps a short-lived list; each one animates up and fades.
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from '../../stores/useGameStore'

export default function XpBursts() {
  const bursts = useGameStore(s => s.xpBursts)
  return (
    <div className="fixed inset-0 z-[70] pointer-events-none" aria-hidden>
      <AnimatePresence>
        {bursts.map(b => (
          <motion.div
            key={b.id}
            className="absolute font-display font-bold text-gold text-lg whitespace-nowrap"
            style={{ left: b.x, top: b.y, textShadow: '0 0 12px color-mix(in oklab, var(--gold) 60%, transparent)' }}
            initial={{ opacity: 0, y: 0, scale: 0.6, x: '-50%' }}
            animate={{ opacity: [0, 1, 1, 0], y: -64, scale: 1.1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.3, ease: 'easeOut' }}
          >
            +{b.amount} XP
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
