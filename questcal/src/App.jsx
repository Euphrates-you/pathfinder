// ============================================================
// APP SHELL
// - Applies the current theme/font/density to <html>
// - Renders the HUD, the active page, and the global overlays
//   (event modal, level-up celebration, toasts, floating XP)
// ============================================================
import { useEffect } from 'react'
import { useSettingsStore } from './stores/useSettingsStore'
import { useCalendarStore } from './stores/useCalendarStore'
import { useUiStore } from './stores/useUiStore'
import { THEMES, FONTS, ACCENTS } from './themes/themes'
import HUD, { MobileNav } from './components/hud/HUD'
import CalendarPage from './components/calendar/CalendarPage'
import EventModal from './components/calendar/EventModal'
import StatusPage from './components/status/StatusPage'
import QuestsPage from './components/quests/QuestsPage'
import AchievementsPage from './components/achievements/AchievementsPage'
import SettingsPage from './components/settings/SettingsPage'
import LevelUpOverlay from './components/fx/LevelUpOverlay'
import Toasts from './components/fx/Toasts'
import XpBursts from './components/fx/XpBursts'
import AssistantPanel from './components/assistant/AssistantPanel'

// One entry per page id used by the HUD navigation.
const PAGES = {
  calendar: CalendarPage,
  status: StatusPage,
  quests: QuestsPage,
  trophies: AchievementsPage,
  settings: SettingsPage,
}

export default function App() {
  const { theme, accent, customAccent, font, density } = useSettingsStore()
  const page = useUiStore(s => s.page)
  const seedIfEmpty = useCalendarStore(s => s.seedIfEmpty)
  const settleEvents = useCalendarStore(s => s.settleEvents)

  // First visit: create a few sample events so the board isn't empty.
  useEffect(() => { seedIfEmpty() }, [seedIfEmpty])

  // Pay out attendance XP for plain events whose day has ended —
  // on load, then once a minute (catches midnight while the app is open).
  useEffect(() => {
    settleEvents()
    const t = setInterval(settleEvents, 60_000)
    return () => clearInterval(t)
  }, [settleEvents])

  // Push the visual settings onto <html> as attributes / CSS variables.
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    root.setAttribute('data-density', density)

    // Accent: null = theme default; 'custom' = the color picker value.
    const accentColor =
      accent === 'custom' ? customAccent : ACCENTS.find(a => a.id === accent)?.color
    if (accentColor) root.style.setProperty('--accent', accentColor)
    else root.style.removeProperty('--accent')

    // Display font: 'auto' follows the theme's default.
    const fontKey = font === 'auto'
      ? THEMES.find(t => t.id === theme)?.defaultFont
      : font
    root.style.setProperty('--font-display', FONTS[fontKey]?.css ?? FONTS.fantasy.css)
    root.setAttribute('data-pixelfont', fontKey === 'pixel' ? 'true' : 'false')
  }, [theme, accent, customAccent, font, density])

  const Page = PAGES[page] ?? CalendarPage

  return (
    <div className="min-h-dvh flex flex-col">
      <HUD />

      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-5 pb-24 md:pb-8 pt-4">
        {/* key={page} remounts the page; .page-enter is a CSS animation so
            a throttled background tab can never block the swap. */}
        <div key={page} className="page-enter">
          <Page />
        </div>
      </main>

      <MobileNav />

      {/* Global overlays — always mounted so they can appear from anywhere */}
      <EventModal />
      <LevelUpOverlay />
      <Toasts />
      <XpBursts />
      <AssistantPanel />
    </div>
  )
}
