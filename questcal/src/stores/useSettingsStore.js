// ============================================================
// SETTINGS STORE — theme, accent, font, density, sound.
// Persisted to localStorage via the shared storage adapter.
// ============================================================
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { appStorage, SAVE_VERSION } from './storage'

export const useSettingsStore = create(
  persist(
    (set) => ({
      theme: 'system',       // Solo-Leveling glass is the flagship look
      accent: null,          // null = use the theme's default accent
      customAccent: '#38bdf8', // remembered value for the color picker
      font: 'auto',          // 'auto' = follow the theme's default font
      density: 'cozy',       // 'cozy' | 'compact' — calendar row heights
      muted: false,          // sound effects on/off
      frame: 'none',         // avatar frame cosmetic
      apiKey: '',            // Anthropic API key for the System Assistant
                             // (stays in YOUR browser's localStorage only)

      set: (patch) => set(patch), // tiny generic setter for simple fields
      toggleMute: () => set(s => ({ muted: !s.muted })),
    }),
    {
      name: 'questcal-settings',
      version: 2,
      storage: appStorage,
      // v1 saves defaulted to dark-fantasy; move those users onto the
      // new System theme (an explicit later choice will stick normally).
      migrate: (persisted, version) => {
        if (version < 2 && persisted?.theme === 'dark-fantasy') {
          persisted.theme = 'system'
        }
        return persisted
      },
    },
  ),
)
