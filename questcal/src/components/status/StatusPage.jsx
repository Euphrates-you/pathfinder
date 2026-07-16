// ============================================================
// STATUS — the Solo-Leveling status window.
// Rank, level, title, streak on the left; six stats on the right
// that grow from the XP you earn in each event category.
// ============================================================
import { motion } from 'framer-motion'
import { Flame, Swords, Scroll, Trophy } from 'lucide-react'
import { useGameStore, streakFromEvents } from '../../stores/useGameStore'
import { useCalendarStore } from '../../stores/useCalendarStore'
import { useSettingsStore } from '../../stores/useSettingsStore'
import { levelFromTotalXp } from '../../game/xp'
import { rankForLevel, calcStats } from '../../game/ranks'
import { ACHIEVEMENTS } from '../../game/achievements'
import Avatar from '../hud/Avatar'
import ProgressBar from '../ui/ProgressBar'

/** One labeled row in the stat block. */
function StatRow({ stat, max, index }) {
  return (
    <li className="flex items-center gap-3">
      <span className="w-10 font-display font-bold text-xs uppercase tracking-wider text-ink-muted">
        {stat.id}
      </span>
      <span
        className="w-10 text-right font-display font-bold text-lg tabular-nums"
        style={{ color: stat.color, textShadow: `0 0 12px color-mix(in oklab, ${stat.color} 55%, transparent)` }}
      >
        {stat.value}
      </span>
      <div className="flex-1">
        <div className="h-1.5 rounded-full bg-surface-2 border border-edge overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, color-mix(in oklab, ${stat.color} 60%, transparent), ${stat.color})` }}
            initial={false}
            animate={{ width: `${Math.max(4, (stat.value / max) * 100)}%` }}
            transition={{ delay: 0.1 + index * 0.06, type: 'spring', stiffness: 90, damping: 20 }}
          />
        </div>
      </div>
      <span className="w-24 text-[11px] text-ink-muted hidden sm:block">{stat.label}</span>
    </li>
  )
}

function InfoCell({ label, children }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.25em] text-ink-muted mb-1">{label}</p>
      <div className="font-display font-bold text-ink">{children}</div>
    </div>
  )
}

export default function StatusPage() {
  const totalXp = useGameStore(s => s.totalXp)
  const claimedQuests = useGameStore(s => s.claimedQuests)
  const unlockedAchievements = useGameStore(s => s.unlockedAchievements)
  const events = useCalendarStore(s => s.events)
  const frame = useSettingsStore(s => s.frame)

  const { level, into, needed, progress } = levelFromTotalXp(totalXp)
  const rank = rankForLevel(level)
  const streak = streakFromEvents(events)
  const stats = calcStats(events, level)
  const maxStat = Math.max(...stats.map(s => s.value), 1)
  const completedCount = events.filter(e => e.completed).length

  // "Title" = the most recently unlocked achievement.
  const latest = Object.entries(unlockedAchievements).sort((a, b) => b[1].localeCompare(a[1]))[0]
  const title = latest ? ACHIEVEMENTS.find(a => a.id === latest[0])?.name : 'None'

  return (
    <div className="max-w-4xl mx-auto">
      {/* System window header */}
      <div className="flex items-center gap-2.5 mb-4">
        <span className="grid place-items-center size-5 rotate-45 border-2 border-accent"
          style={{ boxShadow: '0 0 10px color-mix(in oklab, var(--accent) 50%, transparent)' }} aria-hidden>
          <span className="-rotate-45 text-accent text-xs font-bold leading-none">!</span>
        </span>
        <h1 className="font-display font-bold text-xl sm:text-2xl uppercase tracking-[0.3em] text-holo">
          Status
        </h1>
      </div>

      {/* Entrance comes from the page-level .page-enter CSS animation */}
      <div className="glass-strong sys-frame rounded-xl p-6 sm:p-8">
        <div className="grid md:grid-cols-[240px_1fr] gap-8">
          {/* ---- left: identity ---- */}
          <div className="flex flex-col items-center text-center">
            <Avatar level={level} frame={frame} size={110} />

            {/* big rank letter */}
            <div
              className="mt-4 grid place-items-center size-14 rounded-lg font-display font-bold text-3xl border"
              style={{
                color: rank.color,
                borderColor: `color-mix(in oklab, ${rank.color} 55%, transparent)`,
                background: `color-mix(in oklab, ${rank.color} 10%, transparent)`,
                boxShadow: `0 0 24px color-mix(in oklab, ${rank.color} 35%, transparent)`,
                textShadow: `0 0 16px ${rank.color}`,
              }}
              aria-label={`Hunter rank ${rank.id}`}
            >
              {rank.id}
            </div>
            <p className="mt-1.5 text-xs uppercase tracking-[0.25em]" style={{ color: rank.color }}>
              {rank.name} Student
            </p>

            <div className="w-full mt-5 space-y-3 text-left">
              <InfoCell label="Level">
                <span className="text-gold text-xl tabular-nums">{level}</span>
                <span className="text-ink-muted text-xs font-normal ml-2 tabular-nums">{into}/{needed} XP</span>
              </InfoCell>
              <ProgressBar value={progress} gold height={6} />
              <InfoCell label="Title">{title}</InfoCell>
            </div>
          </div>

          {/* ---- right: stats ---- */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-ink-muted mb-3">
              Stats · trained by completing events in each category
            </p>
            <ul className="space-y-3.5">
              {stats.map((s, i) => <StatRow key={s.id} stat={s} max={maxStat} index={i} />)}
            </ul>

            {/* totals strip */}
            <div className="grid grid-cols-3 gap-3 mt-7">
              {[
                { icon: Swords, label: 'Cleared', value: completedCount },
                { icon: Scroll, label: 'Quests claimed', value: Object.keys(claimedQuests).length },
                { icon: Trophy, label: 'Trophies', value: `${Object.keys(unlockedAchievements).length}/${ACHIEVEMENTS.length}` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="glass hover-lift rounded-lg px-3 py-2.5 text-center">
                  <Icon size={14} className="mx-auto text-accent mb-1" aria-hidden />
                  <p className="font-display font-bold text-lg text-ink tabular-nums leading-tight">{value}</p>
                  <p className="text-[10px] uppercase tracking-wider text-ink-muted">{label}</p>
                </div>
              ))}
            </div>

            {/* streak callout */}
            <div className={`flex items-center gap-2 mt-4 text-sm ${streak > 0 ? 'text-gold' : 'text-ink-muted'}`}>
              <Flame size={15} fill={streak > 0 ? 'currentColor' : 'none'} aria-hidden />
              <span className="font-semibold tabular-nums">{streak}-day streak</span>
              {streak === 0 && <span className="text-xs">— complete something today, Student.</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
