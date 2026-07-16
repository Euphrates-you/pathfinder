// ============================================================
// SYSTEM ASSISTANT — a Claude-powered agent inside the app.
//
// How it works (the classic tool-use loop):
//   1. We send the chat + a list of "tools" Claude may call.
//   2. If Claude answers with tool calls (stop_reason "tool_use"),
//      we run them against our Zustand stores, send the results
//      back, and let Claude continue.
//   3. When Claude answers with plain text, the turn is done.
//
// Your API key is read from the settings store and NEVER leaves
// the browser except to call Anthropic directly.
// ============================================================
import Anthropic from '@anthropic-ai/sdk'
import { format, addDays } from 'date-fns'
import { useCalendarStore } from '../stores/useCalendarStore'
import { useGameStore, streakFromEvents } from '../stores/useGameStore'
import { useSettingsStore } from '../stores/useSettingsStore'
import { levelFromTotalXp } from './xp'
import { rankForLevel } from './ranks'
import { isRewardUnlocked } from './rewards'
import { CATEGORIES, DIFFICULTY } from './config'
import { THEMES, FONTS, ACCENTS } from '../themes/themes'

// One place to change the model. Opus 4.8 is Anthropic's current
// top general model ($5/$25 per million tokens — a typical command
// here costs well under a cent).
export const ASSISTANT_MODEL = 'claude-opus-4-8'

// ------------------------------------------------------------
// Tool definitions — what Claude is allowed to do in the app.
// ------------------------------------------------------------
const CATEGORY_IDS = Object.keys(CATEGORIES)
const DIFFICULTY_IDS = Object.keys(DIFFICULTY)

const EVENT_PROPS = {
  title: { type: 'string' },
  date: { type: 'string', description: 'yyyy-MM-dd' },
  startTime: { type: 'string', description: 'HH:mm 24h, or "" for any time' },
  durationMin: { type: 'integer' },
  category: { type: 'string', enum: CATEGORY_IDS },
  difficulty: { type: 'string', enum: DIFFICULTY_IDS },
  notes: { type: 'string' },
}

export const TOOLS = [
  {
    name: 'create_events',
    description:
      'Create one or more calendar events. For repeating requests ("every Monday"), expand the recurrence yourself into concrete dated events (max 30 per call).',
    input_schema: {
      type: 'object',
      properties: {
        events: {
          type: 'array',
          maxItems: 30,
          items: {
            type: 'object',
            properties: EVENT_PROPS,
            required: ['title', 'date'],
          },
        },
      },
      required: ['events'],
    },
  },
  {
    name: 'list_events',
    description:
      'List events between two dates (inclusive) with their ids. Always call this before updating, deleting, or completing events you have not listed yet.',
    input_schema: {
      type: 'object',
      properties: {
        startDate: { type: 'string', description: 'yyyy-MM-dd' },
        endDate: { type: 'string', description: 'yyyy-MM-dd' },
      },
      required: ['startDate', 'endDate'],
    },
  },
  {
    name: 'update_events',
    description: 'Update fields on existing events by id (get ids from list_events).',
    input_schema: {
      type: 'object',
      properties: {
        updates: {
          type: 'array',
          items: {
            type: 'object',
            properties: { id: { type: 'string' }, ...EVENT_PROPS },
            required: ['id'],
          },
        },
      },
      required: ['updates'],
    },
  },
  {
    name: 'delete_events',
    description: 'Delete events by id. Confirm with the user first if more than 3 events would be deleted.',
    input_schema: {
      type: 'object',
      properties: { ids: { type: 'array', items: { type: 'string' } } },
      required: ['ids'],
    },
  },
  {
    name: 'complete_events',
    description: 'Mark events as completed (grants their XP), by id.',
    input_schema: {
      type: 'object',
      properties: { ids: { type: 'array', items: { type: 'string' } } },
      required: ['ids'],
    },
  },
  {
    name: 'update_settings',
    description:
      'Change app settings. Themes/accents locked behind levels will be rejected — tell the user which level unlocks them.',
    input_schema: {
      type: 'object',
      properties: {
        theme: { type: 'string', enum: THEMES.map(t => t.id) },
        accent: { type: 'string', enum: [...ACCENTS.map(a => a.id), 'default'] },
        font: { type: 'string', enum: ['auto', ...Object.keys(FONTS)] },
        density: { type: 'string', enum: ['cozy', 'compact'] },
        muted: { type: 'boolean' },
      },
    },
  },
  {
    name: 'add_custom_quest',
    description: 'Create a long-term quest that auto-tracks completed events (e.g. "Gym 12 times this month").',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        category: { type: 'string', enum: ['any', ...CATEGORY_IDS] },
        target: { type: 'integer', minimum: 1, maximum: 365 },
        endDay: { type: 'string', description: 'yyyy-MM-dd deadline' },
      },
      required: ['name', 'target', 'endDay'],
    },
  },
]

