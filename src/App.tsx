import { useState, useEffect } from 'react'
import type { Trade, Strategy } from './types'
import { getTrades, saveTrades, getStrategies, saveStrategies } from './store'
import TradesTab from './components/TradesTab'
import CalendarTab from './components/CalendarTab'
import StatsTab from './components/StatsTab'
import { BookOpen, Calendar, BarChart2 } from 'lucide-react'

type Tab = 'trades' | 'calendar' | 'stats'

export default function App() {
  const [tab, setTab] = useState<Tab>('trades')
  const [trades, setTrades] = useState<Trade[]>([])
  const [strategies, setStrategies] = useState<Strategy[]>([])

  useEffect(() => {
    setTrades(getTrades())
    setStrategies(getStrategies())
  }, [])

  function updateTrades(updated: Trade[]) { setTrades(updated); saveTrades(updated) }
  function updateStrategies(updated: Strategy[]) { setStrategies(updated); saveStrategies(updated) }

  const tabs: { id: Tab; label: string; Icon: typeof BookOpen }[] = [
    { id: 'trades',   label: 'TRADES',     Icon: BookOpen  },
    { id: 'calendar', label: 'CALENDRIER', Icon: Calendar  },
    { id: 'stats',    label: 'ANALYTICS',  Icon: BarChart2 },
  ]

  return (
    <div className="min-h-screen bg-[#0b0b0f] flex flex-col">

      {/* Accent bar top */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-[#00d97e] to-transparent shrink-0" />

      {/* Header */}
      <header className="bg-[#0d0d12] border-b border-[#1c1c24] sticky top-0 z-40 shrink-0">
        <div className="w-full px-8 flex items-center gap-8 h-16">

          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded bg-[#00d97e]/10 border border-[#00d97e]/20 flex items-center justify-center">
              <BarChart2 size={15} className="text-[#00d97e]" />
            </div>
            <span className="font-bold text-white text-base tracking-widest uppercase">
              TJ<span className="text-[#00d97e]">.</span>
            </span>
          </div>

          {/* Séparateur */}
          <div className="w-px h-6 bg-[#1c1c24]" />

          {/* Navigation */}
          <nav className="flex gap-2">
            {tabs.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`relative flex items-center gap-2.5 px-8 h-16 text-sm font-semibold tracking-widest transition-colors cursor-pointer ${
                  tab === id ? 'text-white' : 'text-[#4a4a58] hover:text-[#9a9aaa]'
                }`}
              >
                <Icon size={14} />
                {label}
                {tab === id && (
                  <span className="absolute bottom-0 left-6 right-6 h-[2px] bg-[#00d97e] rounded-t-full" />
                )}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00d97e] animate-pulse" />
            <span className="text-sm text-[#3a3a48] mono tracking-widest">LIVE</span>
          </div>
        </div>
      </header>

      {/* Content — pleine largeur */}
      <main className="flex-1 w-full px-8 py-8">
        {tab === 'trades'   && <TradesTab   trades={trades} strategies={strategies} onUpdateTrades={updateTrades} onUpdateStrategies={updateStrategies} />}
        {tab === 'calendar' && <CalendarTab trades={trades} strategies={strategies} />}
        {tab === 'stats'    && <StatsTab    trades={trades} strategies={strategies} />}
      </main>
    </div>
  )
}
