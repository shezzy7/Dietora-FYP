import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import api from '../services/api'
import toast from 'react-hot-toast'
import {
  Banknote, Zap, BarChart3, CheckCircle2, AlertTriangle, XCircle,
  Lightbulb, Salad, Leaf, Wheat, Egg, Ban, Store, Loader2
} from 'lucide-react'

export default function BudgetPage() {
  const { list: mealPlans } = useSelector((s) => s.mealPlan)
  const { data: profile } = useSelector((s) => s.profile)
  const [budget, setBudget] = useState(profile?.budgetLimit || 500)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (profile?.budgetLimit) setBudget(profile.budgetLimit)
  }, [profile])

  const optimize = async () => {
    setLoading(true)
    try {
      const { data } = await api.post('/budget/optimize', { budgetLimit: parseInt(budget) })
      setResult(data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Optimization failed')
    } finally {
      setLoading(false)
    }
  }

  const latestPlan = mealPlans?.[0]
  const planCost = latestPlan?.totalCost || 0
  const weeklyBudget = budget * 7
  const savings = weeklyBudget - planCost
  const adherencePct = weeklyBudget > 0 ? Math.min(100, Math.round((planCost / weeklyBudget) * 100)) : 0

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Budget Optimizer</h1>
        <p className="page-subtitle">Optimize your meal plan to fit within your daily budget</p>
      </div>

      {/* Budget Input */}
      <div className="card mb-6">
        <h2 className="font-display font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
          <Banknote className="w-6 h-6 text-amber-500" /> Set Your Daily Budget
        </h2>
        <div className="flex items-end gap-4 flex-wrap">
          <div className="flex-1 min-w-40">
            <label className="label">Daily budget (PKR)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₨</span>
              <input
                type="number"
                min="100"
                max="5000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="input-field pl-8"
              />
            </div>
          </div>
          <button
            onClick={optimize}
            disabled={loading}
            className="btn-amber py-3 px-6 flex items-center gap-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Optimizing...</>
            ) : <><Zap className="w-4 h-4" /> Optimize Budget</>}
          </button>
        </div>

        {/* Preset Budgets */}
        <div className="mt-4 flex gap-2 flex-wrap">
          <p className="text-xs text-slate-400 self-center">Presets:</p>
          {[200, 350, 500, 750, 1000, 1500].map((b) => (
            <button
              key={b}
              onClick={() => setBudget(b)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                parseInt(budget) === b
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'border-slate-200 dark:border-slate-600 text-slate-500 hover:border-amber-400'
              }`}
            >
              ₨{b}/day
            </button>
          ))}
        </div>
      </div>

      {/* Budget vs Plan Comparison */}
      {latestPlan && (
        <div className="card mb-6">
          <h2 className="font-display font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-500" /> Budget Analysis
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
              <p className="text-2xl font-bold font-display text-amber-600">₨{weeklyBudget}</p>
              <p className="text-xs text-slate-500 mt-1">Weekly Budget</p>
            </div>
            <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
              <p className="text-2xl font-bold font-display text-emerald-600">₨{planCost}</p>
              <p className="text-xs text-slate-500 mt-1">Plan Cost</p>
            </div>
            <div className={`text-center p-4 rounded-xl ${savings >= 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
              <p className={`text-2xl font-bold font-display ${savings >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {savings >= 0 ? '+' : ''}₨{savings}
              </p>
              <p className="text-xs text-slate-500 mt-1">{savings >= 0 ? 'Under Budget' : 'Over Budget'}</p>
            </div>
          </div>

          {/* Adherence Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Budget Utilization</span>
              <span className={`text-sm font-bold ${adherencePct <= 100 ? 'text-emerald-600' : 'text-red-600'}`}>{adherencePct}%</span>
            </div>
            <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${adherencePct <= 100 ? 'bg-emerald-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(adherencePct, 100)}%` }}
              />
            </div>
            <div className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
              {adherencePct <= 80 ? <><CheckCircle2 className="w-4 h-4 text-emerald-500"/> Well within budget — great job!</> : adherencePct <= 100 ? <><AlertTriangle className="w-4 h-4 text-amber-500"/> Close to budget limit</> : <><XCircle className="w-4 h-4 text-red-500"/> Exceeds budget — optimize below</>}
            </div>
          </div>
        </div>
      )}

      {/* Optimization Result */}
      {result && (
        <div className="card animate-slide-up">
          <h2 className="font-display font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500 fill-amber-500" /> Optimized Meal Suggestions
          </h2>
          {result.suggestions?.length > 0 ? (
            <div className="space-y-3">
              {result.suggestions.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <div>
                    <p className="font-medium text-sm text-slate-700 dark:text-slate-200">{s.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{s.category}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-emerald-600 font-semibold">{s.calories} kcal</span>
                    <span className="badge-amber">₨{s.price}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 text-sm">Your current plan is already budget-optimized!</p>
          )}
          {result.totalCost && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Optimized Daily Cost</span>
              <span className="text-lg font-bold font-display text-amber-600">₨{result.totalCost}</span>
            </div>
          )}
        </div>
      )}

      {/* Tips */}
      <div className="card mt-6">
        <h2 className="font-display font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-400 fill-amber-400" /> Budget-Saving Tips
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: Salad, tip: 'Use dal (lentils) as primary protein source — cheap and nutritious' },
            { icon: Leaf, tip: 'Buy seasonal vegetables from local Faisalabad bazaar for 30-50% savings' },
            { icon: Wheat, tip: 'Cook grains in bulk — rice and daal are cheapest when bought in quantity' },
            { icon: Egg, tip: 'Eggs are the most affordable complete protein — great for breakfast' },
            { icon: Ban, tip: 'Avoid packaged/processed foods — they cost 3x more per calorie' },
            { icon: Store, tip: 'Shop at local kiryana store instead of supermarkets to save 20%' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
              <span className="text-xl flex-shrink-0 text-emerald-600"><item.icon className="w-6 h-6" /></span>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{item.tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
