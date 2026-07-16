// ============================================================
// EVENT MODAL — create or edit an event.
// The XP reward preview updates live as you change difficulty
// and duration, so scheduling harder things *feels* rewarding.
// ============================================================
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { format } from 'date-fns'
import { X, Trash2, Zap } from 'lucide-react'
import { useCalendarStore } from '../../stores/useCalendarStore'
import { useUiStore } from '../../stores/useUiStore'
import { CATEGORIES, DIFFICULTY } from '../../game/config'
import { calcEventXp } from '../../game/xp'
import { play } from '../../game/sound'

const DURATIONS = [15, 30, 45, 60, 90, 120, 180, 240]

const field = 'w-full px-3 py-2 rounded-lg bg-surface-2 border border-edge text-sm text-ink placeholder:text-ink-muted/70 focus:border-accent outline-none transition-colors duration-150'
const label = 'block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5'

export default function EventModal() {
  const modal = useUiStore(s => s.modal)
  const closeModal = useUiStore(s => s.closeModal)
  const { events, addEvent, updateEvent, deleteEvent } = useCalendarStore()

  const editing = modal?.eventId ? events.find(e => e.id === modal.eventId) : null

  // Local form state, re-initialized every time the modal opens.
  const [form, setForm] = useState(null)
  useEffect(() => {
    if (!modal) { setForm(null); return }
    setForm(editing ? { ...editing } : {
      title: '',
      date: modal.defaults?.date ?? format(new Date(), 'yyyy-MM-dd'),
      startTime: modal.defaults?.startTime ?? '',
      durationMin: 60,
      category: 'work',
      difficulty: 'medium',
      notes: '',
    })
  }, [modal]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close on Escape.
  useEffect(() => {
    if (!modal) return
    const onKey = (e) => e.key === 'Escape' && closeModal()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modal, closeModal])

  // Everything below is guarded so hooks above always run in the same order.
  const xpPreview = form ? calcEventXp(form.difficulty, form.durationMin) : 0
  const set = (patch) => setForm(f => ({ ...f, ...patch }))

  const save = () => {
    const data = { ...form, title: form.title.trim() || 'Untitled quest' }
    if (editing) updateEvent(editing.id, data)
    else addEvent(data)
    play('click')
    closeModal()
  }

  const remove = () => {
    deleteEvent(editing.id)
    play('undo')
    closeModal()
  }

  // AnimatePresence stays mounted so the close animation can play.
  return (
    <AnimatePresence>
      {modal && form && (
      <motion.div
        key="backdrop"
        className="fixed inset-0 z-[60] grid place-items-center p-4 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={closeModal}
      >
        <motion.div
          role="dialog" aria-modal="true" aria-label={editing ? 'Edit event' : 'New event'}
          className="glass-strong sys-frame w-full max-w-md rounded-xl"
          initial={{ scale: 0.92, y: 24, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 12, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-edge">
            <h2 className="font-display font-bold text-lg text-ink">
              {editing ? 'Edit quest' : 'New quest'}
            </h2>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold text-gold bg-surface-2 border border-gold/30 tabular-nums flex items-center gap-1">
                <Zap size={11} aria-hidden /> {xpPreview} XP
              </span>
              <button onClick={closeModal} aria-label="Close"
                className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-2 cursor-pointer">
                <X size={17} />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* title */}
            <div>
              <label htmlFor="ev-title" className={label}>Title</label>
              <input
                id="ev-title" autoFocus className={field}
                placeholder="Slay the laundry dragon…"
                value={form.title}
                onChange={e => set({ title: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && save()}
              />
            </div>

            {/* date / time / duration */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="ev-date" className={label}>Date</label>
                <input id="ev-date" type="date" className={field}
                  value={form.date} onChange={e => set({ date: e.target.value })} />
              </div>
              <div>
                <label htmlFor="ev-time" className={label}>Start time <span className="normal-case font-normal">(blank = any)</span></label>
                <input id="ev-time" type="time" className={field}
                  value={form.startTime} onChange={e => set({ startTime: e.target.value })} />
              </div>
            </div>

            <div>
              <label htmlFor="ev-dur" className={label}>Duration</label>
              <select id="ev-dur" className={`${field} cursor-pointer`}
                value={form.durationMin} onChange={e => set({ durationMin: Number(e.target.value) })}>
                {DURATIONS.map(d => (
                  <option key={d} value={d}>
                    {d < 60 ? `${d} min` : `${Math.floor(d / 60)}h${d % 60 ? ` ${d % 60}m` : ''}`}
                  </option>
                ))}
              </select>
            </div>

            {/* category chips */}
            <div>
              <span className={label}>Category</span>
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Category">
                {Object.entries(CATEGORIES).map(([id, cat]) => {
                  const active = form.category === id
                  return (
                    <button key={id} role="radio" aria-checked={active}
                      onClick={() => set({ category: id })}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-all duration-150 ${
                        active ? 'text-ink border-transparent' : 'text-ink-muted border-edge hover:border-ink-muted'
                      }`}
                      style={active ? { background: `color-mix(in oklab, ${cat.color} 26%, var(--surface-2))`, boxShadow: `inset 0 0 0 1px ${cat.color}` } : undefined}
                    >
                      <span className="inline-block size-1.5 rounded-full mr-1.5 align-middle" style={{ background: cat.color }} aria-hidden />
                      {cat.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* difficulty = Solo-Leveling gate ranks, with XP values */}
            <div>
              <span className={label}>Gate rank</span>
              <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="Difficulty">
                {Object.entries(DIFFICULTY).map(([id, diff]) => {
                  const active = form.difficulty === id
                  return (
                    <button key={id} role="radio" aria-checked={active}
                      onClick={() => set({ difficulty: id })}
                      className={`flex flex-col items-center gap-0.5 py-2 rounded-lg border cursor-pointer transition-all duration-150 ${
                        active ? 'border-transparent' : 'border-edge hover:border-ink-muted'
                      }`}
                      style={active ? {
                        background: `color-mix(in oklab, ${diff.rankColor} 14%, var(--surface-2))`,
                        boxShadow: `inset 0 0 0 1px ${diff.rankColor}, 0 0 16px color-mix(in oklab, ${diff.rankColor} 25%, transparent)`,
                      } : undefined}
                    >
                      <span className="font-display font-bold text-xl leading-none"
                        style={{
                          color: diff.rankColor,
                          textShadow: active ? `0 0 12px ${diff.rankColor}` : 'none',
                        }} aria-hidden>
                        {diff.rank}
                      </span>
                      <span className={`text-[11px] font-semibold ${active ? 'text-ink' : 'text-ink-muted'}`}>{diff.label}</span>
                      <span className="text-[10px] text-gold tabular-nums">{diff.baseXp}+ XP</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* notes */}
            <div>
              <label htmlFor="ev-notes" className={label}>Notes <span className="normal-case font-normal">(optional)</span></label>
              <textarea id="ev-notes" rows={2} className={`${field} resize-none`}
                value={form.notes} onChange={e => set({ notes: e.target.value })} />
            </div>
          </div>

          {/* footer */}
          <div className="flex items-center gap-2 px-5 py-4 border-t border-edge bg-surface-2/40 rounded-b-xl">
            {editing && (
              <button onClick={remove}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-danger hover:bg-danger/10 cursor-pointer transition-colors duration-150">
                <Trash2 size={14} aria-hidden /> Delete
              </button>
            )}
            <div className="flex-1" />
            <button onClick={closeModal}
              className="px-4 py-2 rounded-lg text-sm font-medium text-ink-muted hover:text-ink cursor-pointer">
              Cancel
            </button>
            <motion.button whileTap={{ scale: 0.96 }} onClick={save}
              className="px-5 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer glow-accent"
              style={{ background: 'linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 65%, var(--accent-2)))' }}>
              {editing ? 'Save changes' : 'Add quest'}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  )
}
