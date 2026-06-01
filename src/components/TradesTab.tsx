import { useState } from 'react'
import type { Trade, Strategy } from '../types'
import TradeForm from './TradeForm'
import StrategyManager from './StrategyManager'
import { Plus, Pencil, Trash2, Copy, TrendingUp, TrendingDown, Settings, X, Activity } from 'lucide-react'
import { formatDate } from '../utils'

interface Props {
  trades: Trade[]
  strategies: Strategy[]
  onUpdateTrades: (trades: Trade[]) => void
  onUpdateStrategies: (strategies: Strategy[]) => void
}

export default function TradesTab({ trades, strategies, onUpdateTrades, onUpdateStrategies }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editTrade, setEditTrade] = useState<Trade | undefined>()
  const [showStrategyManager, setShowStrategyManager] = useState(false)
  const [imageModal, setImageModal] = useState<string | null>(null)

  function handleSave(trade: Trade) {
    onUpdateTrades(editTrade ? trades.map(t => t.id === trade.id ? trade : t) : [...trades, trade])
    setShowForm(false)
    setEditTrade(undefined)
  }

  function handleDelete(id: string) {
    if (confirm('Supprimer ce trade ?')) onUpdateTrades(trades.filter(t => t.id !== id))
  }

  function handleDuplicate(trade: Trade) {
    const { id: _, createdAt: __, updatedAt: ___, ...rest } = trade
    const now = new Date().toISOString()
    const today = now.slice(0, 10)
    const used = trades.filter(t => t.date === today).map(t => t.tradeNumber)
    const free = (['T1', 'T2'] as const).find(n => !used.includes(n))
    if (!free) { alert("Max 2 trades par jour atteint."); return }
    onUpdateTrades([...trades, { ...rest, id: crypto.randomUUID(), date: today, tradeNumber: free, createdAt: now, updatedAt: now }])
  }

  const sortedTrades = [...trades].sort((a, b) => b.date.localeCompare(a.date) || a.tradeNumber.localeCompare(b.tradeNumber))
  const wins = trades.filter(t => t.result === 'WIN').length
  const wr = trades.length > 0 ? ((wins / trades.filter(t => t.result).length) * 100) : 0

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-[#3a3a48] mono tracking-widest uppercase">Journal</span>
            <span className="text-[#1c1c24]">/</span>
            <span className="text-sm text-[#00d97e] mono tracking-widest uppercase">Trades</span>
          </div>
          <div className="flex items-center gap-5">
            <span className="mono text-4xl font-bold text-white">{trades.length}</span>
            <span className="text-[#3a3a48] text-base">trades enregistrés</span>
            {trades.filter(t => t.result).length > 0 && (
              <span className={`mono text-xl font-bold ${wr >= 50 ? 'text-[#00d97e]' : 'text-[#ff4d4d]'}`}>
                {wr.toFixed(1)}% WR
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowStrategyManager(!showStrategyManager)}
            className={`flex items-center gap-2 px-4 py-2 rounded border text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer ${
              showStrategyManager
                ? 'bg-[#1c1c24] border-[#2a2a35] text-white'
                : 'border-[#1c1c24] text-[#4a4a58] hover:text-[#9a9aaa] hover:border-[#2a2a35]'
            }`}>
            <Settings size={13} /> Stratégies
          </button>
          <button
            onClick={() => { setEditTrade(undefined); setShowForm(true) }}
            className="flex items-center gap-2 px-4 py-2 rounded border border-[#00d97e]/40 bg-[#00d97e]/8 text-[#00d97e] text-xs font-semibold tracking-wider uppercase hover:bg-[#00d97e]/15 hover:border-[#00d97e]/60 transition-colors cursor-pointer">
            <Plus size={13} /> Nouveau trade
          </button>
        </div>
      </div>

      {/* Strategy Manager */}
      {showStrategyManager && (
        <div className="bg-[#0f0f14] border border-[#1c1c24] rounded-xl p-5">
          <StrategyManager strategies={strategies} onUpdate={onUpdateStrategies} />
        </div>
      )}

      {/* Trade Form */}
      {showForm && (
        <div className="bg-[#0f0f14] border border-[#1c1c24] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-4 bg-[#00d97e] rounded-full" />
            <h3 className="text-sm font-semibold text-white tracking-wide">
              {editTrade ? 'MODIFIER LE TRADE' : 'NOUVEAU TRADE'}
            </h3>
          </div>
          <TradeForm
            trades={trades} strategies={strategies} editTrade={editTrade}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditTrade(undefined) }}
          />
        </div>
      )}

      {/* Trade list */}
      <div className="space-y-2">
        {sortedTrades.length === 0 ? (
          <div className="text-center py-24 text-[#2a2a35]">
            <Activity size={36} className="mx-auto mb-4 opacity-40" />
            <p className="mono text-sm tracking-widest">NO TRADES LOADED</p>
            <p className="text-xs mt-2 text-[#2a2a35]">Appuyez sur NOUVEAU TRADE pour commencer</p>
          </div>
        ) : (
          sortedTrades.map(trade => (
            <TradeRow
              key={trade.id}
              trade={trade}
              strategyName={strategies.find(s => s.id === trade.strategyId)?.name ?? '—'}
              onEdit={() => { setEditTrade(trade); setShowForm(true) }}
              onDelete={() => handleDelete(trade.id)}
              onDuplicate={() => handleDuplicate(trade)}
              onImageClick={setImageModal}
            />
          ))
        )}
      </div>

      {/* Image modal */}
      {imageModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setImageModal(null)}>
          <button className="absolute top-4 right-4 text-[#4a4a58] hover:text-white cursor-pointer transition-colors">
            <X size={22} />
          </button>
          <img src={imageModal} alt="" className="max-w-full max-h-full rounded-lg object-contain border border-[#1c1c24]" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}

