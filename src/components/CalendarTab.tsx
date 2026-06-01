import { useState } from 'react'
import type { Trade, Strategy } from '../types'
import { getDayColor } from '../utils'
import { ChevronLeft, ChevronRight, Calendar, X, ZoomIn, ZoomOut } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Props {
  trades: Trade[]
  strategies: Strategy[]
}

const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export default function CalendarTab({ trades, strategies }: Props) {
  const [current, setCurrent] = useState(new Date())
  const [modal, setModal] = useState<{ src: string; trade: Trade } | null>(null)
  const [zoom, setZoom] = useState(1)

  const monthStart = startOfMonth(current)
  const monthEnd = endOfMonth(current)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Monday-based week offset
  const firstDow = (getDay(monthStart) + 6) % 7
  const paddingDays = Array(firstDow).fill(null)

  function openModal(src: string, trade: Trade) {
    setModal({ src, trade })
    setZoom(1)
  }

  const today = format(new Date(), 'yyyy-MM-dd')

  // Monthly stats
  const monthTrades = trades.filter(t => t.date.startsWith(format(current, 'yyyy-MM')))

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white capitalize">
            {format(current, 'MMMM yyyy', { locale: fr })}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {monthTrades.length} trade{monthTrades.length !== 1 ? 's' : ''} ce mois
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrent(new Date())}
            className="text-xs px-3 py-1.5 rounded-lg border border-[#3a3a3a] text-gray-400 hover:text-white hover:bg-[#2a2a2a] transition-colors cursor-pointer flex items-center gap-1.5">
            <Calendar size={12} /> Aujourd'hui
          </button>
          <button onClick={() => setCurrent(d => new Date(d.getFullYear(), d.getMonth() - 1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#3a3a3a] text-gray-400 hover:text-white hover:bg-[#2a2a2a] transition-colors cursor-pointer">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setCurrent(d => new Date(d.getFullYear(), d.getMonth() + 1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#3a3a3a] text-gray-400 hover:text-white hover:bg-[#2a2a2a] transition-colors cursor-pointer">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Day name headers */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-500 py-1">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {paddingDays.map((_, i) => <div key={`pad-${i}`} />)}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const dayTrades = trades.filter(t => t.date === dateStr)
          const t1 = dayTrades.find(t => t.tradeNumber === 'T1')
          const t2 = dayTrades.find(t => t.tradeNumber === 'T2')
          const color = getDayColor(dayTrades)
          const isToday = dateStr === today

          const borderColor = color === 'green' ? 'border-[#22c55e]/40' :
            color === 'orange' ? 'border-[#f59e0b]/40' :
            color === 'red' ? 'border-[#ef4444]/40' :
            isToday ? 'border-[#555]' : 'border-[#2a2a2a]'

          const bgColor = color === 'green' ? 'bg-[#22c55e]/8' :
            color === 'orange' ? 'bg-[#f59e0b]/8' :
            color === 'red' ? 'bg-[#ef4444]/8' : 'bg-[#1e1e1e]'

          return (
            <div key={dateStr} className={`rounded-lg border ${borderColor} ${bgColor} p-1.5 min-h-20 flex flex-col ${isToday ? 'ring-1 ring-[#444]' : ''}`}>
              <div className={`text-xs font-medium mb-1.5 ${isToday ? 'text-white font-bold' : 'text-gray-400'}`}>
                {format(day, 'd')}
              </div>
              <div className="flex-1 space-y-1">
                <TradeSlot trade={t1} label="T1" strategyName={t1 ? strategies.find(s => s.id === t1.strategyId)?.name ?? '—' : ''}
                  onImageClick={src => t1 && openModal(src, t1)} />
                <TradeSlot trade={t2} label="T2" strategyName={t2 ? strategies.find(s => s.id === t2.strategyId)?.name ?? '—' : ''}
                  onImageClick={src => t2 && openModal(src, t2)} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        {[
          { color: 'bg-[#22c55e]/30', label: 'Parfait (WIN/WIN)' },
          { color: 'bg-[#f59e0b]/30', label: 'Mitigé' },
          { color: 'bg-[#ef4444]/30', label: 'Perdant' },
          { color: 'bg-[#2a2a2a]', label: 'Vide' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded ${l.color} border border-white/10`} />
            {l.label}
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="text-sm text-gray-300">
                <span className="font-semibold">{modal.trade.tradeNumber}</span>
                {' · '}{modal.trade.date}
                {' · '}<span className={modal.trade.direction === 'Long' ? 'text-[#22c55e]' : 'text-[#ef4444]'}>{modal.trade.direction}</span>
                {' · '}{strategies.find(s => s.id === modal.trade.strategyId)?.name}
                {modal.trade.result && <span className={` ml-2 font-bold ${modal.trade.result === 'WIN' ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>{modal.trade.result}</span>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="w-8 h-8 bg-[#2a2a2a] rounded-lg flex items-center justify-center text-gray-300 hover:bg-[#3a3a3a] cursor-pointer"><ZoomOut size={14} /></button>
                <span className="text-xs text-gray-400">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="w-8 h-8 bg-[#2a2a2a] rounded-lg flex items-center justify-center text-gray-300 hover:bg-[#3a3a3a] cursor-pointer"><ZoomIn size={14} /></button>
                <button onClick={() => setModal(null)} className="w-8 h-8 bg-[#2a2a2a] rounded-lg flex items-center justify-center text-gray-300 hover:bg-[#3a3a3a] cursor-pointer"><X size={14} /></button>
              </div>
            </div>
            <div className="overflow-auto max-h-[80vh] rounded-xl border border-[#3a3a3a]">
              <img src={modal.src} alt="" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: `${100 / zoom}%` }}
                className="block transition-transform" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TradeSlot({ trade, label, strategyName, onImageClick }: {
  trade?: Trade
  label: string
  strategyName: string
  onImageClick: (src: string) => void
}) {
  if (!trade) {
    return (
      <div className="h-8 rounded border border-dashed border-[#2a2a2a] flex items-center justify-center">
        <span className="text-[10px] text-gray-700">{label}</span>
      </div>
    )
  }

  const resultColor = trade.result === 'WIN' ? 'text-[#22c55e]' : trade.result === 'LOSS' ? 'text-[#ef4444]' : 'text-gray-500'
  const tooltipContent = `${label} · ${trade.direction} · ${strategyName} · ${trade.result ?? '?'}`

  return (
    <div title={tooltipContent}
      className="h-8 rounded border border-[#3a3a3a] overflow-hidden relative group cursor-pointer"
      onClick={() => trade.referenceScreenshot && onImageClick(trade.referenceScreenshot)}>
      {trade.referenceScreenshot ? (
        <>
          <img src={trade.referenceScreenshot} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
        </>
      ) : (
        <div className="w-full h-full bg-[#252525] flex items-center justify-center gap-1">
          <span className="text-[10px] text-gray-500">{label}</span>
          {trade.result && <span className={`text-[10px] font-bold ${resultColor}`}>{trade.result}</span>}
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 py-0.5 bg-gradient-to-t from-black/70 to-transparent">
        <span className="text-[9px] text-gray-300">{label}</span>
        {trade.result && <span className={`text-[9px] font-bold ${resultColor}`}>{trade.result}</span>}
      </div>
    </div>
  )
}
