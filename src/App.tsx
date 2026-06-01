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

  function updateTrades(updated: Trade[]) {
    setTrades(updated)
    saveTrades(updated)
  }

  function updateStrategies(updated: Strategy[]) {
    setStrategies(updated)
    saveStrategies(updated)
  }

  const tabs: { id: Tab; label: string; Icon: typeof BookOpen }[] = [
    { id: 'trades', label: 'Saisie des Trades', Icon: BookOpen },
    { id: 'calendar', label: 'Calendrier', Icon: Calendar },
    { id: 'stats', label: 'Statistiques', Icon: BarChart2 },
  ]

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
      <header className="border-b border-[#2a2a2a] bg-[#1a1a1a] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-3 h-14">
          <div className="flex items-center gap-2 mr-6">
            <div className="w-7 h-7 rounded bg-[#22c55e]/20 flex items-center justify-center">
              <BarChart2 size={14} className="text-[#22c55e]" />
            </div>
            <span className="font-semibold text-white text-sm tracking-tight">Trading Journal</span>
          </div>
          <nav className="flex gap-1">
            {tabs.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  tab === id
                    ? 'bg-[#2a2a2a] text-white'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#242424]'
                }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {tab === 'trades' && (
          <TradesTab trades={trades} strategies={strategies} onUpdateTrades={updateTrades} onUpdateStrategies={updateStrategies} />
        )}
        {tab === 'calendar' && (
          <CalendarTab trades={trades} strategies={strategies} />
        )}
        {tab === 'stats' && (
          <StatsTab trades={trades} strategies={strategies} />
        )}
      </main>
    </div>
  )
}
