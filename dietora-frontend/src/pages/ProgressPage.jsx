import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMealPlans } from '../store/slices/mealPlanSlice'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { TrendingUp, Flame, Wallet, Salad, Target, CheckCircle2, AlertTriangle, LineChart as ChartIcon } from 'lucide-react'
import { useUrdu } from '../context/UrduContext'

const DAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAYS_UR = ['پیر', 'منگل', 'بدھ', 'جمعرات', 'جمعہ', 'ہفتہ', 'اتوار']

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-lg text-sm">
        <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }} className="text-xs">{p.name}: {p.value} {p.unit || ''}</p>
        ))}
      </div>
    )
  }
  return null
}

export default function ProgressPage() {
  const dispatch = useDispatch()
  const { list: mealPlans } = useSelector((s) => s.mealPlan)
  const { data: profile } = useSelector((s) => s.profile)
  const { isUrdu } = useUrdu()

  const DAYS = isUrdu ? DAYS_UR : DAYS_EN
  const ur = (en, ur) => isUrdu ? ur : en

  useEffect(() => { dispatch(fetchMealPlans()) }, [dispatch])

  const latestPlan = mealPlans?.[0]

  const calorieData = DAYS_EN.map((day, i) => {
    const dayData = latestPlan?.days?.[i]
    const meals = dayData?.meals ? Object.values(dayData.meals) : []
    const total = meals.reduce((s, m) => s + (m?.calories || 0), 0)
    return { day: DAYS[i], calories: total, target: Math.round(profile?.tdee || 2000) }
  })

  const budgetData = DAYS_EN.map((day, i) => {
    const dayData = latestPlan?.days?.[i]
    const meals = dayData?.meals ? Object.values(dayData.meals) : []
    const total = meals.reduce((s, m) => s + (m?.price || 0), 0)
    return { day: DAYS[i], spent: total, budget: profile?.budgetLimit || 500 }
  })

  const macroData = (() => {
    if (!latestPlan?.days) return []
    let p = 0, c = 0, f = 0
    latestPlan.days.forEach(d => {
      if (d?.meals) Object.values(d.meals).forEach(m => {
        p += m?.protein || 0
        c += m?.carbs || 0
        f += m?.fat || 0
      })
    })
    return [
      { name: ur('Protein', 'پروٹین'), value: p, color: '#3b82f6' },
      { name: ur('Carbs', 'کاربس'), value: c, color: '#f59e0b' },
      { name: ur('Fat', 'چکنائی'), value: f, color: '#a855f7' },
    ]
  })()

  const adherenceData = DAYS_EN.map((day, i) => {
    const dayData = latestPlan?.days?.[i]
    const meals = dayData?.meals ? Object.values(dayData.meals) : []
    const spent = meals.reduce((s, m) => s + (m?.price || 0), 0)
    const bgt = profile?.budgetLimit || 500
    return { day: DAYS[i], adherence: bgt > 0 ? Math.min(100, Math.round((spent / bgt) * 100)) : 0 }
  })

  const totalCal = calorieData.reduce((s, d) => s + d.calories, 0)
  const avgCal = Math.round(totalCal / 7)
  const totalSpent = budgetData.reduce((s, d) => s + d.spent, 0)
  const avgAdh = Math.round(adherenceData.reduce((s, d) => s + d.adherence, 0) / 7)

  return (
    <div className="space-y-6 animate-fade-in" style={isUrdu ? { fontFamily: "'Noto Nastaliq Urdu', serif" } : {}}>
      <div className="page-header">
        <h1 className="page-title">{ur('My Progress', 'میری پیش رفت')}</h1>
        <p className="page-subtitle">{ur('Track your nutrition, calories, and budget over time', 'وقت کے ساتھ اپنی غذائیت، کیلوریز اور بجٹ ٹریک کریں')}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: ur('Avg Daily Calories', 'اوسط روزانہ کیلوریز'), value: latestPlan ? `${avgCal}` : '—', sub: `${ur('Target', 'ہدف')}: ${Math.round(profile?.tdee || 0)} kcal`, color: 'emerald' },
          { label: ur('Weekly Spend', 'ہفتہ وار خرچ'), value: latestPlan ? `₨${totalSpent}` : '—', sub: `${ur('Budget', 'بجٹ')}: ₨${(profile?.budgetLimit || 0) * 7}`, color: 'amber' },
          { label: ur('Budget Adherence', 'بجٹ پابندی'), value: latestPlan ? `${avgAdh}%` : '—', sub: avgAdh >= 80 ? <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> {ur('On Track', 'ٹھیک ہے')}</span> : <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> {ur('Needs work', 'بہتری چاہیے')}</span>, color: avgAdh >= 80 ? 'emerald' : 'red' },
          { label: ur('Plans Generated', 'بنائے گئے منصوبے'), value: mealPlans?.length || 0, sub: ur('Total meal plans', 'کل کھانے کے منصوبے'), color: 'blue' },
        ].map((s, i) => {
          const colors = { emerald: 'text-emerald-600', amber: 'text-amber-600', blue: 'text-blue-600', red: 'text-red-600' }
          return (
            <div key={i} className="card">
              <p className={`text-2xl font-bold font-display ${colors[s.color]}`}>{s.value}</p>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">{s.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
            </div>
          )
        })}
      </div>

      {!latestPlan ? (
        <div className="card text-center py-16 border-dashed border-2 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
            <ChartIcon className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="font-display font-bold text-xl text-slate-800 dark:text-white mb-2">{ur('No data yet', 'ابھی تک کوئی ڈیٹا نہیں')}</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{ur('Generate a meal plan to see your progress charts.', 'پیش رفت چارٹ دیکھنے کے لیے کھانے کا منصوبہ بنائیں۔')}</p>
        </div>
      ) : (
        <>
          {/* Calorie Chart */}
          <div className="card">
            <h3 className="font-display font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2 text-base">
              <span className="w-8 h-8 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center text-amber-600">
                <Flame className="w-4 h-4" />
              </span>
              {ur('Daily Calories vs Target', 'روزانہ کیلوریز بمقابلہ ہدف')}
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={calorieData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="calories" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} name={ur('Calories', 'کیلوریز')} unit=" kcal" />
                <Line type="monotone" dataKey="target" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name={ur('Target', 'ہدف')} unit=" kcal" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Budget Chart */}
          <div className="card">
            <h3 className="font-display font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2 text-base">
              <span className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg flex items-center justify-center text-emerald-600">
                <Wallet className="w-4 h-4" />
              </span>
              {ur('Daily Spending vs Budget', 'روزانہ خرچ بمقابلہ بجٹ')}
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={budgetData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="spent" fill="#f59e0b" radius={[6, 6, 0, 0]} name={ur('Spent', 'خرچ')} unit=" ₨" />
                <Bar dataKey="budget" fill="#e2e8f0" radius={[6, 6, 0, 0]} name={ur('Budget', 'بجٹ')} unit=" ₨" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-display font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2 text-base">
                <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center text-purple-600">
                  <Salad className="w-4 h-4" />
                </span>
                {ur('Weekly Macros Breakdown', 'ہفتہ وار میکرو خلاصہ')}
              </h3>
              {macroData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={macroData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                      {macroData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v}g`, '']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-slate-400 text-sm text-center py-8">{ur('No macro data', 'کوئی میکرو ڈیٹا نہیں')}</p>}
            </div>

            <div className="card">
              <h3 className="font-display font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2 text-base">
                <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center text-blue-600">
                  <Target className="w-4 h-4" />
                </span>
                {ur('Budget Adherence by Day', 'روز بروز بجٹ پابندی')}
              </h3>
              <div className="space-y-3">
                {adherenceData.map((d) => (
                  <div key={d.day} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-500 w-10">{d.day}</span>
                    <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${d.adherence <= 100 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${Math.min(d.adherence, 100)}%` }} />
                    </div>
                    <span className={`text-xs font-bold w-9 text-right ${d.adherence <= 100 ? 'text-emerald-600' : 'text-red-600'}`}>{d.adherence}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
