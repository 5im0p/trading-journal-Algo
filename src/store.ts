import type { Trade, Strategy } from './types'
import { v4 as uuidv4 } from 'uuid'

const TRADES_KEY = 'tj_trades'
const STRATEGIES_KEY = 'tj_strategies'

const DEFAULT_STRATEGIES: Strategy[] = [
  { id: uuidv4(), name: 'Breakout' },
  { id: uuidv4(), name: 'Pullback' },
  { id: uuidv4(), name: 'Range' },
  { id: uuidv4(), name: 'Opening Range Breakout' },
]

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveJSON<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getTrades(): Trade[] {
  return loadJSON<Trade[]>(TRADES_KEY, [])
}

export function saveTrades(trades: Trade[]): void {
  saveJSON(TRADES_KEY, trades)
}

export function getStrategies(): Strategy[] {
  const stored = loadJSON<Strategy[] | null>(STRATEGIES_KEY, null)
  if (!stored) {
    saveJSON(STRATEGIES_KEY, DEFAULT_STRATEGIES)
    return DEFAULT_STRATEGIES
  }
  return stored
}

export function saveStrategies(strategies: Strategy[]): void {
  saveJSON(STRATEGIES_KEY, strategies)
}

export function createTrade(data: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>): Trade {
  const now = new Date().toISOString()
  return { ...data, id: uuidv4(), createdAt: now, updatedAt: now }
}

export function getTradesForDate(trades: Trade[], date: string): Trade[] {
  return trades.filter(t => t.date === date)
}
