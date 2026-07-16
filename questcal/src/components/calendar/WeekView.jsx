// WEEK VIEW — a 7-day TimeGrid starting on Monday.
import { startOfWeek, addDays } from 'date-fns'
import { useUiStore } from '../../stores/useUiStore'
import { WEEK_STARTS_ON } from '../../game/config'
import TimeGrid from './TimeGrid'

export default function WeekView() {
  const focusDate = useUiStore(s => s.focusDate)
  const start = startOfWeek(focusDate, { weekStartsOn: WEEK_STARTS_ON })
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
  return <TimeGrid days={days} />
}
