export const MINUTES_BY_DATE_KEY = "focusTrackerMinutesByDate"

type MinutesByDate = Record<string, number>

export function getLocalDateKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function loadMinutesByDate(): MinutesByDate {
  try {
    const raw = localStorage.getItem(MINUTES_BY_DATE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return {}
    return parsed as MinutesByDate
  } catch {
    return {}
  }
}

export function getMinutesForToday(): number {
  const map = loadMinutesByDate()
  return map[getLocalDateKey()] ?? 0
}

/** Adds focus minutes for the current local calendar day (same data as Home "Today's time"). */
export function addMinutesForToday(minutes: number) {
  const add = Number.isFinite(minutes) ? Math.max(0, Math.round(minutes)) : 0
  if (add <= 0) return
  const map = loadMinutesByDate()
  const key = getLocalDateKey()
  map[key] = (map[key] ?? 0) + add
  localStorage.setItem(MINUTES_BY_DATE_KEY, JSON.stringify(map))
}