// ------------------------------------------------------------
// Tool execution — each tool call becomes real store actions.
// Returns a string that gets sent back to Claude as the result.
// ------------------------------------------------------------
const briefEvent = (e) =>
  `${e.id} | ${e.date} ${e.startTime || 'any'} | ${e.title} | ${e.category}/${e.difficulty} | ${e.durationMin}min | ${e.xp}xp${e.completed ? ' | DONE' : ''}`

export function executeTool(name, input) {
  const cal = useCalendarStore.getState()
  const game = useGameStore.getState()
  const settings = useSettingsStore.getState()
  const { level } = levelFromTotalXp(game.totalXp)

  switch (name) {
    case 'create_events': {
      const made = input.events.slice(0, 30).map(e => cal.addEvent(e))
      return `Created ${made.length} event(s):\n${made.map(briefEvent).join('\n')}`
    }

    case 'list_events': {
      const events = useCalendarStore.getState().events
        .filter(e => e.date >= input.startDate && e.date <= input.endDate)
        .sort((a, b) => (a.date + (a.startTime || '')) < (b.date + (b.startTime || '')) ? -1 : 1)
      if (events.length === 0) return 'No events in that range.'
      return `${events.length} event(s):\n${events.map(briefEvent).join('\n')}`
    }

    case 'update_events': {
      let ok = 0
      const missing = []
      for (const { id, ...patch } of input.updates) {
        if (useCalendarStore.getState().events.some(e => e.id === id)) {
          cal.updateEvent(id, patch)
          ok++
        } else missing.push(id)
      }
      return `Updated ${ok} event(s).${missing.length ? ` Unknown ids: ${missing.join(', ')}` : ''}`
    }

    case 'delete_events': {
      let ok = 0
      for (const id of input.ids) {
        if (useCalendarStore.getState().events.some(e => e.id === id)) {
          cal.deleteEvent(id)
          ok++
        }
      }
      return `Deleted ${ok} event(s).`
    }

    case 'complete_events': {
      let ok = 0
      const already = []
      for (const id of input.ids) {
        const e = useCalendarStore.getState().events.find(x => x.id === id)
        if (!e) continue
        if (e.completed) { already.push(e.title); continue }
        cal.toggleComplete(id) // grants XP, checks achievements
        ok++
      }
      return `Completed ${ok} event(s).${already.length ? ` Already done: ${already.join(', ')}` : ''}`
    }

    case 'update_settings': {
      const applied = []
      const blocked = []
      if (input.theme) {
        if (isRewardUnlocked('theme', input.theme, level)) { settings.set({ theme: input.theme }); applied.push(`theme=${input.theme}`) }
        else blocked.push(`theme "${input.theme}" is still locked`)
      }
      if (input.accent) {
        if (input.accent === 'default') { settings.set({ accent: null }); applied.push('accent=default') }
        else if (isRewardUnlocked('accent', input.accent, level)) { settings.set({ accent: input.accent }); applied.push(`accent=${input.accent}`) }
        else blocked.push(`accent "${input.accent}" is still locked`)
      }
      if (input.font) { settings.set({ font: input.font }); applied.push(`font=${input.font}`) }
      if (input.density) { settings.set({ density: input.density }); applied.push(`density=${input.density}`) }
      if (typeof input.muted === 'boolean') { settings.set({ muted: input.muted }); applied.push(`muted=${input.muted}`) }
      return `${applied.length ? `Applied: ${applied.join(', ')}.` : 'Nothing applied.'}${blocked.length ? ` Blocked: ${blocked.join('; ')} (level up to unlock).` : ''}`
    }

    case 'add_custom_quest': {
      game.addCustomQuest({
        id: crypto.randomUUID(),
        name: input.name,
        category: input.category ?? 'any',
        target: Math.max(1, Math.min(365, input.target)),
        startDay: format(new Date(), 'yyyy-MM-dd'),
        endDay: input.endDay,
      })
      return `Quest "${input.name}" started (${input.target}× by ${input.endDay}).`
    }

    default:
      return `Unknown tool: ${name}`
  }
}

