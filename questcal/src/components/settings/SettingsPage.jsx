// ============================================================
// SETTINGS — themes, accent color, font, density, sound, frames.
// Cosmetics gated by level show a lock + the level required,
// which is what makes leveling feel worth it.
// ============================================================
import { Lock, Volume2, VolumeX, RotateCcw } from 'lucide-react'
import { useSettingsStore } from '../../stores/useSettingsStore'
import { useGameStore } from '../../stores/useGameStore'
import { useCalendarStore } from '../../stores/useCalendarStore'
import { levelFromTotalXp } from '../../game/xp'
import { LEVEL_REWARDS, isRewardUnlocked } from '../../game/rewards'
import { THEMES, FONTS, ACCENTS, FRAMES } from '../../themes/themes'
import { play } from '../../game/sound'
import Avatar from '../hud/Avatar'

function Section({ title, sub, children }) {
  return (
    <section className="mb-8">
      <h2 className="font-display font-bold text-ink mb-0.5">{title}</h2>
      {sub && <p className="text-xs text-ink-muted mb-3">{sub}</p>}
      {!sub && <div className="mb-3" />}
      {children}
    </section>
  )
}

function requiredLevel(type, id) {
  return LEVEL_REWARDS.find(r => r.type === type && r.id === id)?.level
}

