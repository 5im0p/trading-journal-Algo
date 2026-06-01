import { useState } from 'react'
import type { Strategy } from '../types'
import { v4 as uuidv4 } from 'uuid'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'

interface Props {
  strategies: Strategy[]
  onUpdate: (strategies: Strategy[]) => void
}

export default function StrategyManager({ strategies, onUpdate }: Props) {
  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  function addStrategy() {
    const name = newName.trim()
    if (!name) return
    onUpdate([...strategies, { id: uuidv4(), name }])
    setNewName('')
  }

  function startEdit(s: Strategy) { setEditId(s.id); setEditName(s.name) }

  function saveEdit() {
    const name = editName.trim()
    if (!name || !editId) { setEditId(null); return }
    onUpdate(strategies.map(s => s.id === editId ? { ...s, name } : s))
    setEditId(null)
  }

  const inputClass = "flex-1 bg-[#0b0b0f] border border-[#1c1c24] rounded px-3.5 py-2.5 text-sm text-[#d1d1d6] focus:outline-none focus:border-[#00d97e]/50 transition-colors placeholder:text-[#2a2a35]"

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 bg-[#00d97e] rounded-full" />
        <h3 className="text-xs font-semibold text-[#3a3a48] tracking-widest uppercase">Stratégies</h3>
      </div>

      <div className="space-y-1.5">
        {strategies.map(s => (
          <div key={s.id}
            className="flex items-center gap-3 bg-[#0b0b0f] border border-[#1c1c24] rounded px-4 py-2.5 hover:border-[#2a2a35] transition-colors group">
            {editId === s.id ? (
              <>
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditId(null) }}
                  className="flex-1 bg-transparent text-sm text-white focus:outline-none" autoFocus />
                <button onClick={saveEdit} className="text-[#00d97e] hover:text-green-300 cursor-pointer p-0.5"><Check size={14} /></button>
                <button onClick={() => setEditId(null)} className="text-[#3a3a48] hover:text-[#9a9aaa] cursor-pointer p-0.5"><X size={14} /></button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-[#9a9aaa]">{s.name}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(s)} className="text-[#3a3a48] hover:text-[#9a9aaa] cursor-pointer p-0.5"><Pencil size={12} /></button>
                  <button onClick={() => onUpdate(strategies.filter(x => x.id !== s.id))} className="text-[#3a3a48] hover:text-[#ff4d4d] cursor-pointer p-0.5"><Trash2 size={12} /></button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addStrategy()}
          placeholder="Nouvelle stratégie..."
          className={inputClass} />
        <button onClick={addStrategy}
          className="px-4 py-2.5 rounded border border-[#00d97e]/30 text-[#00d97e] hover:bg-[#00d97e]/8 hover:border-[#00d97e]/50 transition-colors cursor-pointer">
          <Plus size={15} />
        </button>
      </div>
    </div>
  )
}
