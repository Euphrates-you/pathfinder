// ============================================================
// AVATAR — a generated crystal that evolves as you level up.
// Higher tier = more facets, orbit rings, and sparkles.
// The equipped frame (a cosmetic reward) draws a colored ring.
// ============================================================
import { motion } from 'framer-motion'
import { FRAMES } from '../../themes/themes'

// Level thresholds for each evolution tier (index = tier).
const TIER_LEVELS = [1, 3, 5, 8, 12, 18, 25]

export function tierForLevel(level) {
  let tier = 0
  TIER_LEVELS.forEach((l, i) => { if (level >= l) tier = i })
  return tier
}

/** Build an SVG star-polygon path: `points` spikes around a center. */
function starPoints(cx, cy, outer, inner, points) {
  const step = Math.PI / points
  const coords = []
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    const angle = i * step - Math.PI / 2
    coords.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`)
  }
  return coords.join(' ')
}

export default function Avatar({ level = 1, frame = 'none', size = 48 }) {
  const tier = tierForLevel(level)
  const frameColor = FRAMES.find(f => f.id === frame)?.color
  const spikes = 4 + tier                 // the crystal grows facets
  const inner = 8 - Math.min(3, tier)     // and gets sharper with tiers

  return (
    <div className="relative select-none" style={{ width: size, height: size }} title={`Level ${level} avatar`}>
      <svg viewBox="0 0 48 48" width={size} height={size} role="img" aria-label={`Level ${level} crystal avatar`}>
        <defs>
          <radialGradient id="avatar-core" cx="50%" cy="40%" r="70%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.95" />
            <stop offset="70%" stopColor="var(--accent)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--accent-2)" stopOpacity="0.35" />
          </radialGradient>
        </defs>

        {/* soft aura */}
        <circle cx="24" cy="24" r="22" fill="var(--accent)" opacity={0.10 + tier * 0.02} />

        {/* the crystal itself */}
        <motion.polygon
          points={starPoints(24, 24, 15, inner, spikes)}
          fill="url(#avatar-core)"
          stroke="var(--accent)"
          strokeWidth="1.2"
          animate={{ rotate: 360 }}
          transition={{ duration: 40 - tier * 4, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '24px', originY: '24px' }}
        />

        {/* tier 2+: an orbit ring */}
        {tier >= 2 && (
          <motion.g
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            style={{ originX: '24px', originY: '24px' }}
          >
            <circle cx="24" cy="24" r="19" fill="none" stroke="var(--accent-2)" strokeWidth="0.8" strokeDasharray="3 5" opacity="0.7" />
            <circle cx="43" cy="24" r="1.8" fill="var(--accent-2)" />
          </motion.g>
        )}

        {/* tier 4+: a second, golden orbit */}
        {tier >= 4 && (
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            style={{ originX: '24px', originY: '24px' }}
          >
            <circle cx="24" cy="3.5" r="1.4" fill="var(--gold)" />
            <circle cx="24" cy="44.5" r="1.4" fill="var(--gold)" />
          </motion.g>
        )}

        {/* tier 5+: bright core spark */}
        {tier >= 5 && <circle cx="24" cy="24" r="3.4" fill="#fff" opacity="0.85" />}

        {/* cosmetic frame ring */}
        {frameColor && (
          <circle cx="24" cy="24" r="23" fill="none" stroke={frameColor} strokeWidth="2" />
        )}
      </svg>
    </div>
  )
}
