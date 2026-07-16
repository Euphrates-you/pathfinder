// ============================================================
// SOUND — tiny synthesizer built on the Web Audio API.
// No audio files needed: we generate notes in code.
// Every sound respects the mute toggle in settings.
// ============================================================
import { useSettingsStore } from '../stores/useSettingsStore'

let audioCtx = null
function ctx() {
  // Browsers only allow audio after a user gesture, so we create
  // the AudioContext lazily (first click) instead of at startup.
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

/** Play one note: frequency (Hz), start delay (s), duration (s). */
function note(freq, delay = 0, dur = 0.15, type = 'triangle', volume = 0.12) {
  const c = ctx()
  const osc = c.createOscillator()
  const gain = c.createGain()
  const t = c.currentTime + delay
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  // Quick fade-in + exponential fade-out = a soft "pluck" envelope
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(gain).connect(c.destination)
  osc.start(t)
  osc.stop(t + dur + 0.05)
}

const SOUNDS = {
  // soft UI tick
  click:    () => note(660, 0, 0.06, 'sine', 0.05),
  // rising two-note "ding!" when you complete an event
  complete: () => { note(659, 0, 0.12); note(880, 0.09, 0.22) },
  // undoing a completion — same notes, downward
  undo:     () => { note(880, 0, 0.1, 'sine', 0.06); note(659, 0.08, 0.16, 'sine', 0.06) },
  // little chord for claiming a quest reward
  claim:    () => { note(523, 0, 0.25); note(659, 0.02, 0.25); note(784, 0.04, 0.3) },
  // achievement fanfare
  badge:    () => { note(587, 0, 0.15); note(880, 0.12, 0.3, 'triangle', 0.14) },
  // full level-up arpeggio with a sparkle on top
  levelup:  () => {
    [523, 659, 784, 1047].forEach((f, i) => note(f, i * 0.09, 0.28, 'triangle', 0.13))
    note(2093, 0.42, 0.5, 'sine', 0.05)
  },
}

/** Play a named sound (silently does nothing if muted or unsupported). */
export function play(name) {
  try {
    if (useSettingsStore.getState().muted) return
    SOUNDS[name]?.()
  } catch {
    // Audio can fail in odd environments — never let a sound crash the app.
  }
}
