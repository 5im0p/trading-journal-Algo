export type Direction = 'Long' | 'Short'
export type TradeResult = 'WIN' | 'LOSS'
export type TradeNumber = 'T1' | 'T2'

export interface Strategy {
  id: string
  name: string
}

export interface Trade {
  id: string
  date: string       // YYYY-MM-DD
  time?: string      // HH:mm
  tradeNumber: TradeNumber
  direction: Direction
  strategyId: string
  entryScreenshot?: string   // base64 or URL
  referenceScreenshot?: string
  result?: TradeResult
  createdAt: string
  updatedAt: string
}

export interface DayStats {
  date: string
  trades: Trade[]
  color: 'gray' | 'green' | 'orange' | 'red'
}
