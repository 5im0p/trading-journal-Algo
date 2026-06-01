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

  const usedNumbers = trades.filter(t => t.date === date && t.id !== editTrade?.id).map(t => t.tradeNumber)
  const canAdd = usedNumbers.length < 2 || !!editTrade

  async function handlePaste(e: React.ClipboardEvent, setter: (s: string) => void) {
    const item = Array.from(e.clipboardData.items).find(i => i.type.startsWith('image/'))
    if (item) {
      e.preventDefault()
      const file = item.getAsFile()
      if (file) setter(await toBase64(file))
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!strategyId) return
    const data = { date, time: time || undefined, tradeNumber, direction, strategyId, result, entryScreenshot, referenceScreenshot }
    onSave(editTrade ? { ...editTrade, ...data, updatedAt: new Date().toISOString() } : createTrade(data))
  }

  const inputClass = "w-full bg-[#0b0b0f] border border-[#1c1c24] rounded px-3.5 py-2.5 text-sm text-[#d1d1d6] focus:outline-none focus:border-[#00d97e]/50 transition-colors mono placeholder:text-[#2a2a35]"
  const labelClass = "block text-xs font-semibold text-[#3a3a48] mb-2 tracking-widest uppercase"

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Heure</label>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Trade number */}
        <div>
          <label className={labelClass}>Position</label>
          <div className="flex gap-2">
            {(['T1', 'T2'] as TradeNumber[]).map(n => {
              const blocked = !editTrade && usedNumbers.includes(n)
              return (
                <button key={n} type="button" disabled={blocked} onClick={() => setTradeNumber(n)}
                  className={`flex-1 py-2.5 rounded border text-xs font-bold mono tracking-widest transition-colors cursor-pointer ${
                    tradeNumber === n
                      ? 'bg-[#00d97e]/10 border-[#00d97e]/40 text-[#00d97e]'
                      : blocked
                        ? 'opacity-20 border-[#1c1c24] text-[#3a3a48] cursor-not-allowed'
                        : 'border-[#1c1c24] text-[#3a3a48] hover:border-[#2a2a35] hover:text-[#9a9aaa]'
                  }`}>
                  {n}
                </button>
              )
            })}
          </div>
          {!editTrade && usedNumbers.length === 2 && (
            <p className="text-xs text-[#ff4d4d] mt-1.5 mono">MAX 2 TRADES / JOUR</p>
          )}
        </div>

        {/* Direction */}
        <div>
          <label className={labelClass}>Direction</label>
          <div className="flex gap-2">
            {(['Long', 'Short'] as Direction[]).map(d => (
              <button key={d} type="button" onClick={() => setDirection(d)}
                className={`flex-1 py-2.5 rounded border flex items-center justify-center gap-2 text-xs font-bold tracking-widest transition-colors cursor-pointer ${
                  direction === d
                    ? d === 'Long'
                      ? 'bg-[#00d97e]/10 border-[#00d97e]/40 text-[#00d97e]'
                      : 'bg-[#ff4d4d]/10 border-[#ff4d4d]/40 text-[#ff4d4d]'
                    : 'border-[#1c1c24] text-[#3a3a48] hover:border-[#2a2a35] hover:text-[#9a9aaa]'
                }`}>
                {d === 'Long' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {d.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Strategy */}
      <div>
        <label className={labelClass}>Stratégie</label>
        <select value={strategyId} onChange={e => setStrategyId(e.target.value)} required className={inputClass}>
          <option value="">-- Sélectionner --</option>
          {strategies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Result */}
      <div>
        <label className={labelClass}>Résultat</label>
        <div className="flex gap-2">
          {(['WIN', 'LOSS'] as TradeResult[]).map(r => (
            <button key={r} type="button" onClick={() => setResult(result === r ? undefined : r)}
              className={`flex-1 py-2.5 rounded border text-xs font-bold mono tracking-widest transition-colors cursor-pointer ${
                result === r
                  ? r === 'WIN'
                    ? 'bg-[#00d97e]/10 border-[#00d97e]/40 text-[#00d97e]'
                    : 'bg-[#ff4d4d]/10 border-[#ff4d4d]/40 text-[#ff4d4d]'
                  : 'border-[#1c1c24] text-[#3a3a48] hover:border-[#2a2a35] hover:text-[#9a9aaa]'
              }`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Screenshots */}
      <div className="grid grid-cols-2 gap-4">
        <PasteZone label="SCREENSHOT ENTRÉE"   value={entryScreenshot}     onClear={() => setEntryScreenshot(undefined)}     onPaste={e => handlePaste(e, setEntryScreenshot)} />
        <PasteZone label="SCREENSHOT RÉFÉRENCE" value={referenceScreenshot} onClear={() => setReferenceScreenshot(undefined)} onPaste={e => handlePaste(e, setReferenceScreenshot)} />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2.5 rounded border border-[#1c1c24] text-[#4a4a58] text-xs font-semibold tracking-widest uppercase hover:bg-[#1c1c24] hover:text-[#9a9aaa] transition-colors cursor-pointer">
          Annuler
        </button>
        <button type="submit" disabled={!canAdd && !editTrade}
          className="flex-1 py-2.5 rounded border border-[#00d97e]/40 bg-[#00d97e]/8 text-[#00d97e] text-xs font-semibold tracking-widest uppercase hover:bg-[#00d97e]/15 hover:border-[#00d97e]/60 transition-colors disabled:opacity-30 cursor-pointer">
          {editTrade ? 'Enregistrer' : 'Ajouter'}
        </button>
      </div>
    </form>
  )
}

function PasteZone({ label, value, onClear, onPaste }: {
  label: string; value?: string; onClear: () => void; onPaste: (e: React.ClipboardEvent) => void
}) {
  return (
    <div>
      <p className="block text-xs font-semibold text-[#3a3a48] mb-2 tracking-widest uppercase">{label}</p>
      {value ? (
        <div className="relative rounded border border-[#1c1c24] aspect-video overflow-hidden">
          <img src={value} alt="" className="w-full h-full object-cover" />
          <button type="button" onClick={onClear}
            className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/80 rounded flex items-center justify-center hover:bg-black cursor-pointer border border-[#2a2a35]">
            <X size={11} className="text-[#9a9aaa]" />
          </button>
        </div>
      ) : (
        <div
          onPaste={onPaste}
          tabIndex={0}
          className="w-full border border-dashed border-[#1c1c24] rounded aspect-video flex flex-col items-center justify-center gap-2.5 hover:border-[#00d97e]/30 focus:border-[#00d97e]/50 transition-colors focus:outline-none cursor-default select-none"
        >
          <ClipboardPaste size={18} className="text-[#2a2a35]" />
          <span className="mono text-xs text-[#3a3a48] tracking-wider">CLIQUER + CTRL+V</span>
        </div>
      )}
    </div>
  )
}
