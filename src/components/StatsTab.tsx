import { useState, useMemo } from 'react'
import type { Trade, Strategy } from '../types'
import { calcMaxStreak, getDayColor } from '../utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts'
import { format, eachMonthOfInterval, startOfMonth, endOfMonth } from 'date-fns'
import { fr } from 'date-fns/locale'
import { TrendingUp, TrendingDown, Target, Activity, Award, AlertTriangle } from 'lucide-react'

interface Props {
  trades: Trade[]
  strategies: Strategy[]
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316']

export default function StatsTab({ trades, strategies }: Props) {
  const [filterStrategy, setFilterStrategy] = useState('')
  const [filterResult, setFilterResult] = useState('')
  const [filterDirection, setFilterDirection] = useState('')
  const [filterYear, setFilterYear] = useState('')

  const filtered = useMemo(() => {
    return trades.filter(t => {
      if (filterStrategy && t.strategyId !== filterStrategy) return false
      if (filterResult && t.result !== filterResult) return false
      if (filterDirection && t.direction !== filterDirection) return false
      if (filterYear && !t.date.startsWith(filterYear)) return false
      return true
    })
  }, [trades, filterStrategy, filterResult, filterDirection, filterYear])

  const totalTrades = filtered.length
  const wins = filtered.filter(t => t.result === 'WIN').length
  const losses = filtered.filter(t => t.result === 'LOSS').length
  const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : '—'
  const { maxWin, maxLoss } = calcMaxStreak(filtered)

  // Strategy breakdown
  const strategyStats = strategies.map(s => {
    const st = filtered.filter(t => t.strategyId === s.id)
    const sw = st.filter(t => t.result === 'WIN').length
    const sl = st.filter(t => t.result === 'LOSS').length
    return { ...s, total: st.length, wins: sw, losses: sl, wr: st.length > 0 ? ((sw / st.length) * 100).toFixed(0) : '—' }
  }).filter(s => s.total > 0)

  // Monthly data
  const years = [...new Set(trades.map(t => t.date.slice(0, 4)))].sort()
  const allDates = filtered.map(t => new Date(t.date))
  let monthlyData: { month: string; WIN: number; LOSS: number }[] = []
  if (allDates.length > 0) {
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())))
    const months = eachMonthOfInterval({ start: startOfMonth(minDate), end: endOfMonth(maxDate) })
    monthlyData = months.map(m => {
      const key = format(m, 'yyyy-MM')
      const mt = filtered.filter(t => t.date.startsWith(key))
      return {
        month: format(m, 'MMM yy', { locale: fr }),
        WIN: mt.filter(t => t.result === 'WIN').length,
        LOSS: mt.filter(t => t.result === 'LOSS').length,
      }
    })
  }

  // Pie data
  const pieData = strategyStats.map((s, i) => ({ name: s.name, value: s.total, color: COLORS[i % COLORS.length] }))

  // Heatmap — last 12 months of days
  const heatmapDays = useMemo(() => {
    const result: { date: string; color: 'gray' | 'green' | 'orange' | 'red' | 'empty' }[] = []
    const now = new Date()
    for (let i = 364; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = format(d, 'yyyy-MM-dd')
      const dayTrades = filtered.filter(t => t.date === dateStr)
      result.push({ date: dateStr, color: dayTrades.length > 0 ? getDayColor(dayTrades) : 'empty' })
    }
    return result
  }, [filtered])

  const selectClass = "bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-[#22c55e]"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Statistiques & Analytics</h2>
          <p className="text-xs text-gray-500 mt-0.5">{totalTrades} trade{totalTrades !== 1 ? 's' : ''} dans la sélection</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={filterStrategy} onChange={e => setFilterStrategy(e.target.value)} className={selectClass}>
            <option value="">Toutes stratégies</option>
            {strategies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={filterResult} onChange={e => setFilterResult(e.target.value)} className={selectClass}>
            <option value="">WIN + LOSS</option>
            <option value="WIN">WIN</option>
            <option value="LOSS">LOSS</option>
          </select>
          <select value={filterDirection} onChange={e => setFilterDirection(e.target.value)} className={selectClass}>
            <option value="">Long + Short</option>
            <option value="Long">Long</option>
            <option value="Short">Short</option>
          </select>
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className={selectClass}>
            <option value="">Toutes années</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Total trades" value={totalTrades} Icon={Activity} color="text-gray-300" />
        <KpiCard label="WIN" value={wins} Icon={TrendingUp} color="text-[#22c55e]" />
        <KpiCard label="LOSS" value={losses} Icon={TrendingDown} color="text-[#ef4444]" />
        <KpiCard label="Win Rate" value={winRate === '—' ? '—' : `${winRate}%`} Icon={Target} color={parseFloat(winRate as string) >= 50 ? 'text-[#22c55e]' : 'text-[#ef4444]'} />
        <KpiCard label="Série max gains" value={maxWin} Icon={Award} color="text-[#22c55e]" />
        <KpiCard label="Série max pertes" value={maxLoss} Icon={AlertTriangle} color="text-[#ef4444]" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly bar chart */}
        <div className="lg:col-span-2 bg-[#2a2a2a] rounded-xl border border-[#3a3a3a] p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Évolution mensuelle</h3>
          {monthlyData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-600 text-sm">Aucune donnée</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} barCategoryGap="30%">
                <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1e1e1e', border: '1px solid #3a3a3a', borderRadius: 8, fontSize: 12 }} cursor={{ fill: '#ffffff08' }} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#888' }} />
                <Bar dataKey="WIN" fill="#22c55e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="LOSS" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart */}
        <div className="bg-[#2a2a2a] rounded-xl border border-[#3a3a3a] p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Stratégies</h3>
          {pieData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-600 text-sm">Aucune donnée</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={2}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e1e1e', border: '1px solid #3a3a3a', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: d.color }} />
                    <span className="text-gray-300 truncate flex-1">{d.name}</span>
                    <span className="text-gray-500">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Strategy table */}
      {strategyStats.length > 0 && (
        <div className="bg-[#2a2a2a] rounded-xl border border-[#3a3a3a] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#3a3a3a]">
            <h3 className="text-sm font-semibold text-white">Analyse par stratégie</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-[#3a3a3a]">
                  <th className="text-left px-4 py-2.5 font-medium">Stratégie</th>
                  <th className="text-center px-4 py-2.5 font-medium">Trades</th>
                  <th className="text-center px-4 py-2.5 font-medium text-[#22c55e]">WIN</th>
                  <th className="text-center px-4 py-2.5 font-medium text-[#ef4444]">LOSS</th>
                  <th className="text-center px-4 py-2.5 font-medium">Win Rate</th>
                  <th className="px-4 py-2.5 w-32"></th>
                </tr>
              </thead>
              <tbody>
                {strategyStats.map((s, i) => {
                  const wr = parseFloat(s.wr as string)
                  const barColor = wr >= 60 ? '#22c55e' : wr >= 40 ? '#f59e0b' : '#ef4444'
                  return (
                    <tr key={s.id} className={`text-sm ${i < strategyStats.length - 1 ? 'border-b border-[#2e2e2e]' : ''}`}>
                      <td className="px-4 py-3 text-gray-200 font-medium">{s.name}</td>
                      <td className="px-4 py-3 text-center text-gray-300">{s.total}</td>
                      <td className="px-4 py-3 text-center text-[#22c55e] font-semibold">{s.wins}</td>
                      <td className="px-4 py-3 text-center text-[#ef4444] font-semibold">{s.losses}</td>
                      <td className="px-4 py-3 text-center font-bold" style={{ color: barColor }}>{s.wr}{s.wr !== '—' ? '%' : ''}</td>
                      <td className="px-4 py-3">
                        {s.wr !== '—' && (
                          <div className="h-1.5 bg-[#1e1e1e] rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${s.wr}%`, background: barColor }} />
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Heatmap */}
      <div className="bg-[#2a2a2a] rounded-xl border border-[#3a3a3a] p-4">
        <h3 className="text-sm font-semibold text-white mb-4">Heatmap des 365 derniers jours</h3>
        <div className="overflow-x-auto">
          <div className="flex gap-0.5 flex-wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(52, 1fr)', gap: '2px' }}>
            {heatmapDays.map(({ date, color }) => {
              const bg = color === 'green' ? '#22c55e' : color === 'orange' ? '#f59e0b' : color === 'red' ? '#ef4444' : color === 'gray' ? '#3a3a3a' : '#222'
              return (
                <div key={date} title={date} style={{ background: bg, opacity: color === 'empty' ? 0.3 : 1 }}
                  className="w-full aspect-square rounded-sm" />
              )
            })}
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
          {[['#22c55e', 'WIN'], ['#f59e0b', 'Mitigé'], ['#ef4444', 'LOSS'], ['#3a3a3a', 'Aucun résultat']].map(([bg, label]) => (
            <div key={label} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: bg }} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function KpiCard({ label, value, Icon, color }: { label: string; value: number | string; Icon: typeof Activity; color: string }) {
  return (
    <div className="bg-[#2a2a2a] rounded-xl border border-[#3a3a3a] p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">{label}</span>
        <Icon size={14} className={color} />
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  )
}
