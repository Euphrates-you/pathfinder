// ============================================================
// UI STORE — ephemeral interface state (never persisted).
// Which page you're on, whether the event modal is open, etc.
// ============================================================
import { create } from 'zustand'

export const useUiStore = create((set) => ({
  page: 'calendar', // 'calendar' | 'quests' | 'trophies' | 'settings'
  setPage: (page) => set({ page }),

  // Calendar view state
  view: 'month',            // 'month' | 'week' | 'day'
  setView: (view) => set({ view }),
  focusDate: new Date(),    // the date the calendar is centered on
  setFocusDate: (focusDate) => set({ focusDate }),

  // Event modal: closed, creating (with prefills), or editing an id
  modal: null, // null | { eventId } | { defaults: { date, startTime } }
  openNewEvent: (defaults = {}) => set({ modal: { defaults } }),
  openEditEvent: (eventId) => set({ modal: { eventId } }),
  closeModal: () => set({ modal: null }),

  // Set while dragging an event chip, so drop targets can react
  // and other chips can get pointer-events: none.
  draggingId: null,
  setDraggingId: (draggingId) => set({ draggingId }),
}))
