// ============================================================
// SYSTEM ASSISTANT PANEL — floating button (bottom-right) that
// opens a glass chat window. Talk to it in plain language:
//   "add gym every monday at 6pm for the next month"
//   "move tomorrow's study session to 8pm"
//   "switch to the dark fantasy theme"
// ============================================================
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles, X, Send, KeyRound, Zap } from 'lucide-react'
import { useSettingsStore } from '../../stores/useSettingsStore'
import { runAssistant } from '../../game/assistant'
import { play } from '../../game/sound'

// The shared artifact build runs in a sandbox that blocks network
// calls, so the Assistant can't reach the Claude API there.
const IS_ARTIFACT = import.meta.env.MODE === 'artifact'

const TOOL_LABELS = {
  create_events: (i) => `Created ${i.events?.length ?? 0} event(s)`,
  list_events: () => 'Checked the calendar',
  update_events: (i) => `Updated ${i.updates?.length ?? 0} event(s)`,
  delete_events: (i) => `Deleted ${i.ids?.length ?? 0} event(s)`,
  complete_events: (i) => `Completed ${i.ids?.length ?? 0} event(s)`,
  update_settings: () => 'Changed settings',
  add_custom_quest: (i) => `Started quest "${i.name}"`,
}

/** One chat bubble (user or assistant) or an action chip. */
function Bubble({ msg }) {
  if (msg.kind === 'action') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-1.5 self-start text-[11px] text-accent px-2.5 py-1 rounded-full border border-edge bg-surface-2/60"
      >
        <Zap size={11} aria-hidden /> {msg.text}
      </motion.div>
    )
  }
  const mine = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-sm whitespace-pre-wrap leading-relaxed ${
        mine
          ? 'self-end text-white'
          : 'self-start glass text-ink'
      }`}
      style={mine ? { background: 'linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 65%, var(--accent-2)))' } : undefined}
    >
      {msg.text}
    </motion.div>
  )
}

/** Shown until an API key is saved. The user pastes it — it stays local. */
function KeySetup() {
  const settings = useSettingsStore()
  const [draft, setDraft] = useState('')
  return (
    <div className="flex flex-col gap-3 p-4 m-3 rounded-xl border border-edge bg-surface-2/50">
      <p className="flex items-center gap-2 font-display font-bold text-xs uppercase tracking-widest text-accent">
        <KeyRound size={13} aria-hidden /> Access key required
      </p>
      <p className="text-xs text-ink-muted leading-relaxed">
        The Assistant runs on the Claude API with <em>your</em> key. Paste an Anthropic API key —
        it is stored only in this browser and sent only to Anthropic.
        (You already have one in <code className="text-ink">market-reporter/.env</code>.)
      </p>
      <input
        type="password"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        placeholder="sk-ant-..."
        className="w-full px-3 py-2 rounded-lg bg-surface border border-edge text-sm text-ink outline-none focus:border-accent"
        aria-label="Anthropic API key"
      />
      <button
        onClick={() => { if (draft.trim()) { settings.set({ apiKey: draft.trim() }); play('claim') } }}
        disabled={!draft.trim()}
        className="self-end px-4 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: 'var(--accent)' }}
      >
        Activate
      </button>
    </div>
  )
}

export default function AssistantPanel() {
  const apiKey = useSettingsStore(s => s.apiKey)
  const [open, setOpen] = useState(false)
  const [chat, setChat] = useState([])       // what's rendered
  const [history, setHistory] = useState([]) // raw API conversation
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  // Keep the newest message in view.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [chat, busy])

  useEffect(() => { if (open) inputRef.current?.focus() }, [open])

  const send = async () => {
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    setChat(c => [...c, { role: 'user', text }])
    setBusy(true)
    play('click')
    try {
      const result = await runAssistant(history, text, (name, toolInput) => {
        const label = TOOL_LABELS[name]?.(toolInput) ?? name
        setChat(c => [...c, { kind: 'action', text: label }])
      })
      setHistory(result.history)
      setChat(c => [...c, { role: 'assistant', text: result.text }])
      play('complete')
    } catch (err) {
      const friendly =
        err.message === 'NO_API_KEY' ? 'No API key set — paste one above first.' :
        err.status === 401 ? 'That API key was rejected (401). Double-check it in Settings.' :
        err.status === 429 ? 'Rate limited — wait a moment and try again.' :
        err.name === 'APIConnectionError' ? 'Could not reach the Claude API — this page may be blocking network access. Use the locally-run app for the Assistant.' :
        `Something went wrong: ${err.message}`
      setChat(c => [...c, { role: 'assistant', text: friendly }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {/* floating trigger */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => { setOpen(o => !o); play('click') }}
        className="fixed bottom-20 md:bottom-6 right-4 z-[55] grid place-items-center size-13 rounded-full cursor-pointer glow-accent"
        style={{
          width: 52, height: 52,
          background: 'linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 55%, var(--accent-2)))',
        }}
        aria-label={open ? 'Close the System Assistant' : 'Open the System Assistant'}
      >
        <Sparkles size={22} className="text-white" aria-hidden />
      </motion.button>

      {/* chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="glass-strong sys-frame fixed bottom-36 md:bottom-24 right-4 z-[55] w-[calc(100vw-2rem)] max-w-sm rounded-xl flex flex-col overflow-hidden"
            style={{ height: 'min(560px, 70vh)' }}
            role="dialog" aria-label="System Assistant"
          >
            {/* header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-edge shrink-0">
              <span className="grid place-items-center size-4 rotate-45 border border-accent" aria-hidden>
                <span className="-rotate-45 text-accent text-[10px] font-bold leading-none">!</span>
              </span>
              <span className="font-display font-bold text-xs uppercase tracking-[0.25em] text-accent"
                style={{ textShadow: '0 0 12px color-mix(in oklab, var(--accent) 60%, transparent)' }}>
                System // Assistant
              </span>
              <div className="flex-1" />
              <button onClick={() => setOpen(false)} aria-label="Close"
                className="p-1 rounded text-ink-muted hover:text-ink cursor-pointer">
                <X size={15} />
              </button>
            </div>

            {/* messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto flex flex-col gap-2.5 p-3.5">
              {IS_ARTIFACT && (
                <div className="p-4 m-3 rounded-xl border border-edge bg-surface-2/50 text-xs text-ink-muted leading-relaxed">
                  <p className="font-display font-bold uppercase tracking-widest text-accent mb-2">Offline in this page</p>
                  This shared page runs in a sandbox that blocks outside connections,
                  so the AI assistant is unavailable here. Everything else —
                  events, XP, quests, themes — works normally.
                </div>
              )}
              {!IS_ARTIFACT && !apiKey && <KeySetup />}
              {!IS_ARTIFACT && apiKey && chat.length === 0 && (
                <div className="text-xs text-ink-muted leading-relaxed p-2">
                  <p className="mb-2">I can manage your calendar and settings. Try:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>"Gym every Monday 6pm for the next month, hard"</li>
                    <li>"Move tomorrow's study session to 8pm"</li>
                    <li>"Start a quest: read 10 times before August"</li>
                    <li>"Switch to compact density and mute sounds"</li>
                  </ul>
                </div>
              )}
              {chat.map((m, i) => <Bubble key={i} msg={m} />)}
              {busy && (
                <motion.div className="self-start flex items-center gap-2 text-xs text-ink-muted px-2 py-1"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <motion.span
                    className="size-3 rotate-45 border border-accent inline-block"
                    animate={{ rotate: [45, 225] }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                    aria-hidden
                  />
                  The System is working…
                </motion.div>
              )}
            </div>

            {/* input */}
            <div className="flex items-center gap-2 p-3 border-t border-edge shrink-0">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder={IS_ARTIFACT ? 'Unavailable in this shared page' : apiKey ? 'Command the System…' : 'Paste your key above first'}
                disabled={IS_ARTIFACT || !apiKey || busy}
                className="flex-1 px-3 py-2 rounded-lg bg-surface-2/70 border border-edge text-sm text-ink placeholder:text-ink-muted/60 outline-none focus:border-accent disabled:opacity-50"
                aria-label="Message the assistant"
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={send}
                disabled={!apiKey || busy || !input.trim()}
                className="grid place-items-center size-9 rounded-lg text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'var(--accent)' }}
                aria-label="Send"
              >
                <Send size={15} aria-hidden />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
