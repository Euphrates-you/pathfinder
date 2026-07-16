// ============================================================
// TROPHY SHELF — every achievement, locked or unlocked.
// Locked ones stay visible (dimmed) so you always know what
// to chase next.
// ============================================================
import { motion } from 'framer-motion'
import { icons, Lock } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useGameStore } from '../../stores/useGameStore'
import { ACHIEVEMENTS, TIER_STYLE } from '../../game/achievements'

function TrophyCard({ achievement, unlockedAt, index }) {
  const Icon = icons[achievement.icon] ?? icons.Trophy
  const tier = TIER_STYLE[achievement.tier]
  const unlocked = !!unlockedAt

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.4), duration: 0.25, ease: 'easeOut' }}
      whileHover={{ y: -3 }}
      className={`glass hover-lift relative p-4 rounded-xl text-center ${
        unlocked ? '' : 'opacity-75'
      }`}
      style={unlocked ? {
        borderColor: `color-mix(in oklab, ${tier.color} 55%, transparent)`,
        boxShadow: `0 0 22px color-mix(in oklab, ${tier.color} 16%, transparent), inset 0 1px 0 color-mix(in oklab, var(--ink) 9%, transparent)`,
      } : undefined}
    >
      <div
        className="mx-auto mb-3 grid place-items-center size-14 rounded-2xl"
        style={{
          background: unlocked
            ? `color-mix(in oklab, ${tier.color} 24%, var(--surface-2))`
            : 'var(--surface-2)',
          color: unlocked ? tier.color : 'var(--ink-muted)',
          opacity: unlocked ? 1 : 0.5,
        }}
      >
        {unlocked ? <Icon size={26} aria-hidden /> : <Lock size={22} aria-hidden />}
      </div>

      <p className="text-[10px] font-bold uppercase tracking-widest mb-1"
        style={{ color: unlocked ? tier.color : 'var(--ink-muted)' }}>
        {tier.label}
      </p>
      <h3 className={`font-display font-bold text-sm mb-1 ${unlocked ? 'text-ink' : 'text-ink-muted'}`}>
        {achievement.name}
      </h3>
      <p className="text-xs text-ink-muted leading-relaxed">{achievement.desc}</p>

      <p className="mt-2 text-[11px] font-semibold tabular-nums">
        {unlocked ? (
          <span className="text-ink-muted">{format(parseISO(unlockedAt), 'MMM d, yyyy')}</span>
        ) : (
          <span className="text-gold">+{achievement.xp} XP</span>
        )}
      </p>
    </motion.div>
  )
}

export default function AchievementsPage() {
  const unlocked = useGameStore(s => s.unlockedAchievements)
  const count = Object.keys(unlocked).length

  return (
    <div>
      <div className="flex items-baseline gap-3 mb-6">
        <h1 className="font-display font-bold text-xl sm:text-2xl text-holo uppercase tracking-[0.25em]">Trophy Shelf</h1>
        <span className="text-sm text-ink-muted tabular-nums">
          {count} / {ACHIEVEMENTS.length} unlocked
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {ACHIEVEMENTS.map((a, i) => (
          <TrophyCard key={a.id} achievement={a} unlockedAt={unlocked[a.id]} index={i} />
        ))}
      </div>
    </div>
  )
}
