import { useState } from 'react'
import type { Trade, Strategy } from '../types'
import { getDayColor } from '../utils'
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Props { trades: Trade[]; strategies: Strategy[] }

const DAY_NAMES = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM']

export default function CalendarTab({ trades, strategies }: Props) {
  const [current, setCurrent] = useState(new Date())
  const [modal, setModal] = useState<{ src: string; trade: Trade } | null>(null)
  const [zoom, setZoom] = useState(1)

  const days = eachDayOfInterval({ start: startOfMonth(current), end: endOfMonth(current) })
  const firstDow = (getDay(startOfMonth(current)) + 6) % 7
  const today = format(new Date(), 'yyyy-MM-dd')
  const monthKey = format(current, 'yyyy-MM')
  const monthTrades = trades.filter(t => t.date.startsWith(monthKey))
  const monthWins = monthTrades.filter(t => t.result === 'WIN').length
  const monthLosses = monthTrades.filter(t => t.result === 'LOSS').length

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-[#3a3a48] mono tracking-widest uppercase">Journal</span>
            <span className="text-[#1c1c24]">/</span>
            <span className="text-sm text-[#00d97e] mono tracking-widest uppercase">Calendrier</span>
          </div>
          <div className="flex items-center gap-5">
            <h2 className="text-3xl font-bold text-white capitalize">
              {format(current, 'MMMM yyyy', { locale: fr })}
            </h2>
            <div className="flex items-center gap-3 text-base">
              <span className="mono text-[#00d97e] font-semibold">{monthWins}W</span>
              <span className="text-[#1c1c24]">/</span>
              <span className="mono text-[#ff4d4d] font-semibold">{monthLosses}L</span>
              {monthTrades.filter(t=>t.result).length > 0 && (
                <>
                  <span className="text-[#1c1c24]">/</span>
                  <span className={`mono font-semibold ${monthWins >= monthLosses ? 'text-[#00d97e]' : 'text-[#ff4d4d]'}`}>
                    {((monthWins / monthTrades.filter(t=>t.result).length) * 100).toFixed(0)}%
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={() => setCurrent(new Date())}
            className="px-3 py-2 text-xs mono tracking-widest text-[#4a4a58] border border-[#1c1c24] rounded hover:border-[#2a2a35] hover:text-[#9a9aaa] transition-colors cursor-pointer">
            TODAY
          </button>
          <button onClick={() => setCurrent(d => new Date(d.getFullYear(), d.getMonth() - 1))}
            className="w-9 h-9 flex items-center justify-center rounded border border-[#1c1c24] text-[#4a4a58] hover:border-[#2a2a35] hover:text-[#9a9aaa] transition-colors cursor-pointer">
            <ChevronLeft size={15} />
          </button>
          <button onClick={() => setCurrent(d => new Date(d.getFullYear(), d.getMonth() + 1))}
            className="w-9 h-9 flex items-center justify-center rounded border border-[#1c1c24] text-[#4a4a58] hover:border-[#2a2a35] hover:text-[#9a9aaa] transition-colors cursor-pointer">
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-2">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center mono text-sm text-[#2a2a35] tracking-widest py-2">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {Array(firstDow).fill(null).map((_, i) => <div key={`p${i}`} />)}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const dayTrades = trades.filter(t => t.date === dateStr)
          const t1 = dayTrades.find(t => t.tradeNumber === 'T1')
          const t2 = dayTrades.find(t => t.tradeNumber === 'T2')
          const color = getDayColor(dayTrades)
          const isToday = dateStr === today

          const borderStyle =
            color === 'green'  ? 'border-[#00d97e]/30 bg-[#00d97e]/4'  :
            color === 'orange' ? 'border-[#f59e0b]/30 bg-[#f59e0b]/4'  :
            color === 'red'    ? 'border-[#ff4d4d]/30 bg-[#ff4d4d]/4'  :
            isToday            ? 'border-[#2a2a35] bg-[#0f0f14]'       :
                                 'border-[#1c1c24] bg-[#0d0d12]'

          return (
            <div key={dateStr}
              className={`border rounded-lg p-2.5 min-h-[110px] flex flex-col transition-colors ${borderStyle} ${isToday ? 'ring-1 ring-[#2a2a35]' : ''}`}>
              <div className={`mono text-sm font-semibold mb-2 ${isToday ? 'text-[#00d97e]' : color !== 'gray' ? 'text-[#9a9aaa]' : 'text-[#2a2a35]'}`}>
                {format(day, 'd')}
              </div>
              <div className="flex-1 space-y-1">
                <Slot trade={t1} label="T1" strategyName={t1 ? strategies.find(s => s.id === t1.strategyId)?.name ?? '—' : ''} onOpen={src => t1 && setModal({ src, trade: t1 })} />
                <Slot trade={t2} label="T2" strategyName={t2 ? strategies.find(s => s.id === t2.strategyId)?.name ?? '—' : ''} onOpen={src => t2 && setModal({ src, trade: t2 })} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mono text-sm text-[#2a2a35] tracking-wider">
        {[['#00d97e', 'WIN/WIN'], ['#f59e0b', 'MITIGÉ'], ['#ff4d4d', 'LOSS/LOSS'], ['#1c1c24', 'VIDE']].map(([c, l]) => (
          <div key={l} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm border" style={{ borderColor: c, background: `${c}20` }} />
            {l}
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/92 z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="mono text-xs text-[#4a4a58] tracking-wider flex items-center gap-2">
                <span className="text-[#9a9aaa] font-semibold">{modal.trade.tradeNumber}</span>
                <span className="text-[#1c1c24]">·</span>
                <span>{modal.trade.date}</span>
                <span className="text-[#1c1c24]">·</span>
                <span className={modal.trade.direction === 'Long' ? 'text-[#00d97e]' : 'text-[#ff4d4d]'}>{modal.trade.direction.toUpperCase()}</span>
                <span className="text-[#1c1c24]">·</span>
                <span>{strategies.find(s => s.id === modal.trade.strategyId)?.name}</span>
                {modal.trade.result && (
                  <span className={`font-bold ml-1 ${modal.trade.result === 'WIN' ? 'text-[#00d97e]' : 'text-[#ff4d4d]'}`}>
                    {modal.trade.result}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {[
                  { icon: ZoomOut, fn: () => setZoom(z => Math.max(0.5, z - 0.25)) },
                  { icon: ZoomIn,  fn: () => setZoom(z => Math.min(3, z + 0.25)) },
                  { icon: X,       fn: () => setModal(null) },
                ].map(({ icon: Icon, fn }) => (
                  <button key={fn.toString()} onClick={fn}
                    className="w-8 h-8 bg-[#111116] border border-[#1c1c24] rounded flex items-center justify-center text-[#4a4a58] hover:text-white hover:border-[#2a2a35] cursor-pointer transition-colors">
                    <Icon size={13} />
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-auto max-h-[80vh] rounded-lg border border-[#1c1c24]">
              <img src={modal.src} alt=""
                style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: `${100 / zoom}%` }}
                className="block" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Slot({ trade, label, strategyName, onOpen }: {
  trade?: Trade; label: string; strategyName: string; onOpen: (src: string) => void
}) {
  if (!trade) return (
    <div className="h-10 rounded border border-dashed border-[#1c1c24] flex items-center justify-center">
      <span className="mono text-xs text-[#1c1c24] tracking-widest">{label}</span>
    </div>
  )

  const rc = trade.result === 'WIN' ? 'text-[#00d97e]' : trade.result === 'LOSS' ? 'text-[#ff4d4d]' : 'text-[#3a3a48]'
  const tt = `${label} · ${trade.direction} · ${strategyName} · ${trade.result ?? '?'}`

  return (
    <div title={tt} onClick={() => trade.referenceScreenshot && onOpen(trade.referenceScreenshot)}
      className="h-10 rounded border border-[#1c1c24] overflow-hidden relative group cursor-pointer hover:border-[#2a2a35] transition-colors">
      {trade.referenceScreenshot ? (
        <>
          <img src={trade.referenceScreenshot} alt="" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
        </>
      ) : (
        <div className="w-full h-full bg-[#0b0b0f] flex items-center justify-center gap-1.5">
          <span className="mono text-[10px] text-[#2a2a35]">{label}</span>
          {trade.result && <span className={`mono text-[10px] font-bold ${rc}`}>{trade.result}</span>}
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between items-center px-1.5 py-0.5 bg-gradient-to-t from-black/80">
        <span className="mono text-[9px] text-[#9a9aaa]">{label}</span>
        {trade.result && <span className={`mono text-[9px] font-bold ${rc}`}>{trade.result}</span>}
      </div>
    </div>
  )
}
