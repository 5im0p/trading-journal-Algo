import { useState } from 'react'
import type { Trade, Strategy } from '../types'
import TradeForm from './TradeForm'
import StrategyManager from './StrategyManager'
import { Plus, Pencil, Trash2, Copy, TrendingUp, TrendingDown, Settings, X } from 'lucide-react'
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
    if (editTrade) {
      onUpdateTrades(trades.map(t => t.id === trade.id ? trade : t))
    } else {
      onUpdateTrades([...trades, trade])
    }
    setShowForm(false)
    setEditTrade(undefined)
  }

  function handleDelete(id: string) {
    if (confirm('Supprimer ce trade ?')) {
      onUpdateTrades(trades.filter(t => t.id !== id))
    }
  }

  function handleDuplicate(trade: Trade) {
    const { id: _, createdAt: __, updatedAt: ___, ...rest } = trade
    const now = new Date().toISOString()
    const today = now.slice(0, 10)
    const dayTrades = trades.filter(t => t.date === today)
    const usedNumbers = dayTrades.map(t => t.tradeNumber)
    const freeNumber = (['T1', 'T2'] as const).find(n => !usedNumbers.includes(n))
    if (!freeNumber) { alert('Max 2 trades par jour déjà atteint pour aujourd\'hui.'); return }
    onUpdateTrades([...trades, { ...rest, id: crypto.randomUUID(), date: today, tradeNumber: freeNumber, createdAt: now, updatedAt: now }])
  }

  function getStrategyName(id: string) {
    return strategies.find(s => s.id === id)?.name ?? '—'
  }

  const sortedTrades = [...trades].sort((a, b) => b.date.localeCompare(a.date) || a.tradeNumber.localeCompare(b.tradeNumber))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Saisie des Trades</h2>
          <p className="text-sm text-gray-500 mt-0.5">{trades.length} trade{trades.length !== 1 ? 's' : ''} enregistré{trades.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowStrategyManager(!showStrategyManager)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors cursor-pointer ${showStrategyManager ? 'bg-[#2a2a2a] border-[#444] text-white' : 'border-[#3a3a3a] text-gray-400 hover:text-white hover:bg-[#2a2a2a]'}`}>
            <Settings size={14} /> Stratégies
          </button>
          <button onClick={() => { setEditTrade(undefined); setShowForm(true) }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#22c55e] text-black text-sm font-semibold hover:bg-[#16a34a] transition-colors cursor-pointer">
            <Plus size={14} /> Nouveau trade
          </button>
        </div>
      </div>

      {showStrategyManager && (
        <div className="bg-[#2a2a2a] rounded-xl border border-[#3a3a3a] p-4">
          <StrategyManager strategies={strategies} onUpdate={onUpdateStrategies} />
        </div>
      )}

      {showForm && (
        <div className="bg-[#2a2a2a] rounded-xl border border-[#3a3a3a] p-5">
          <h3 className="text-sm font-semibold text-white mb-4">{editTrade ? 'Modifier le trade' : 'Nouveau trade'}</h3>
          <TradeForm trades={trades} strategies={strategies} editTrade={editTrade}
            onSave={handleSave} onCancel={() => { setShowForm(false); setEditTrade(undefined) }} />
        </div>
      )}

      <div className="space-y-2">
        {sortedTrades.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <TrendingUp size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucun trade enregistré.</p>
            <p className="text-xs mt-1">Cliquez sur "Nouveau trade" pour commencer.</p>
          </div>
        )}
        {sortedTrades.map(trade => (
          <TradeRow key={trade.id} trade={trade} strategyName={getStrategyName(trade.strategyId)}
            onEdit={() => { setEditTrade(trade); setShowForm(true) }}
            onDelete={() => handleDelete(trade.id)}
            onDuplicate={() => handleDuplicate(trade)}
            onImageClick={setImageModal}
          />
        ))}
      </div>

      {imageModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setImageModal(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-gray-300 cursor-pointer" onClick={() => setImageModal(null)}>
            <X size={24} />
          </button>
          <img src={imageModal} alt="" className="max-w-full max-h-full rounded-lg object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}

function TradeRow({ trade, strategyName, onEdit, onDelete, onDuplicate, onImageClick }: {
  trade: Trade
  strategyName: string
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
  onImageClick: (url: string) => void
}) {
  const resultColor = trade.result === 'WIN' ? 'text-[#22c55e] bg-[#22c55e]/10 border-[#22c55e]/30' :
    trade.result === 'LOSS' ? 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/30' :
    'text-gray-400 bg-[#2a2a2a] border-[#3a3a3a]'

  return (
    <div className="flex items-center gap-3 bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl px-4 py-3 hover:border-[#444] transition-colors">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="text-xs font-bold text-gray-400 w-6 shrink-0">{trade.tradeNumber}</span>
        <div className="text-xs text-gray-400 shrink-0 hidden sm:block">{formatDate(trade.date)}{trade.time && <span className="ml-1 text-gray-600">{trade.time}</span>}</div>
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${trade.direction === 'Long' ? 'text-[#22c55e] bg-[#22c55e]/10' : 'text-[#ef4444] bg-[#ef4444]/10'}`}>
          {trade.direction === 'Long' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {trade.direction}
        </span>
        <span className="text-xs text-gray-300 bg-[#1e1e1e] border border-[#3a3a3a] px-2 py-0.5 rounded-full truncate max-w-24 hidden md:block">{strategyName}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${resultColor}`}>
          {trade.result ?? '—'}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {trade.referenceScreenshot && (
          <img src={trade.referenceScreenshot} alt="" onClick={() => onImageClick(trade.referenceScreenshot!)}
            className="w-10 h-7 object-cover rounded border border-[#3a3a3a] cursor-pointer hover:border-[#555]" />
        )}
        {trade.entryScreenshot && (
          <img src={trade.entryScreenshot} alt="" onClick={() => onImageClick(trade.entryScreenshot!)}
            className="w-10 h-7 object-cover rounded border border-[#3a3a3a] cursor-pointer hover:border-[#555]" />
        )}
        <button onClick={onDuplicate} title="Dupliquer" className="text-gray-500 hover:text-gray-300 transition-colors p-1 cursor-pointer"><Copy size={13} /></button>
        <button onClick={onEdit} title="Modifier" className="text-gray-500 hover:text-white transition-colors p-1 cursor-pointer"><Pencil size={13} /></button>
        <button onClick={onDelete} title="Supprimer" className="text-gray-500 hover:text-red-400 transition-colors p-1 cursor-pointer"><Trash2 size={13} /></button>
      </div>
    </div>
  )
}
