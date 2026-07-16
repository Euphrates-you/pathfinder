// ============================================================
// HUD — the persistent game header: avatar, level, XP bar,
// streak flame, navigation and quick actions.
// Also exports <MobileNav /> (bottom tab bar for small screens).
// ============================================================
import { motion } from 'framer-motion'
import {
  CalendarDays, Scroll, Trophy, Settings, Flame,
  Volume2, VolumeX, Plus, ScanFace,
} from 'lucide-react'
import { useGameStore, streakFromEvents } from '../../stores/useGameStore'
import { useCalendarStore } from '../../stores/useCalendarStore'
import { useSettingsStore } from '../../stores/useSettingsStore'
import { useUiStore } from '../../stores/useUiStore'
import { levelFromTotalXp } from '../../game/xp'
import { rankForLevel } from '../../game/ranks'
import { play } from '../../game/sound'
import Avatar from './Avatar'
import ProgressBar from '../ui/ProgressBar'

const NAV = [
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'status',   label: 'Status',   icon: ScanFace },
  { id: 'quests',   label: 'Quests',   icon: Scroll },
  { id: 'trophies', label: 'Trophies', icon: Trophy },
  { id: 'settings', label: 'Settings', icon: Settings },
]

function NavTabs({ layoutId }) {
  const page = useUiStore(s => s.page)
  const setPage = useUiStore(s => s.setPage)
  return (
    <nav className="flex items-center gap-1" aria-label="Main">
      {NAV.map(({ id, label, icon: Icon }) => {
        const active = page === id
        return (
          <button
            key={id}
            onClick={() => { setPage(id); play('click') }}
            aria-current={active ? 'page' : undefined}
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors duration-200 ${
              active ? 'text-ink' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-lg bg-surface-2 border border-edge"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <Icon size={16} className="relative" aria-hidden />
            <span className="relative hidden lg:inline">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export default function HUD() {
  const totalXp = useGameStore(s => s.totalXp)
  const events = useCalendarStore(s => s.events)
  const { muted, toggleMute, frame } = useSettingsStore()
  const openNewEvent = useUiStore(s => s.openNewEvent)

  const { level, into, needed, progress } = levelFromTotalXp(totalXp)
  const streak = streakFromEvents(events)
  const rank = rankForLevel(level)

  return (
    <header className="sticky top-0 z-40 glass">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 py-2.5 flex items-center gap-3 sm:gap-5">

        {/* --- character block: avatar + rank + level + XP bar --- */}
        <div className="flex items-center gap-3 min-w-0">
          <Avatar level={level} frame={frame} size={46} />

          {/* Hunter rank badge — the Solo-Leveling letter, glowing */}
          <span
            className="grid place-items-center size-8 rounded-md font-display font-bold text-base border shrink-0"
            style={{
              color: rank.color,
              borderColor: `color-mix(in oklab, ${rank.color} 55%, transparent)`,
              background: `color-mix(in oklab, ${rank.color} 12%, transparent)`,
              boxShadow: `0 0 14px color-mix(in oklab, ${rank.color} 35%, transparent)`,
              textShadow: `0 0 10px color-mix(in oklab, ${rank.color} 80%, transparent)`,
            }}
            title={`${rank.name} Student`}
            aria-label={`${rank.name} Student`}
          >
            {rank.id}
          </span>

          <div className="w-32 sm:w-44">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-display font-bold text-sm tracking-wide text-ink uppercase">
                LV <span className="text-gold tabular-nums">{level}</span>
              </span>
              <span className="text-[11px] text-ink-muted tabular-nums" title={`${totalXp} lifetime XP`}>
                {into}/{needed} XP
              </span>
            </div>
            <div className="mt-1">
              <ProgressBar value={progress} gold height={7} />
            </div>
          </div>
        </div>

        {/* --- center nav (desktop) --- */}
        <div className="flex-1 hidden md:flex justify-center">
          <NavTabs layoutId="nav-pill" />
        </div>
        <div className="flex-1 md:hidden" />

        {/* --- right cluster: streak, sound, new event --- */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-sm font-semibold tabular-nums ${
              streak > 0
                ? 'border-gold/40 text-gold glow-gold bg-surface-2'
                : 'border-edge text-ink-muted bg-surface-2'
            }`}
            title={streak > 0 ? `${streak}-day streak — keep it burning!` : 'Complete an event today to start a streak'}
          >
            <Flame size={15} aria-hidden fill={streak > 0 ? 'currentColor' : 'none'} />
            <span>{streak}</span>
            <span className="sr-only">day streak</span>
          </div>

          <button
            onClick={() => { toggleMute(); play('click') }}
            className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-2 cursor-pointer transition-colors duration-200"
            aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
          >
            {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>

          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => { openNewEvent(); play('click') }}
            className="flex items-center gap-1.5 pl-2.5 pr-3.5 py-2 rounded-lg font-semibold text-sm cursor-pointer text-white glow-accent transition-transform duration-200"
            style={{ background: 'linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 65%, var(--accent-2)))' }}
          >
            <Plus size={16} aria-hidden />
            <span className="hidden sm:inline">New Event</span>
            <span className="sr-only sm:hidden">New event</span>
          </motion.button>
        </div>
      </div>
    </header>
  )
}

/** Bottom tab bar — only visible below md. */
export function MobileNav() {
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 md:hidden glass pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around py-1.5">
        <NavTabs layoutId="nav-pill-mobile" />
      </div>
    </div>
  )
}
