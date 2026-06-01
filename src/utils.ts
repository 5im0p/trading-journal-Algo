import type { Trade, DayStats } from './types'

export function getDayColor(trades: Trade[]): DayStats['color'] {
  if (trades.length === 0) return 'gray'
  const results = trades.map(t => t.result).filter(Boolean)
  if (results.length === 0) return 'gray'
  const wins = results.filter(r => r === 'WIN').length
  const losses = results.filter(r => r === 'LOSS').length
  if (wins > 0 && losses === 0) return 'green'
  if (losses > 0 && wins === 0) return 'red'
  return 'orange'
}

export function getColorClass(color: DayStats['color']) {
  switch (color) {
    case 'green': return { bg: 'bg-green-500/20 border-green-500/40', text: 'text-green-400', border: 'border-green-500/40' }
    case 'orange': return { bg: 'bg-amber-500/20 border-amber-500/40', text: 'text-amber-400', border: 'border-amber-500/40' }
    case 'red': return { bg: 'bg-red-500/20 border-red-500/40', text: 'text-red-400', border: 'border-red-500/40' }
    default: return { bg: 'bg-[#2a2a2a] border-[#3a3a3a]', text: 'text-gray-400', border: 'border-[#3a3a3a]' }
  }
}

export function calcMaxStreak(trades: Trade[]): { maxWin: number; maxLoss: number } {
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date))
  let maxWin = 0, maxLoss = 0, curWin = 0, curLoss = 0
  for (const t of sorted) {
    if (t.result === 'WIN') { curWin++; curLoss = 0; maxWin = Math.max(maxWin, curWin) }
    else if (t.result === 'LOSS') { curLoss++; curWin = 0; maxLoss = Math.max(maxLoss, curLoss) }
  }
  return { maxWin, maxLoss }
}

export function toBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload = () => res(reader.result as string)
    reader.onerror = rej
    reader.readAsDataURL(file)
  })
}

export function formatDate(date: string) {
  return new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}