function TradeRow({ trade, strategyName, onEdit, onDelete, onDuplicate, onImageClick }: {
  trade: Trade; strategyName: string
  onEdit: () => void; onDelete: () => void; onDuplicate: () => void; onImageClick: (url: string) => void
}) {
  const isWin  = trade.result === 'WIN'
  const isLoss = trade.result === 'LOSS'
  const accentColor = isWin ? '#00d97e' : isLoss ? '#ff4d4d' : '#2a2a35'

  return (
    <div
      className="group flex items-center gap-5 bg-[#0f0f14] border border-[#1c1c24] rounded-lg px-5 py-4 hover:border-[#2a2a35] hover:bg-[#111118] transition-all"
      style={{ borderLeft: `3px solid ${accentColor}` }}
    >
      {/* Trade number */}
      <span className="mono text-sm font-bold text-[#3a3a48] w-8 shrink-0">{trade.tradeNumber}</span>

      {/* Date */}
      <span className="mono text-sm text-[#4a4a58] shrink-0 hidden sm:block w-32">{formatDate(trade.date)}</span>

      {/* Time */}
      {trade.time && <span className="mono text-sm text-[#3a3a48] shrink-0 hidden md:block">{trade.time}</span>}

      {/* Direction badge */}
      <span className={`inline-flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded border ${
        trade.direction === 'Long'
          ? 'text-[#00d97e] bg-[#00d97e]/6 border-[#00d97e]/20'
          : 'text-[#ff4d4d] bg-[#ff4d4d]/6 border-[#ff4d4d]/20'
      }`}>
        {trade.direction === 'Long' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
        {trade.direction.toUpperCase()}
      </span>

      {/* Strategy */}
      <span className="text-sm text-[#4a4a58] bg-[#0b0b0f] border border-[#1c1c24] px-3 py-1.5 rounded truncate max-w-48 hidden md:block">
        {strategyName}
      </span>

      {/* Result */}
      <span className={`mono text-sm font-bold px-3 py-1.5 rounded border ${
        isWin  ? 'text-[#00d97e] bg-[#00d97e]/8 border-[#00d97e]/25' :
        isLoss ? 'text-[#ff4d4d] bg-[#ff4d4d]/8 border-[#ff4d4d]/25' :
                 'text-[#3a3a48] bg-[#0b0b0f] border-[#1c1c24]'
      }`}>
        {trade.result ?? '—'}
      </span>

      {/* Screenshots */}
      <div className="flex items-center gap-2 ml-auto shrink-0">
        {[trade.referenceScreenshot, trade.entryScreenshot].filter(Boolean).map((src, i) => (
          <img key={i} src={src!} alt="" onClick={() => onImageClick(src!)}
            className="w-20 h-12 object-cover rounded border border-[#1c1c24] cursor-pointer hover:border-[#2a2a35] transition-colors opacity-70 hover:opacity-100" />
        ))}
      </div>

      {/* Actions — visibles au hover */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {[
          { icon: Copy,    fn: onDuplicate, hover: 'hover:text-[#9a9aaa]' },
          { icon: Pencil,  fn: onEdit,      hover: 'hover:text-white'     },
          { icon: Trash2,  fn: onDelete,    hover: 'hover:text-[#ff4d4d]' },
        ].map(({ icon: Icon, fn, hover }) => (
          <button key={hover} onClick={fn}
            className={`p-2 text-[#2a2a35] ${hover} transition-colors cursor-pointer`}>
            <Icon size={15} />
          </button>
        ))}
      </div>
    </div>
  )
}
