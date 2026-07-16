// ============================================================
// QUESTS PAGE — daily / weekly / custom long-term quests.
// Progress is computed live from your events; finished quests
// show a glowing CLAIM button that pays out XP.
// ============================================================
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import {
  differenceInMinutes, endOfDay, endOfWeek, format, addDays,
} from 'date-fns'
import { Scroll, CalendarClock, Target, Plus, Check, Trash2, Zap } from 'lucide-react'
import { useCalendarStore } from '../../stores/useCalendarStore'
import { useGameStore } from '../../stores/useGameStore'
import { getDailyQuests, getWeeklyQuests, getCustomQuestProgress } from '../../game/quests'
import { CATEGORIES, WEEK_STARTS_ON } from '../../game/config'
import ProgressBar from '../ui/ProgressBar'

function themeColors() {
  const css = getComputedStyle(document.documentElement)
  return ['--accent', '--accent-2', '--gold'].map(v => css.getPropertyValue(v).trim()).filter(Boolean)
}

/** "Resets in 6h 12m" style countdown, refreshed every 30s. */
function useCountdown(target) {
  const [, tick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => tick(n => n + 1), 30_000)
    return () => clearInterval(t)
  }, [])
  const mins = Math.max(0, differenceInMinutes(target, new Date()))
  const d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60
  return d > 0 ? `${d}d ${h}h` : `${h}h ${m}m`
}

function QuestCard({ quest, claimed, onDelete }) {
  const claimQuest = useGameStore(s => s.claimQuest)
  const events = useCalendarStore(s => s.events)
  const claimable = quest.done && !claimed

  const claim = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    confetti({
      particleCount: 60, spread: 75, startVelocity: 32, scalar: 0.9,
      origin: { x: (rect.left + rect.width / 2) / window.innerWidth, y: (rect.top + rect.height / 2) / window.innerHeight },
      colors: themeColors(), disableForReducedMotion: true,
    })
    useGameStore.getState().addBurst({ x: rect.left + rect.width / 2, y: rect.top, amount: quest.xp })
    claimQuest(quest.key, quest.xp, events)
  }

  // Each quest type gets its own signature color (more variation!)
  const kindColor = { daily: 'var(--accent)', weekly: 'var(--accent-2)', custom: 'var(--gold)' }[quest.kind]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 350, damping: 26 }}
      className={`glass hover-lift relative p-4 rounded-xl ${
        claimable ? 'glow-gold' : claimed ? 'opacity-70' : ''
      }`}
    >
      {/* colored spine marking the quest type */}
      <span className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full" aria-hidden
        style={{ background: kindColor, boxShadow: `0 0 8px ${kindColor}` }} />

      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="min-w-0">
          <h3 className="font-display font-bold text-sm text-ink truncate">{quest.name}</h3>
          <p className="text-xs text-ink-muted mt-0.5">{quest.desc}</p>
        </div>
        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-surface-2 border border-edge text-xs font-bold text-gold tabular-nums shrink-0">
          <Zap size={11} aria-hidden /> {quest.xp}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <ProgressBar value={quest.current / quest.target} height={7} />
        </div>
        <span className="text-xs font-semibold text-ink-muted tabular-nums shrink-0">
          {quest.current}/{quest.target}{quest.unit ? ` ${quest.unit}` : ''}
        </span>

        {claimed ? (
          <span className="flex items-center gap-1 text-xs font-semibold text-success shrink-0">
            <Check size={13} aria-hidden /> Claimed
          </span>
        ) : claimable ? (
          <motion.button
            onClick={claim}
            whileTap={{ scale: 0.92 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-black cursor-pointer shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--gold), color-mix(in oklab, var(--gold) 65%, var(--accent-2)))' }}
          >
            CLAIM
          </motion.button>
        ) : null}

        {onDelete && !claimed && (
          <button onClick={onDelete} aria-label={`Delete quest ${quest.name}`}
            className="p-1.5 rounded-lg text-ink-muted hover:text-danger cursor-pointer shrink-0">
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </motion.div>
  )
}

function Section({ icon: Icon, title, sub, children, action }) {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} className="text-accent" aria-hidden />
        <h2 className="font-display font-bold text-ink uppercase tracking-[0.2em]">{title}</h2>
        {sub && <span className="text-xs text-ink-muted">· {sub}</span>}
        <div className="flex-1" />
        {action}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{children}</div>
    </section>
  )
}

