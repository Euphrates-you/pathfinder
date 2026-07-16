// ============================================================
// THEME REGISTRY — metadata for the settings page.
// The actual colors live in src/index.css as CSS variables under
// [data-theme="..."] selectors; switching themes just changes one
// attribute on <html> and every color updates instantly.
// ============================================================

export const THEMES = [
  {
    id: 'system',
    name: 'The System',
    tagline: 'You have been chosen, Student',
    // small swatch preview for the theme card
    preview: ['#04060c', '#38bdf8', '#a78bfa'],
    defaultFont: 'hunter',
  },
  {
    id: 'dark-fantasy',
    name: 'Dark Fantasy',
    tagline: 'Torchlit violet & gold',
    preview: ['#0b0813', '#8b5cf6', '#fbbf24'],
    defaultFont: 'fantasy',
  },
  {
    id: 'minimal',
    name: 'Clean Minimal',
    tagline: 'Bright, calm, focused',
    preview: ['#f7f7f8', '#6366f1', '#d97706'],
    defaultFont: 'clean',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    tagline: 'Chrome rain & neon signs',
    preview: ['#050a0f', '#22d3ee', '#f472b6'],
    defaultFont: 'neon',
  },
  {
    id: 'pixel',
    name: 'Cozy Pixel',
    tagline: '16-bit campfire vibes',
    preview: ['#1a1423', '#ff9e64', '#ffd166'],
    defaultFont: 'pixel',
  },
]

// Display-font choices (body text is always Inter for readability).
export const FONTS = {
  hunter:  { name: 'Rajdhani',       css: "'Rajdhani', sans-serif" },
  fantasy: { name: 'Cinzel',         css: "'Cinzel', serif" },
  neon:    { name: 'Orbitron',       css: "'Orbitron', sans-serif" },
  pixel:   { name: 'Press Start 2P', css: "'Press Start 2P', monospace" },
  clean:   { name: 'Sora',           css: "'Sora', sans-serif" },
}

// Accent color choices. Some are locked behind levels (see rewards.js —
// the ids here match reward ids of type 'accent').
export const ACCENTS = [
  { id: 'violet',  color: '#8b5cf6' },
  { id: 'cyan',    color: '#22d3ee' },
  { id: 'magenta', color: '#f472b6' },
  { id: 'ember',   color: '#fb7185' },
  { id: 'gold',    color: '#f59e0b' },
  { id: 'emerald', color: '#34d399' },
]

// Avatar frame options (unlocked via rewards.js, type 'frame').
export const FRAMES = [
  { id: 'none',   name: 'None' },
  { id: 'bronze', name: 'Bronze', color: '#d08a4e' },
  { id: 'silver', name: 'Silver', color: '#b6c2d9' },
  { id: 'gold',   name: 'Gold',   color: '#fbbf24' },
  { id: 'mythic', name: 'Mythic', color: '#e879f9' },
]
