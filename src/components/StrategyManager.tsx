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

  function deleteStrategy(id: string) {
    onUpdate(strategies.filter(s => s.id !== id))
  }

  function startEdit(s: Strategy) {
    setEditId(s.id)
    setEditName(s.name)
  }

  function saveEdit() {
    const name = editName.trim()
    if (!name || !editId) { setEditId(null); return }
    onUpdate(strategies.map(s => s.id === editId ? { ...s, name } : s))
    setEditId(null)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-white">Gestion des stratégies</h3>
      <div className="space-y-2">
        {strategies.map(s => (
          <div key={s.id} className="flex items-center gap-3 bg-[#1e1e1e] rounded-lg px-4 py-2.5 border border-[#3a3a3a]">
            {editId === s.id ? (
              <>
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditId(null) }}
                  className="flex-1 bg-transparent text-sm text-white focus:outline-none" autoFocus />
                <button onClick={saveEdit} className="text-[#22c55e] hover:text-green-300 cursor-pointer p-0.5"><Check size={15} /></button>
                <button onClick={() => setEditId(null)} className="text-gray-500 hover:text-gray-300 cursor-pointer p-0.5"><X size={15} /></button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-gray-200">{s.name}</span>
                <button onClick={() => startEdit(s)} className="text-gray-500 hover:text-gray-300 cursor-pointer p-0.5"><Pencil size={14} /></button>
                <button onClick={() => deleteStrategy(s.id)} className="text-gray-500 hover:text-red-400 cursor-pointer p-0.5"><Trash2 size={14} /></button>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addStrategy()}
          placeholder="Nouvelle stratégie..."
          className="flex-1 bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#22c55e] placeholder:text-gray-600" />
        <button onClick={addStrategy}
          className="px-4 py-2.5 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-lg text-[#22c55e] hover:bg-[#22c55e]/20 transition-colors cursor-pointer">
          <Plus size={17} />
        </button>
      </div>
    </div>
  )
}