/** Small inline form for creating a custom long-term quest. */
function NewCustomQuest({ onClose }) {
  const addCustomQuest = useGameStore(s => s.addCustomQuest)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('any')
  const [target, setTarget] = useState(10)
  const [endDay, setEndDay] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'))

  const create = () => {
    if (!name.trim()) return
    addCustomQuest({
      id: crypto.randomUUID(),
      name: name.trim(),
      category,
      target: Math.max(1, Number(target) || 1),
      startDay: format(new Date(), 'yyyy-MM-dd'),
      endDay,
    })
    onClose()
  }

  const field = 'w-full px-3 py-2 rounded-lg bg-surface-2 border border-edge text-sm text-ink outline-none focus:border-accent'
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="glass sys-frame p-4 rounded-xl space-y-3 sm:col-span-2 lg:col-span-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label htmlFor="cq-name" className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">Quest name</label>
          <input id="cq-name" className={field} autoFocus placeholder="Gym 12 times this month"
            value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && create()} />
        </div>
        <div>
          <label htmlFor="cq-cat" className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">Counts events tagged</label>
          <select id="cq-cat" className={`${field} cursor-pointer`} value={category} onChange={e => setCategory(e.target.value)}>
            <option value="any">Any category</option>
            {Object.entries(CATEGORIES).map(([id, c]) => <option key={id} value={id}>{c.label}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="cq-target" className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">Times</label>
            <input id="cq-target" type="number" min="1" max="365" className={field}
              value={target} onChange={e => setTarget(e.target.value)} />
          </div>
          <div>
            <label htmlFor="cq-end" className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">Deadline</label>
            <input id="cq-end" type="date" className={field} value={endDay} onChange={e => setEndDay(e.target.value)} />
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-3.5 py-2 rounded-lg text-sm text-ink-muted hover:text-ink cursor-pointer">Cancel</button>
        <button onClick={create} disabled={!name.trim()}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--accent)' }}>
          Start quest
        </button>
      </div>
    </motion.div>
  )
}

export default function QuestsPage() {
  const events = useCalendarStore(s => s.events)
  const claimedQuests = useGameStore(s => s.claimedQuests)
  const customQuests = useGameStore(s => s.customQuests)
  const removeCustomQuest = useGameStore(s => s.removeCustomQuest)
  const [creating, setCreating] = useState(false)

  const daily = getDailyQuests(events)
  const weekly = getWeeklyQuests(events)
  const custom = customQuests.map(q => getCustomQuestProgress(q, events))

  const dailyReset = useCountdown(endOfDay(new Date()))
  const weeklyReset = useCountdown(endOfWeek(new Date(), { weekStartsOn: WEEK_STARTS_ON }))

  return (
    <div>
      <h1 className="font-display font-bold text-xl sm:text-2xl text-holo uppercase tracking-[0.25em] mb-6">
        Quest Log
      </h1>

      <Section icon={Scroll} title="Daily quests" sub={`resets in ${dailyReset}`}>
        {daily.map(q => <QuestCard key={q.key} quest={q} claimed={!!claimedQuests[q.key]} />)}
      </Section>

      <Section icon={CalendarClock} title="Weekly quests" sub={`resets in ${weeklyReset}`}>
        {weekly.map(q => <QuestCard key={q.key} quest={q} claimed={!!claimedQuests[q.key]} />)}
      </Section>

      <Section
        icon={Target} title="Long-term quests" sub="you define these"
        action={!creating && (
          <button onClick={() => setCreating(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-edge bg-surface text-xs font-semibold text-ink hover:bg-surface-2 cursor-pointer transition-colors duration-150">
            <Plus size={13} aria-hidden /> New quest
          </button>
        )}
      >
        {creating && <NewCustomQuest onClose={() => setCreating(false)} />}
        {custom.map(q => (
          <QuestCard
            key={q.key} quest={q} claimed={!!claimedQuests[q.key]}
            onDelete={() => removeCustomQuest(q.quest.id)}
          />
        ))}
        {custom.length === 0 && !creating && (
          <p className="text-sm text-ink-muted sm:col-span-2 lg:col-span-3 py-4">
            No long-term quests yet. Try something like <em>"Gym 12 times this month"</em> — it
            auto-tracks every completed event with the category you pick.
          </p>
        )}
      </Section>
    </div>
  )
}
