// ============================================================
// LEVEL-UP OVERLAY — a full-screen Solo-Leveling System window.
// Confetti, the evolved avatar in a pulsing ring, a holographic
// level number, new cosmetic unlocks, and a RANK UP banner when
// your Hunter rank changes.
// ============================================================
import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Gift } from 'lucide-react'
import { useGameStore } from '../../stores/useGameStore'
import { useSettingsStore } from '../../stores/useSettingsStore'
import { rankForLevel } from '../../game/ranks'
import Avatar from '../hud/Avatar'

function themeColors() {
  const css = getComputedStyle(document.documentElement)
  return ['--accent', '--accent-2', '--gold']
    .map(v => css.getPropertyValue(v).trim())
    .filter(Boolean)
}

export default function LevelUpOverlay() {
  const levelUp = useGameStore(s => s.levelUp)
  const dismiss = useGameStore(s => s.dismissLevelUp)
  const frame = useSettingsStore(s => s.frame)

  // Two confetti volleys from the bottom corners when the overlay appears.
  useEffect(() => {
    if (!levelUp) return
    const colors = themeColors()
    const fire = (x, angle) =>
      confetti({ particleCount: 90, spread: 70, startVelocity: 55, origin: { x, y: 0.9 }, angle, colors })
    fire(0.1, 60)
    fire(0.9, 120)
    const t = setTimeout(() => fire(0.5, 90), 350)
    return () => clearTimeout(t)
  }, [levelUp])

  const rankBefore = levelUp ? rankForLevel(levelUp.from) : null
  const rankAfter = levelUp ? rankForLevel(levelUp.to) : null
  const rankedUp = levelUp && rankBefore.id !== rankAfter.id

  return (
    <AnimatePresence>
      {levelUp && (
        <motion.div
          className="fixed inset-0 z-[90] grid place-items-center p-6"
          style={{
            background:
              'radial-gradient(ellipse at center, color-mix(in oklab, var(--accent) 20%, transparent), color-mix(in oklab, var(--bg) 86%, transparent) 75%)',
            backdropFilter: 'blur(8px)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={dismiss}
          role="dialog"
          aria-modal="true"
          aria-label={`Level up! You reached level ${levelUp.to}`}
        >
          {/* The System window itself */}
          <motion.div
            className="glass-strong sys-frame rounded-xl px-8 py-7 w-full max-w-md flex flex-col items-center text-center"
            initial={{ scale: 0.6, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* [ ! ] NOTIFICATION header */}
            <div className="flex items-center gap-2.5 self-center mb-6">
              <span className="grid place-items-center size-6 rotate-45 border-2 border-accent"
                style={{ boxShadow: '0 0 12px color-mix(in oklab, var(--accent) 50%, transparent)' }} aria-hidden>
                <span className="-rotate-45 text-accent text-sm font-bold leading-none">!</span>
              </span>
              <span className="font-display font-bold text-sm uppercase tracking-[0.35em] text-accent"
                style={{ textShadow: '0 0 14px color-mix(in oklab, var(--accent) 70%, transparent)' }}>
                Notification
              </span>
            </div>

            {/* pulsing ring behind the avatar */}
            <div className="relative mb-6">
              <motion.div
                className="absolute inset-0 -m-6 rounded-full"
                style={{ border: '2px solid var(--gold)' }}
                animate={{ scale: [1, 1.5], opacity: [0.8, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                aria-hidden
              />
              <Avatar level={levelUp.to} frame={frame} size={104} />
            </div>

            <p className="text-ink text-sm mb-2">You have leveled up.</p>
            <h2 className="font-display font-extrabold text-7xl text-holo mb-1 tabular-nums leading-none">
              {levelUp.to}
            </h2>
            <p className="text-ink-muted text-xs mb-5 uppercase tracking-widest">
              Level {levelUp.from} → {levelUp.to}
            </p>

            {/* RANK UP banner — only when the Hunter rank changed */}
            {rankedUp && (
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.35, type: 'spring', stiffness: 300, damping: 18 }}
                className="flex items-center gap-3 mb-5 px-5 py-2.5 rounded-lg border"
                style={{
                  borderColor: `color-mix(in oklab, ${rankAfter.color} 55%, transparent)`,
                  background: `color-mix(in oklab, ${rankAfter.color} 10%, transparent)`,
                  boxShadow: `0 0 24px color-mix(in oklab, ${rankAfter.color} 30%, transparent)`,
                }}
              >
                <span className="font-display font-bold text-xs uppercase tracking-[0.25em] text-ink">Rank up</span>
                <span className="font-display font-bold text-lg" style={{ color: rankBefore.color }}>{rankBefore.id}</span>
                <span className="text-ink-muted" aria-hidden>→</span>
                <span className="font-display font-bold text-2xl"
                  style={{ color: rankAfter.color, textShadow: `0 0 14px ${rankAfter.color}` }}>
                  {rankAfter.id}
                </span>
              </motion.div>
            )}

            {levelUp.rewards.length > 0 && (
              <div className="w-full mb-6 rounded-lg border border-edge bg-surface-2/50 p-3.5">
                <p className="flex items-center justify-center gap-1.5 text-xs uppercase tracking-widest text-accent mb-2.5">
                  <Gift size={13} aria-hidden /> New unlocks
                </p>
                <ul className="space-y-1.5">
                  {levelUp.rewards.map(r => (
                    <li key={`${r.type}-${r.id}`} className="text-sm text-ink font-medium">
                      {r.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={dismiss}
              className="px-10 py-2.5 rounded-md font-display font-bold uppercase tracking-[0.2em] text-sm text-white cursor-pointer glow-accent"
              style={{ background: 'linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 60%, var(--accent-2)))' }}
            >
              Continue
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
