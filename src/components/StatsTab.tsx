import { useState, useMemo } from 'react'
import type { Trade, Strategy } from '../types'
import { calcMaxStreak, getDayColor } from '../utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts'
import { format, eachMonthOfInterval, startOfMonth, endOfMonth } from 'date-fns'
import { fr } from 'date-fns/locale'
import { TrendingUp, TrendingDown, Target, Activity, Award, AlertTriangle } from 'lucide-react'

interface Props { trades: Trade[]; strategies: Strategy[] }
const COLORS = ['#00d97e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316']

export default function StatsTab({ trades, strategies }: Props) {
  const [fStrat, setFStrat] = useState('')
  const [fResult, setFResult] = useState('')
  const [fDir, setFDir] = useState('')
  const [fYear, setFYear] = useState('')

  const filtered = useMemo(() => trades.filter(t =>
    (!fStrat || t.strategyId === fStrat) &&
    (!fResult || t.result === fResult) &&
    (!fDir || t.direction === fDir) &&
    (!fYear || t.date.startsWith(fYear))
  ), [trades, fStrat, fResult, fDir, fYear])

  const total = filtered.length
  const wins = filtered.filter(t => t.result === 'WIN').length
  const losses = filtered.filter(t => t.result === 'LOSS').length
  const wr = total > 0 ? ((wins / filtered.filter(t=>t.result).length) * 100).toFixed(1) : '—'
  const { maxWin, maxLoss } = calcMaxStreak(filtered)

  const stratStats = strategies.map(s => {
    const st = filtered.filter(t => t.strategyId === s.id)
    const sw = st.filter(t => t.result === 'WIN').length
    const sl = st.filter(t => t.result === 'LOSS').length
    return { ...s, total: st.length, wins: sw, losses: sl, wr: st.length > 0 ? ((sw / st.length) * 100).toFixed(0) : '—' }
  }).filter(s => s.total > 0)

  const years = [...new Set(trades.map(t => t.date.slice(0, 4)))].sort()
  const allDates = filtered.map(t => new Date(t.date))
  let monthlyData: { month: string; WIN: number; LOSS: number }[] = []
  if (allDates.length > 0) {
    const months = eachMonthOfInterval({ start: startOfMonth(new Date(Math.min(...allDates.map(d=>d.getTime())))), end: endOfMonth(new Date(Math.max(...allDates.map(d=>d.getTime())))) })
    monthlyData = months.map(m => {
      const key = format(m, 'yyyy-MM')
      const mt = filtered.filter(t => t.date.startsWith(key))
      return { month: format(m, 'MMM yy', { locale: fr }), WIN: mt.filter(t=>t.result==='WIN').length, LOSS: mt.filter(t=>t.result==='LOSS').length }
    })
  }

  const pieData = stratStats.map((s, i) => ({ name: s.name, value: s.total, color: COLORS[i % COLORS.length] }))

  const heatmapDays = useMemo(() => {
    const result: { date: string; color: string }[] = []
    const now = new Date()
    for (let i = 364; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i)
      const ds = format(d, 'yyyy-MM-dd')
      const dt = filtered.filter(t => t.date === ds)
      const c = getDayColor(dt)
      result.push({ date: ds, color: dt.length > 0 ? c : 'empty' })
    }
    return result
  }, [filtered])

  const selectClass = "bg-[#0b0b0f] border border-[#1c1c24] rounded px-3 py-2 text-xs mono text-[#9a9aaa] focus:outline-none focus:border-[#00d97e]/40 tracking-wider cursor-pointer"

  const tooltipStyle = { contentStyle: { background: '#0f0f14', border: '1px solid #1c1c24', borderRadius: 6, fontSize: 12, color: '#d1d1d6' }, cursor: { fill: '#ffffff04' } }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-[#3a3a48] mono tracking-widest uppercase">Journal</span>
            <span className="text-[#1c1c24]">/</span>
            <span className="text-sm text-[#00d97e] mono tracking-widest uppercase">Analytics</span>
          </div>
          <div className="flex items-center gap-5">
            <span className="mono text-4xl font-bold text-white">{total}</span>
            <span className="text-[#3a3a48] text-base">trades dans la sélection</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { value: fStrat, onChange: setFStrat, options: [['', 'Toutes stratégies'], ...strategies.map(s => [s.id, s.name])] },
            { value: fResult, onChange: setFResult, options: [['', 'WIN + LOSS'], ['WIN', 'WIN'], ['LOSS', 'LOSS']] },
            { value: fDir, onChange: setFDir, options: [['', 'LONG + SHORT'], ['Long', 'LONG'], ['Short', 'SHORT']] },
            { value: fYear, onChange: setFYear, options: [['', 'Toutes années'], ...years.map(y => [y, y])] },
          ].map((sel, i) => (
            <select key={i} value={sel.value} onChange={e => sel.onChange(e.target.value)} className={selectClass}>
              {sel.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi label="TRADES"      value={total}                                           icon={<Activity size={13} />}      color="text-[#9a9aaa]"  />
        <Kpi label="WIN"         value={wins}                                            icon={<TrendingUp size={13} />}    color="text-[#00d97e]"  />
        <Kpi label="LOSS"        value={losses}                                          icon={<TrendingDown size={13} />}  color="text-[#ff4d4d]"  />
        <Kpi label="WIN RATE"    value={wr === '—' ? '—' : `${wr}%`}                    icon={<Target size={13} />}        color={parseFloat(wr as string) >= 50 ? 'text-[#00d97e]' : 'text-[#ff4d4d]'} />
        <Kpi label="STREAK +"    value={maxWin}                                          icon={<Award size={13} />}         color="text-[#00d97e]"  />
        <Kpi label="STREAK −"    value={maxLoss}                                         icon={<AlertTriangle size={13} />} color="text-[#ff4d4d]"  />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-[#0f0f14] border border-[#1c1c24] rounded-xl p-5">
          <SectionTitle>Évolution mensuelle</SectionTitle>
          {monthlyData.length === 0
            ? <Empty />
            : <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData} barCategoryGap="35%">
                  <XAxis dataKey="month" tick={{ fill: '#3a3a48', fontSize: 11, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: '#3a3a48', fontSize: 11, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#3a3a48', fontFamily: 'monospace' }} />
                  <Bar dataKey="WIN" fill="#00d97e" radius={[2,2,0,0]} />
                  <Bar dataKey="LOSS" fill="#ff4d4d" radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
          }
        </div>

        <div className="bg-[#0f0f14] border border-[#1c1c24] rounded-xl p-5">
          <SectionTitle>Stratégies</SectionTitle>
          {pieData.length === 0
            ? <Empty />
            : <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={72} dataKey="value" paddingAngle={3}>
                      {pieData.map((e, i) => <Cell key={i} fill={e.color} opacity={0.85} />)}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-3">
                  {pieData.map(d => (
                    <div key={d.name} className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: d.color }} />
                      <span className="text-[#4a4a58] truncate flex-1">{d.name}</span>
                      <span className="mono text-[#3a3a48]">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
          }
        </div>
      </div>

      {/* Strategy table */}
      {stratStats.length > 0 && (
        <div className="bg-[#0f0f14] border border-[#1c1c24] rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#1c1c24]">
            <SectionTitle>Analyse par stratégie</SectionTitle>
          </div>
          <table className="w-full">
            <thead>
              <tr className="mono text-xs text-[#2a2a35] tracking-widest border-b border-[#1c1c24]">
                {['STRATÉGIE','TRADES','WIN','LOSS','WIN RATE',''].map((h,i) => (
                  <th key={i} className={`px-5 py-3 font-medium ${i===0?'text-left':'text-center'} ${h==='WIN'?'text-[#00d97e]/50':h==='LOSS'?'text-[#ff4d4d]/50':''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stratStats.map((s, i) => {
                const wr = parseFloat(s.wr as string)
                const c = wr >= 60 ? '#00d97e' : wr >= 40 ? '#f59e0b' : '#ff4d4d'
                return (
                  <tr key={s.id} className={`text-sm ${i < stratStats.length-1 ? 'border-b border-[#111116]' : ''} hover:bg-[#111116] transition-colors`}>
                    <td className="px-5 py-3.5 text-[#9a9aaa] font-medium">{s.name}</td>
                    <td className="px-5 py-3.5 text-center mono text-[#4a4a58]">{s.total}</td>
                    <td className="px-5 py-3.5 text-center mono font-semibold text-[#00d97e]">{s.wins}</td>
                    <td className="px-5 py-3.5 text-center mono font-semibold text-[#ff4d4d]">{s.losses}</td>
                    <td className="px-5 py-3.5 text-center mono font-bold" style={{ color: c }}>{s.wr}{s.wr!=='—'?'%':''}</td>
                    <td className="px-5 py-3.5 w-32">
                      {s.wr !== '—' && (
                        <div className="h-1 bg-[#0b0b0f] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${s.wr}%`, background: c }} />
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Heatmap */}
      <div className="bg-[#0f0f14] border border-[#1c1c24] rounded-xl p-5">
        <SectionTitle>Heatmap — 365 derniers jours</SectionTitle>
        <div className="overflow-x-auto mt-4">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(52,1fr)', gap:'3px' }}>
            {heatmapDays.map(({ date, color }) => {
              const bg = color==='green'?'#00d97e':color==='orange'?'#f59e0b':color==='red'?'#ff4d4d':color==='gray'?'#1c1c24':'#111116'
              return <div key={date} title={date} style={{ background:bg }} className="w-full aspect-square rounded-[2px]" />
            })}
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4 mono text-xs text-[#2a2a35] tracking-wider">
          {[['#00d97e','WIN'],['#f59e0b','MITIGÉ'],['#ff4d4d','LOSS'],['#1c1c24','NEUTRE']].map(([bg,l]) => (
            <div key={l} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background:bg }} />{l}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-0.5 h-3.5 bg-[#00d97e] rounded-full" />
      <h3 className="mono text-xs font-semibold text-[#4a4a58] tracking-widest uppercase">{children}</h3>
    </div>
  )
}

function Kpi({ label, value, icon, color }: { label: string; value: number|string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-[#0f0f14] border border-[#1c1c24] rounded-xl p-5 hover:border-[#2a2a35] transition-colors">
      <div className="flex items-center justify-between mb-4">
        <span className="mono text-xs text-[#2a2a35] tracking-widest">{label}</span>
        <span className={color}>{icon}</span>
      </div>
      <div className={`mono text-4xl font-bold ${color}`}>{value}</div>
    </div>
  )
}

function Empty() {
  return <div className="h-40 flex items-center justify-center mono text-xs text-[#2a2a35] tracking-widest">NO DATA</div>
}
