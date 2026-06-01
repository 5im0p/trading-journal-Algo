import { useState } from 'react'
import type { Trade, Strategy, Direction, TradeResult, TradeNumber } from '../types'
import { createTrade } from '../store'
import { toBase64 } from '../utils'
import { X, TrendingUp, TrendingDown, ClipboardPaste } from 'lucide-react'

interface Props {
  trades: Trade[]
  strategies: Strategy[]
  editTrade?: Trade
  onSave: (trade: Trade) => void
  onCancel: () => void
}

export default function TradeForm({ trades, strategies, editTrade, onSave, onCancel }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(editTrade?.date ?? today)
  const [time, setTime] = useState(editTrade?.time ?? '')
  const [tradeNumber, setTradeNumber] = useState<TradeNumber>(editTrade?.tradeNumber ?? 'T1')
  const [direction, setDirection] = useState<Direction>(editTrade?.direction ?? 'Long')
  const [strategyId, setStrategyId] = useState(editTrade?.strategyId ?? strategies[0]?.id ?? '')
  const [result, setResult] = useState<TradeResult | undefined>(editTrade?.result)
  const [entryScreenshot, setEntryScreenshot] = useState<string | undefined>(editTrade?.entryScreenshot)
  const [referenceScreenshot, setReferenceScreenshot] = useState<string | undefined>(editTrade?.referenceScreenshot)
  const tradesOnDate = trades.filter(t => t.date === date && t.id !== editTrade?.id)
  const usedNumbers = tradesOnDate.map(t => t.tradeNumber)
  const canAdd = usedNumbers.length < 2 || !!editTrade

  async function handlePaste(e: React.ClipboardEvent, setter: (s: string) => void) {
    const items = Array.from(e.clipboardData.items)
    const imageItem = items.find(item => item.type.startsWith('image/'))
    if (imageItem) {
      e.preventDefault()
      const file = imageItem.getAsFile()
      if (file) {
        const b64 = await toBase64(file)
        setter(b64)
      }
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!strategyId) return
    const data = { date, time: time || undefined, tradeNumber, direction, strategyId, result, entryScreenshot, referenceScreenshot }
    if (editTrade) {
      onSave({ ...editTrade, ...data, updatedAt: new Date().toISOString() })
    } else {
      onSave(createTrade(data))
    }
  }

  const inputClass = "w-full bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#22c55e] transition-colors"
  const labelClass = "block text-sm font-medium text-gray-400 mb-2"

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required
            className={inputClass + " [color-scheme:dark]"} />
        </div>
        <div>
          <label className={labelClass}>Heure (optionnel)</label>
          <input type="time" value={time} onChange={e => setTime(e.target.value)}
            className={inputClass + " [color-scheme:dark]"} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Numéro du trade</label>
          <div className="flex gap-2">
            {(['T1', 'T2'] as TradeNumber[]).map(n => {
              const blocked = !editTrade && usedNumbers.includes(n)
              return (
                <button key={n} type="button" disabled={blocked}
                  onClick={() => setTradeNumber(n)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors cursor-pointer ${
                    tradeNumber === n
                      ? 'bg-[#22c55e]/20 border-[#22c55e]/60 text-[#22c55e]'
                      : blocked
                        ? 'opacity-30 border-[#3a3a3a] text-gray-500 cursor-not-allowed'
                        : 'border-[#3a3a3a] text-gray-300 hover:border-[#555]'
                  }`}
                >{n}</button>
              )
            })}
          </div>
          {!editTrade && usedNumbers.length === 2 && (
            <p className="text-sm text-red-400 mt-1.5">Max 2 trades par jour atteint.</p>
          )}
        </div>
        <div>
          <label className={labelClass}>Direction</label>
          <div className="flex gap-2">
            {(['Long', 'Short'] as Direction[]).map(d => (
              <button key={d} type="button" onClick={() => setDirection(d)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  direction === d
                    ? d === 'Long'
                      ? 'bg-[#22c55e]/20 border-[#22c55e]/60 text-[#22c55e]'
                      : 'bg-red-500/20 border-red-500/60 text-red-400'
                    : 'border-[#3a3a3a] text-gray-300 hover:border-[#555]'
                }`}
              >
                {d === 'Long' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className={labelClass}>Stratégie</label>
        <select value={strategyId} onChange={e => setStrategyId(e.target.value)} required
          className={inputClass}>
          <option value="">-- Choisir une stratégie --</option>
          {strategies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div>
        <label className={labelClass}>Résultat</label>
        <div className="flex gap-2">
          {(['WIN', 'LOSS'] as TradeResult[]).map(r => (
            <button key={r} type="button" onClick={() => setResult(result === r ? undefined : r)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition-colors cursor-pointer ${
                result === r
                  ? r === 'WIN'
                    ? 'bg-[#22c55e]/20 border-[#22c55e]/60 text-[#22c55e]'
                    : 'bg-red-500/20 border-red-500/60 text-red-400'
                  : 'border-[#3a3a3a] text-gray-400 hover:border-[#555]'
              }`}
            >{r}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ImageUpload
          label="Screenshot d'entrée"
          value={entryScreenshot}
          onClear={() => setEntryScreenshot(undefined)}
          onPaste={e => handlePaste(e, setEntryScreenshot)}
        />
        <ImageUpload
          label="Screenshot de référence"
          value={referenceScreenshot}
          onClear={() => setReferenceScreenshot(undefined)}
          onPaste={e => handlePaste(e, setReferenceScreenshot)}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2.5 rounded-lg border border-[#3a3a3a] text-gray-400 text-sm font-medium hover:bg-[#2a2a2a] transition-colors cursor-pointer">
          Annuler
        </button>
        <button type="submit" disabled={!canAdd && !editTrade}
          className="flex-1 py-2.5 rounded-lg bg-[#22c55e] text-black text-sm font-semibold hover:bg-[#16a34a] transition-colors disabled:opacity-40 cursor-pointer">
          {editTrade ? 'Enregistrer' : 'Ajouter le trade'}
        </button>
      </div>
    </form>
  )
}

function ImageUpload({ label, value, onClear, onPaste }: {
  label: string
  value?: string
  onClear: () => void
  onPaste: (e: React.ClipboardEvent) => void
}) {
  return (
    <div>
      <p className="block text-sm font-medium text-gray-400 mb-2">{label}</p>
      {value ? (
        <div className="relative rounded-lg overflow-hidden border border-[#3a3a3a] aspect-video">
          <img src={value} alt="" className="w-full h-full object-cover" />
          <button type="button" onClick={onClear}
            className="absolute top-1.5 right-1.5 w-7 h-7 bg-black/70 rounded-full flex items-center justify-center hover:bg-black/90 cursor-pointer">
            <X size={13} className="text-white" />
          </button>
        </div>
      ) : (
        <div
          onPaste={onPaste}
          tabIndex={0}
          className="w-full border border-dashed border-[#3a3a3a] rounded-lg aspect-video flex flex-col items-center justify-center gap-2 hover:border-[#22c55e]/50 focus:border-[#22c55e] transition-colors focus:outline-none cursor-default select-none"
        >
          <ClipboardPaste size={22} className="text-gray-500" />
          <span className="text-sm text-gray-400 font-medium">Cliquer ici puis Ctrl+V</span>
          <span className="text-xs text-gray-600">Coller directement depuis TradingView</span>
        </div>
      )}
    </div>
  )
}
