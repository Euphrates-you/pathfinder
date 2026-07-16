// App entry point — mounts <App /> into the #root div in index.html.
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { useCalendarStore } from './stores/useCalendarStore'
import { useGameStore } from './stores/useGameStore'
import { useSettingsStore } from './stores/useSettingsStore'
import { useUiStore } from './stores/useUiStore'

// Dev-only: poke at the stores from the browser console, e.g.
//   qc.game.getState().totalXp
if (import.meta.env.DEV) {
  window.qc = {
    calendar: useCalendarStore,
    game: useGameStore,
    settings: useSettingsStore,
    ui: useUiStore,
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
