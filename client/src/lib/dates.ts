// All grouping uses the visitor's local time. Weeks run Monday → Sunday.

export function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

/** Monday 00:00 of the week containing `d`. */
export function startOfWeek(d: Date): Date {
  const x = startOfDay(d)
  const daysSinceMonday = (x.getDay() + 6) % 7
  return addDays(x, -daysSinceMonday)
}

export const sameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime()
export const weekKey = (d: Date) => dayKey(startOfWeek(d))
export function dayKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(undefined, opts)
const weekday = fmt({ weekday: 'short' })
const longDay = fmt({ weekday: 'long', day: 'numeric', month: 'long' })
const shortDate = fmt({ day: 'numeric', month: 'short' })
const time = fmt({ hour: 'numeric', minute: '2-digit' })

export const formatWeekday = (d: Date) => weekday.format(d)
export const formatLongDay = (d: Date) => longDay.format(d)
export const formatShort = (d: Date) => shortDate.format(d)
export const formatTime = (d: Date) => time.format(d)

/** "Nov 2 – 8", "Oct 26 – Nov 1" (formatRange orders day and month for the visitor's locale). */
export function formatWeekRange(monday: Date): string {
  return shortDate.formatRange(monday, addDays(monday, 6))
}

/** "This week", "Last week", "Next week", or the date range. */
export function weekLabel(monday: Date, today = new Date()): string {
  const diff = Math.round((monday.getTime() - startOfWeek(today).getTime()) / (7 * 864e5))
  if (diff === 0) return 'This week'
  if (diff === -1) return 'Last week'
  if (diff === 1) return 'Next week'
  return formatWeekRange(monday)
}

// <input type="date"> / <input type="time"> values in local time.
export const toDateInput = (d: Date) => dayKey(d)
export function toTimeInput(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
export function combine(date: string, time: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  const [h, min] = time.split(':').map(Number)
  return new Date(y, m - 1, d, h, min)
}