// ------------------------------------------------------------
// System prompt — rebuilt each turn so dates and stats are fresh.
// ------------------------------------------------------------
export function buildSystemPrompt() {
  const now = new Date()
  const game = useGameStore.getState()
  const events = useCalendarStore.getState().events
  const { level } = levelFromTotalXp(game.totalXp)
  const rank = rankForLevel(level)

  return `You are "The System", the in-app assistant of QuestCal — a Solo-Leveling-style RPG calendar. The player is a student; address them as "Student" occasionally, keep the System flavor light.

Today is ${format(now, 'EEEE, yyyy-MM-dd')} and the local time is ${format(now, 'HH:mm')}.
Player: level ${level}, ${rank.name}, ${game.totalXp} lifetime XP, ${streakFromEvents(events)}-day streak, ${events.filter(e => e.completed).length} events completed.

Rules:
- Use the tools to act on the calendar and settings. Never claim you did something without a successful tool result.
- "Every Monday" style requests: compute the concrete dates yourself (default: the next 8 occurrences unless the user gives a range or count) and create them in ONE create_events call.
- Before editing/deleting/completing, find the events with list_events first.
- Categories: ${CATEGORY_IDS.join(', ')}. Difficulties: ${DIFFICULTY_IDS.join(', ')} (easy=E, medium=C, hard=A, epic=S gate ranks). Pick sensible defaults when the user doesn't specify (study → learning, gym → health).
- Ask before deleting more than 3 events. Otherwise just act.
- Keep replies short (1-3 sentences), confirm what changed. No markdown tables.`
}

// ------------------------------------------------------------
// The agent loop.
//   history  — [{role:'user'|'assistant', content}] from prior turns
//   onAction — callback fired per tool call, so the UI can show
//              "⚡ Created 8 events" chips as they happen
// Returns { text, history } with the updated conversation.
// ------------------------------------------------------------
export async function runAssistant(history, userText, onAction) {
  const apiKey = useSettingsStore.getState().apiKey.trim()
  if (!apiKey) throw new Error('NO_API_KEY')

  // dangerouslyAllowBrowser: fine here — it's the user's own key,
  // stored locally, in an app that runs only on their machine.
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  const messages = [...history, { role: 'user', content: userText }]
  const MAX_STEPS = 8 // safety cap on tool round-trips

  for (let step = 0; step < MAX_STEPS; step++) {
    const response = await client.messages.create({
      model: ASSISTANT_MODEL,
      max_tokens: 4096,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'low' }, // scheduling is simple — keep it snappy
      system: buildSystemPrompt(),
      tools: TOOLS,
      messages,
    })

    // Always echo the full assistant content back (keeps thinking +
    // tool_use blocks intact, which the API requires).
    messages.push({ role: 'assistant', content: response.content })

    if (response.stop_reason !== 'tool_use') {
      const text = response.content
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('\n')
        .trim()
      return { text: text || 'Done.', history: messages }
    }

    // Run every requested tool, report results back in ONE user message.
    const results = []
    for (const block of response.content) {
      if (block.type !== 'tool_use') continue
      let result
      try {
        result = executeTool(block.name, block.input)
        onAction?.(block.name, block.input, result)
      } catch (err) {
        result = `Error: ${err.message}`
      }
      results.push({ type: 'tool_result', tool_use_id: block.id, content: result })
    }
    messages.push({ role: 'user', content: results })
  }

  return { text: 'I hit my action limit for one request — try breaking it into smaller steps.', history: messages }
}