export default function SettingsPage() {
  const settings = useSettingsStore()
  const totalXp = useGameStore(s => s.totalXp)
  const { level } = levelFromTotalXp(totalXp)

  const pick = (patch) => { settings.set(patch); play('click') }

  const resetAll = () => {
    // Destructive — always confirm.
    if (window.confirm('Reset ALL progress? Events, XP, achievements and quests will be wiped. This cannot be undone.')) {
      useGameStore.getState().resetGame()
      useCalendarStore.getState().resetCalendar()
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-display font-bold text-xl sm:text-2xl text-holo uppercase tracking-[0.25em] mb-6">Settings</h1>

      {/* ---------------- themes ---------------- */}
      <Section title="Theme" sub="Some skins must be earned. Level up to unlock them.">
        <div className="grid sm:grid-cols-2 gap-3">
          {THEMES.map(t => {
            const unlocked = isRewardUnlocked('theme', t.id, level)
            const active = settings.theme === t.id
            const lvl = requiredLevel('theme', t.id)
            return (
              <button
                key={t.id}
                disabled={!unlocked}
                onClick={() => pick({ theme: t.id })}
                className={`glass relative flex items-center gap-3 p-3.5 rounded-xl text-left ${
                  active ? 'glow-accent' :
                  unlocked ? 'hover-lift cursor-pointer' :
                  'opacity-60 cursor-not-allowed'
                }`}
                style={active ? { borderColor: 'color-mix(in oklab, var(--accent) 70%, transparent)' } : undefined}
                aria-pressed={active}
              >
                <span className="flex shrink-0 rounded-lg overflow-hidden border border-edge" aria-hidden>
                  {t.preview.map(c => <span key={c} className="w-4 h-9" style={{ background: c }} />)}
                </span>
                <span className="min-w-0">
                  <span className="block font-display font-bold text-sm text-ink">{t.name}</span>
                  <span className="block text-xs text-ink-muted">{t.tagline}</span>
                </span>
                {!unlocked && (
                  <span className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[10px] font-bold text-ink-muted uppercase">
                    <Lock size={11} aria-hidden /> Lv {lvl}
                  </span>
                )}
                {active && <span className="absolute top-2.5 right-2.5 text-[10px] font-bold text-accent uppercase">Active</span>}
              </button>
            )
          })}
        </div>
      </Section>

      {/* ---------------- accent ---------------- */}
      <Section title="Accent color" sub="Tints buttons, highlights and your avatar.">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => pick({ accent: null })}
            className={`px-3 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-colors duration-150 ${
              settings.accent === null ? 'border-accent text-accent' : 'border-edge text-ink-muted hover:text-ink'
            }`}
          >
            Theme default
          </button>
          {ACCENTS.map(a => {
            const unlocked = isRewardUnlocked('accent', a.id, level)
            const active = settings.accent === a.id
            const lvl = requiredLevel('accent', a.id)
            return (
              <button
                key={a.id}
                disabled={!unlocked}
                onClick={() => pick({ accent: a.id })}
                aria-label={`${a.id} accent${unlocked ? '' : ` — unlocks at level ${lvl}`}`}
                title={unlocked ? a.id : `Unlocks at level ${lvl}`}
                className={`relative grid place-items-center size-9 rounded-full transition-transform duration-150 ${
                  unlocked ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed opacity-50'
                } ${active ? 'ring-2 ring-offset-2 ring-offset-bg' : ''}`}
                style={{ background: a.color, '--tw-ring-color': a.color }}
              >
                {!unlocked && <Lock size={13} className="text-black/60" aria-hidden />}
              </button>
            )
          })}
          <label className="flex items-center gap-2 text-xs font-semibold text-ink-muted cursor-pointer">
            <input
              type="color"
              value={settings.customAccent}
              onChange={e => settings.set({ accent: 'custom', customAccent: e.target.value })}
              className="size-9 rounded-full border border-edge bg-surface cursor-pointer"
              aria-label="Custom accent color"
            />
            Custom
          </label>
        </div>
      </Section>

      {/* ---------------- font & density ---------------- */}
      <div className="grid sm:grid-cols-2 gap-6">
        <Section title="Display font">
          <select
            value={settings.font}
            onChange={e => pick({ font: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-edge text-sm text-ink cursor-pointer outline-none focus:border-accent"
            aria-label="Display font"
          >
            <option value="auto">Match theme (auto)</option>
            {Object.entries(FONTS).map(([id, f]) => <option key={id} value={id}>{f.name}</option>)}
          </select>
          <p className="font-display text-lg text-ink mt-3">The quick brown fox levels up</p>
        </Section>

        <Section title="Calendar density">
          <div className="flex gap-2">
            {['cozy', 'compact'].map(d => (
              <button
                key={d}
                onClick={() => pick({ density: d })}
                className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium capitalize cursor-pointer transition-colors duration-150 ${
                  settings.density === d ? 'border-accent text-accent bg-surface' : 'border-edge text-ink-muted hover:text-ink'
                }`}
                aria-pressed={settings.density === d}
              >
                {d}
              </button>
            ))}
          </div>
        </Section>
      </div>

      {/* ---------------- avatar frame ---------------- */}
      <Section title="Avatar frame" sub="Cosmetic rings earned by leveling.">
        <div className="flex flex-wrap gap-3">
          {FRAMES.map(f => {
            const unlocked = isRewardUnlocked('frame', f.id, level)
            const active = settings.frame === f.id
            const lvl = requiredLevel('frame', f.id)
            return (
              <button
                key={f.id}
                disabled={!unlocked}
                onClick={() => pick({ frame: f.id })}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-colors duration-150 ${
                  active ? 'border-accent bg-surface' :
                  unlocked ? 'border-edge hover:bg-surface-2 cursor-pointer' : 'border-edge opacity-50 cursor-not-allowed'
                }`}
                aria-pressed={active}
              >
                <Avatar level={level} frame={f.id} size={40} />
                <span className="text-[11px] font-semibold text-ink-muted flex items-center gap-1">
                  {!unlocked && <Lock size={10} aria-hidden />}
                  {f.name}{!unlocked && ` · Lv ${lvl}`}
                </span>
              </button>
            )
          })}
        </div>
      </Section>

      {/* ---------------- sound ---------------- */}
      <Section title="Sound effects">
        <button
          onClick={() => { settings.toggleMute(); play('click') }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-edge bg-surface hover:bg-surface-2 text-sm font-medium text-ink cursor-pointer transition-colors duration-150"
          aria-pressed={!settings.muted}
        >
          {settings.muted ? <VolumeX size={15} aria-hidden /> : <Volume2 size={15} aria-hidden />}
          {settings.muted ? 'Muted' : 'On'}
        </button>
      </Section>

      {/* ---------------- system assistant ---------------- */}
      <Section
        title="System Assistant"
        sub="The in-app AI runs on the Claude API with your own key. It is stored only in this browser."
      >
        {settings.apiKey ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-success font-medium">Key saved ({settings.apiKey.slice(0, 10)}…)</span>
            <button
              onClick={() => settings.set({ apiKey: '' })}
              className="px-3 py-1.5 rounded-lg border border-edge text-xs font-medium text-ink-muted hover:text-danger cursor-pointer transition-colors duration-150"
            >
              Remove key
            </button>
          </div>
        ) : (
          <p className="text-sm text-ink-muted">
            No key saved — open the Assistant (sparkle button, bottom right) to add one.
          </p>
        )}
      </Section>

      {/* ---------------- danger zone ---------------- */}
      <Section title="Danger zone">
        <button
          onClick={resetAll}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-danger/40 text-sm font-medium text-danger hover:bg-danger/10 cursor-pointer transition-colors duration-150"
        >
          <RotateCcw size={14} aria-hidden /> Reset all progress
        </button>
      </Section>
    </div>
  )
}
