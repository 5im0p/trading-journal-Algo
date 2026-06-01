import { useState, useRef, useEffect, type RefObject } from 'react'
import type { Trade, Strategy, Direction, TradeResult, TradeNumber } from '../types'
import { createTrade } from '../store'
import { toBase64 } from '../utils'
import { Upload, X, TrendingUp, TrendingDown, Clipboard } from 'lucide-react'

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
  const entryRef = useRef<HTMLInputElement>(null)
  const refRef = useRef<HTMLInputElement>(null)

  const tradesOnDate = trades.filter(t => t.date === date && t.id !== editTrade?.id)
  const usedNumbers = tradesOnDate.map(t => t.tradeNumber)
  const availableNumbers: TradeNumber[] = (['T1', 'T2'] as TradeNumber[]).filter(n => !usedNumbers.includes(n))
  if (!availableNumbers.includes(tradeNumber) && availableNumbers.length > 0) {
    // auto-select available
  }
  const canAdd = availableNumbers.length > 0 || editTrade

  async function handleImage(file: File, setter: (s: string) => void) {
    const b64 = await toBase64(file)
    setter(b64)
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

  const inputClass = "w-full bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#22c55e] transition-colors"
  const labelClass = "block text-xs font-medium text-gray-400 mb-1.5"

  // Paste global sur le formulaire : remplit le premier screenshot vide
  function handleFormPaste(e: React.ClipboardEvent<HTMLFormElement>) {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (!file) break
        toBase64(file).then(b64 => {
          if (!entryScreenshot) setEntryScreenshot(b64)
          else if (!referenceScreenshot) setReferenceScreenshot(b64)
        })
        break
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} onPaste={handleFormPaste} className="space-y-5">
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
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors cursor-pointer ${
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
            <p className="text-xs text-red-400 mt-1">Max 2 trades par jour atteint.</p>
          )}
        </div>
        <div>
          <label className={labelClass}>Direction</label>
          <div className="flex gap-2">
            {(['Long', 'Short'] as Direction[]).map(d => (
              <button key={d} type="button" onClick={() => setDirection(d)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  direction === d
                    ? d === 'Long'
                      ? 'bg-[#22c55e]/20 border-[#22c55e]/60 text-[#22c55e]'
                      : 'bg-red-500/20 border-red-500/60 text-red-400'
                    : 'border-[#3a3a3a] text-gray-300 hover:border-[#555]'
                }`}
              >
                {d === 'Long' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
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
              className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors cursor-pointer ${
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
        <ImageUpload label="Screenshot d'entrée" value={entryScreenshot} inputRef={entryRef}
          onChange={f => handleImage(f, setEntryScreenshot)} onClear={() => setEntryScreenshot(undefined)}
          onPaste={b64 => setEntryScreenshot(b64)} />
        <ImageUpload label="Screenshot de référence" value={referenceScreenshot} inputRef={refRef}
          onChange={f => handleImage(f, setReferenceScreenshot)} onClear={() => setReferenceScreenshot(undefined)}
          onPaste={b64 => setReferenceScreenshot(b64)} />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2 rounded-lg border border-[#3a3a3a] text-gray-400 text-sm hover:bg-[#2a2a2a] transition-colors cursor-pointer">
          Annuler
        </button>
        <button type="submit" disabled={!canAdd && !editTrade}
          className="flex-1 py-2 rounded-lg bg-[#22c55e] text-black text-sm font-semibold hover:bg-[#16a34a] transition-colors disabled:opacity-40 cursor-pointer">
          {editTrade ? 'Enregistrer' : 'Ajouter le trade'}
        </button>
      </div>
    </form>
  )
}

function ImageUpload({ label, value, inputRef, onChange, onClear, onPaste }: {
  label: string
  value?: string
  inputRef: RefObject<HTMLInputElement | null>
  onChange: (f: File) => void
  onClear: () => void
  onPaste: (b64: string) => void
}) {
  const [pasted, setPasted] = useState(false)
  const [focused, setFocused] = useState(false)
  const zoneRef = useRef<HTMLDivElement>(null)

  // Global paste listener: quand la zone est focused OU quand on est en train d'interagir avec le formulaire
  useEffect(() => {
    function handleGlobalPaste(e: ClipboardEvent) {
      // Si une image est déjà présente et que la zone n'est pas focused, ignorer
      if (value && !focused) return
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (!file) continue
          const reader = new FileReader()
          reader.onload = () => {
            onPaste(reader.result as string)
            setPasted(true)
            setTimeout(() => setPasted(false), 2000)
          }
          reader.readAsDataURL(file)
          break
        }
      }
    }
    // Écoute le paste global uniquement quand la zone est focused (tabIndex)
    const el = zoneRef.current
    el?.addEventListener('paste', handleGlobalPaste as EventListener)
    return () => el?.removeEventListener('paste', handleGlobalPaste as EventListener)
  }, [focused, value, onPaste])

  return (
    <div>
      <p className="block text-xs font-medium text-gray-400 mb-1.5">{label}</p>
      {value ? (
        <div className="relative rounded-lg overflow-hidden border border-[#3a3a3a] aspect-video group">
          <img src={value} alt="" className="w-full h-full object-cover" />
          {pasted && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#22c55e]/20 border border-[#22c55e]/40 rounded-lg">
              <span className="text-xs text-[#22c55e] font-semibold bg-black/60 px-2 py-1 rounded">✓ Collé</span>
            </div>
          )}
          <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button type="button" title="Remplacer par fichier" onClick={() => inputRef.current?.click()}
              className="w-6 h-6 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 cursor-pointer">
              <Upload size={10} className="text-white" />
            </button>
            <button type="button" onClick={onClear}
              className="w-6 h-6 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 cursor-pointer">
              <X size={10} className="text-white" />
            </button>
          </div>
        </div>
      ) : (
        <div
          ref={zoneRef}
          tabIndex={0}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`w-full border border-dashed rounded-lg aspect-video flex flex-col items-center justify-center gap-2 transition-colors outline-none
            ${focused
              ? 'border-[#22c55e]/60 bg-[#22c55e]/5 ring-1 ring-[#22c55e]/20'
              : 'border-[#3a3a3a] hover:border-[#555]'
            }
            ${pasted ? 'border-[#22c55e] bg-[#22c55e]/10' : ''}`}
        >
          {pasted ? (
            <span className="text-sm text-[#22c55e] font-semibold">✓ Image collée !</span>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => inputRef.current?.click()}>
                  <Upload size={15} className="text-gray-500" />
                  <span className="text-[10px] text-gray-600">Fichier</span>
                </div>
                <div className="w-px h-6 bg-[#3a3a3a]" />
                <div className="flex flex-col items-center gap-1">
                  <Clipboard size={15} className={focused ? 'text-[#22c55e]' : 'text-gray-500'} />
                  <span className={`text-[10px] ${focused ? 'text-[#22c55e]' : 'text-gray-600'}`}>Ctrl+V</span>
                </div>
              </div>
              <span className="text-[10px] text-gray-600">
                {focused ? 'Prêt — colle ton screenshot TradingView' : 'Clic pour focus · Ctrl+V pour coller'}
              </span>
            </>
          )}
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
        onChange={e => e.target.files?.[0] && onChange(e.target.files[0])} />
    </div>
  )
}
