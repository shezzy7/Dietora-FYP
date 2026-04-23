// src/pages/MealPlanPage.jsx
// DIETORA — Meal Plan Page
// Shows price source badge (Live Google / AI / Market Research) per meal and plan-wide

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  generateMealPlan,
  fetchMealPlans,
  fetchActivePlan,
  setSelectedDay,
} from '../store/slices/mealPlanSlice'
import { fetchProfile } from '../store/slices/profileSlice'
import {
  fetchCurrentProgress,
  toggleMeal,
  setShowCheckIn,
  regenerateAfterCheckIn,
} from '../store/slices/progressSlice'
import { Link } from 'react-router-dom'
import WeeklyCheckIn from '../components/onboarding/WeeklyCheckIn'

const MEAL_ICONS  = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' }
const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' }
const MEAL_ORDER  = ['breakfast', 'lunch', 'dinner', 'snack']

// ─── Price source display metadata ───────────────────────
const PRICE_SOURCE_META = {
  grounded: { label: 'Live Google Search',   icon: '🌐', colorText: 'text-emerald-600', colorBg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' },
  ai:       { label: 'AI Market Knowledge',  icon: '🤖', colorText: 'text-blue-600',    colorBg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
  static:   { label: 'Market Research Data', icon: '📊', colorText: 'text-amber-600',   colorBg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' },
}

function PriceSourceBadge({ source, inline = false }) {
  const meta = PRICE_SOURCE_META[source] || PRICE_SOURCE_META.static
  if (inline) {
    return (
      <span title={`Price source: ${meta.label}`} className={`text-[10px] font-semibold ${meta.colorText}`}>
        {meta.icon}
      </span>
    )
  }
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${meta.colorBg} ${meta.colorText}`}>
      {meta.icon} {meta.label}
    </span>
  )
}

// ─── Meal Check-off Card ──────────────────────────────────
function MealCheckCard({ mealType, meal, dayNum, progressId, dayProgress, toggling }) {
  const dispatch   = useDispatch()
  const mealDone   = dayProgress?.meals?.find((m) => m.mealType === mealType)?.completed || false
  const isToggling = toggling === `${dayNum}-${mealType}`

  const handleToggle = () => {
    if (!progressId) return
    dispatch(toggleMeal({ progressId, day: dayNum, mealType, completed: !mealDone }))
  }

  if (!meal) {
    return (
      <div className="meal-card opacity-40 border-dashed">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{MEAL_ICONS[mealType]}</span>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{MEAL_LABELS[mealType]}</span>
        </div>
        <p className="text-slate-300 dark:text-slate-600 text-sm italic">No meal assigned</p>
      </div>
    )
  }

  return (
    <div className={`meal-card relative transition-all duration-200 ${
      mealDone ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10' : 'hover:scale-[1.01]'
    }`}>
      {mealDone && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center z-10">
          <span className="text-white text-xs font-bold">✓</span>
        </div>
      )}

      {/* Meal type header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{MEAL_ICONS[mealType]}</span>
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {MEAL_LABELS[mealType]}
        </span>
      </div>

      {/* Food name */}
      <h4 className={`font-display font-bold text-sm mb-1 leading-tight ${
        mealDone ? 'text-emerald-700 dark:text-emerald-400 line-through' : 'text-slate-800 dark:text-white'
      }`}>
        {meal.name}
      </h4>
      {meal.category && (
        <p className="text-xs text-slate-400 mb-3 capitalize">{meal.category}</p>
      )}

      {/* Nutrition + Price stats */}
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        <div className="text-center bg-emerald-50 dark:bg-emerald-900/20 rounded-lg py-1.5">
          <p className="text-xs font-bold text-emerald-600">{meal.calories}</p>
          <p className="text-[10px] text-slate-400">kcal</p>
        </div>
        <div className="text-center bg-blue-50 dark:bg-blue-900/20 rounded-lg py-1.5">
          <p className="text-xs font-bold text-blue-600">{meal.protein}g</p>
          <p className="text-[10px] text-slate-400">protein</p>
        </div>
        {/* Price cell — shows source icon next to price */}
        <div className="text-center bg-amber-50 dark:bg-amber-900/20 rounded-lg py-1.5">
          <p className="text-xs font-bold text-amber-600 flex items-center justify-center gap-0.5">
            ₨{meal.price}
            {meal.priceSource && <PriceSourceBadge source={meal.priceSource} inline />}
          </p>
          <p className="text-[10px] text-slate-400">price</p>
        </div>
      </div>

      {/* Disease safety badges */}
      {(meal.is_diabetic_safe || meal.is_hypertension_safe || meal.is_cardiac_safe || meal.is_kidney_safe || meal.is_thyroid_safe) && (
        <div className="mb-3 flex gap-1 flex-wrap">
          {meal.is_diabetic_safe     && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50   dark:bg-blue-900/20   text-blue-600">🩸 Safe</span>}
          {meal.is_hypertension_safe && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50    dark:bg-red-900/20    text-red-600">❤️ Safe</span>}
          {meal.is_cardiac_safe      && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600">🫀 Safe</span>}
          {meal.is_kidney_safe       && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50  dark:bg-amber-900/20  text-amber-700">🫘 Safe</span>}
          {meal.is_thyroid_safe      && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-50   dark:bg-teal-900/20   text-teal-700">🦋 Safe</span>}
        </div>
      )}

      {/* Check-off button */}
      {progressId && (
        <button
          onClick={handleToggle}
          disabled={isToggling}
          className={`w-full py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
            mealDone
              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:text-emerald-700'
          }`}
        >
          {isToggling
            ? <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
            : mealDone ? '✓ Done — Tap to undo' : '☐ Mark as Done'
          }
        </button>
      )}
    </div>
  )
}

// ─── Day Nutrition Summary ────────────────────────────────
function DayNutritionSummary({ day, dayProgress }) {
  if (!day?.meals) return null
  const vals   = Object.values(day.meals)
  const totals = {
    cal:   vals.reduce((s, m) => s + (m?.calories || 0), 0),
    prot:  vals.reduce((s, m) => s + (m?.protein  || 0), 0),
    carbs: vals.reduce((s, m) => s + (m?.carbs    || 0), 0),
    fat:   vals.reduce((s, m) => s + (m?.fat      || 0), 0),
    cost:  vals.reduce((s, m) => s + (m?.price    || 0), 0),
  }
  const completedMeals = dayProgress?.meals?.filter((m) => m.completed).length || 0
  const totalMeals     = dayProgress?.meals?.length || 4
  const pct            = Math.round((completedMeals / totalMeals) * 100)

  return (
    <div className="card bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-100 dark:border-emerald-800">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="font-display font-bold text-slate-700 dark:text-white text-sm">
          📊 {day.dayName}
          {day.date && (
            <span className="ml-1.5 font-normal text-slate-400 text-xs">
              · {new Date(day.date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
          {' '}— Daily Summary
        </h3>
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-semibold text-emerald-600">{completedMeals}/{totalMeals} done</span>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {[
          { label: 'Calories', value: totals.cal,             unit: '',   color: 'text-emerald-600' },
          { label: 'Protein',  value: `${totals.prot}g`,      unit: '',   color: 'text-blue-600' },
          { label: 'Carbs',    value: `${totals.carbs}g`,     unit: '',   color: 'text-orange-500' },
          { label: 'Fat',      value: `${totals.fat}g`,       unit: '',   color: 'text-purple-600' },
          { label: 'Cost',     value: `₨${totals.cost}`,      unit: '',   color: 'text-amber-600' },
        ].map((item) => (
          <div key={item.label} className="text-center">
            <p className={`font-display font-bold text-lg leading-tight ${item.color}`}>{item.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Weekly Progress Bar ──────────────────────────────────
function WeeklyProgressBar({ progress, onCheckInClick }) {
  if (!progress) return null
  const { completedMeals, totalMeals, adherencePercent, weekCompleted, checkInCompleted } = progress
  const pct = adherencePercent || 0

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h3 className="font-display font-bold text-slate-800 dark:text-white text-sm">
            📅 Week {progress.weekNumber} Progress
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {completedMeals}/{totalMeals} meals completed · {pct}% adherence
          </p>
        </div>
        {weekCompleted && !checkInCompleted && (
          <button onClick={onCheckInClick} className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors animate-pulse">
            🏆 Complete Check-In
          </button>
        )}
        {checkInCompleted && (
          <span className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-xl">
            ✅ Week Complete
          </span>
        )}
      </div>
      <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="grid grid-cols-7 gap-1 mt-3">
        {progress.days?.map((dayRecord) => {
          const done  = dayRecord.meals?.filter((m) => m.completed).length || 0
          const total = dayRecord.meals?.length || 4
          const dp    = total > 0 ? (done / total) * 100 : 0
          return (
            <div key={dayRecord.day} className="text-center">
              <div className={`h-2 rounded-full mx-auto mb-1 transition-all ${dp === 100 ? 'bg-emerald-500' : dp >= 50 ? 'bg-amber-400' : dp > 0 ? 'bg-orange-300' : 'bg-slate-200 dark:bg-slate-700'}`} />
              <span className="text-[10px] text-slate-400">D{dayRecord.day}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Generating Overlay ───────────────────────────────────
function GeneratingOverlay({ message }) {
  const [step, setStep] = useState(0)
  const steps = [
    '🏥 Analysing your health conditions...',
    '🧠 AI building clinical dietary brief...',
    '🌾 Selecting medically safe foods...',
    '🌐 Fetching live PKR prices from Google...',
    '📅 Assembling your 7-day plan...',
    '✅ Almost ready...',
  ]
  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % steps.length), 900)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center animate-slide-up">
        <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-5" />
        <h3 className="font-display font-bold text-xl text-slate-800 dark:text-white mb-2">
          {message || 'Generating Your Plan'}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-5 min-h-[40px] transition-all duration-300">
          {steps[step]}
        </p>
        <div className="flex gap-1 justify-center">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-600'}`}
              style={{ width: i <= step ? '18px' : '6px' }} />
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-4">
          🌐 Prices sourced live from Google · 🤖 Two-phase AI analysis
        </p>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════════
export default function MealPlanPage() {
  const dispatch = useDispatch()
  const { current, list, generating, selectedDay, error } = useSelector((s) => s.mealPlan)
  const { data: profile }                                  = useSelector((s) => s.profile)
  const { current: progress, showCheckIn, regenerating, toggling } = useSelector((s) => s.progress)

  const [showGenerator, setShowGenerator] = useState(false)
  const [budgetOverride, setBudgetOverride] = useState('')

  useEffect(() => {
    dispatch(fetchProfile())
    dispatch(fetchMealPlans())
    dispatch(fetchActivePlan())
    dispatch(fetchCurrentProgress())
  }, [dispatch])

  useEffect(() => {
    if (current?._id) dispatch(fetchCurrentProgress())
  }, [current?._id, dispatch])

  const activePlan          = current || list?.[0]
  const activeProgress      = (progress?.mealPlan === activePlan?._id || progress?.mealPlan?._id === activePlan?._id) ? progress : null
  const selectedDayProgress = activeProgress?.days?.find((d) => d.day === selectedDay + 1)

  const handleGenerate = () => {
    const params = {}
    if (budgetOverride && parseInt(budgetOverride) >= 100) params.budgetLimit = parseInt(budgetOverride)
    dispatch(generateMealPlan(params)).then((result) => {
      if (result.payload) setTimeout(() => dispatch(fetchCurrentProgress()), 500)
    })
    setShowGenerator(false)
    setBudgetOverride('')
  }

  const handleCheckInComplete = (progressId) => {
    dispatch(regenerateAfterCheckIn(progressId)).then(() => {
      dispatch(fetchActivePlan())
      dispatch(fetchCurrentProgress())
    })
    dispatch(setShowCheckIn(false))
  }

  if (!profile) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 animate-fade-in">
        <div className="text-6xl mb-4">🏥</div>
        <h2 className="font-display font-bold text-2xl text-slate-800 dark:text-white mb-2">Setup your health profile first</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">We need your health info, conditions, and budget to generate a safe, personalized plan.</p>
        <Link to="/profile" className="btn-primary py-3 px-8 inline-block">Setup Health Profile →</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Overlays */}
      {(generating || regenerating) && (
        <GeneratingOverlay message={regenerating ? `Generating Week ${(activeProgress?.weekNumber || 1) + 1} Plan` : null} />
      )}
      {showCheckIn && activeProgress && (
        <WeeklyCheckIn progress={activeProgress} onRegenerate={handleCheckInComplete} />
      )}

      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">AI Meal Planner</h1>
          <p className="page-subtitle">Personalized 7-day plans · Live PKR prices from Google · Daily check-offs</p>
        </div>
        <button onClick={() => setShowGenerator(true)} disabled={generating} className="btn-primary flex items-center gap-2 flex-shrink-0">
          🤖 Generate New Plan
        </button>
      </div>

      {/* ── Error Banner ──────────────────────────────────── */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
          <span className="text-red-500 text-lg">⚠️</span>
          <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* ── Generator Modal ──────────────────────────────── */}
      {showGenerator && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md animate-slide-up">
            <h3 className="font-display font-bold text-xl text-slate-800 dark:text-white mb-1">Generate 7-Day Plan</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-5">Health profile & real-time PKR prices applied automatically</p>

            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-5 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <p>🏥 Conditions: {[profile.isDiabetic && 'Diabetes', profile.isHypertensive && 'Hypertension', profile.isCardiac && 'Cardiac', profile.hasKidneyDisease && 'Kidney', profile.hasThyroid && 'Thyroid'].filter(Boolean).join(', ') || 'None'}</p>
              <p>⚠️ Allergies: {profile.allergies?.join(', ') || 'None'}</p>
              <p>🔥 Daily target: ~{Math.round(profile.dailyCalorieTarget || profile.tdee || 2000)} kcal</p>
              <p>💰 Default budget: ₨{profile.dailyBudget}/day</p>
              <p className="text-emerald-600 font-semibold flex items-center gap-1">🌐 Prices sourced live from Google Search</p>
            </div>

            <div className="mb-5">
              <label className="label">Budget Override (optional)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">₨</span>
                <input type="number" placeholder={`Default: ₨${profile.dailyBudget}`} value={budgetOverride}
                  onChange={(e) => setBudgetOverride(e.target.value)} className="input-field pl-8" min="100" />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowGenerator(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleGenerate} className="btn-primary flex-1">🤖 Generate Now</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Plan View ────────────────────────────────────── */}
      {activePlan ? (
        <>
          {activeProgress && <WeeklyProgressBar progress={activeProgress} onCheckInClick={() => dispatch(setShowCheckIn(true))} />}

          {/* Plan Info Bar + Price Source */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center text-xl">🗓️</div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-white text-sm">
                    7-Day Meal Plan
                    {activeProgress && <span className="ml-2 text-xs text-emerald-600 font-normal">Week {activeProgress.weekNumber}</span>}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(activePlan.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex gap-5">
                <div className="text-center">
                  <p className="font-bold text-emerald-600 text-sm">₨{activePlan.weeklyTotalCost || activePlan.totalCost || 0}</p>
                  <p className="text-xs text-slate-400">Weekly Cost</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-amber-600 text-sm">{Math.round((activePlan.weeklyTotalCalories || activePlan.totalCalories || 0) / 7)}</p>
                  <p className="text-xs text-slate-400">Avg kcal/day</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-blue-600 text-sm">₨{activePlan.avgDailyCost || Math.round((activePlan.weeklyTotalCost || 0) / 7)}</p>
                  <p className="text-xs text-slate-400">Per Day</p>
                </div>
              </div>
              <Link to="/grocery" className="btn-amber py-2 px-4 text-sm flex-shrink-0">🛒 Grocery List</Link>
            </div>

            {/* Price source indicator */}
            {activePlan.priceDataSource && (
              <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Price data:</span>
                  <PriceSourceBadge source={activePlan.priceDataSource} />
                </div>
                {activePlan.priceLastUpdated && (
                  <span className="text-[10px] text-slate-400">
                    Updated {new Date(activePlan.priceLastUpdated).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                {activePlan.priceSourceSummary && (
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    {activePlan.priceSourceSummary.grounded > 0 && <span className="text-emerald-600">🌐 {activePlan.priceSourceSummary.grounded} live</span>}
                    {activePlan.priceSourceSummary.ai > 0       && <span className="text-blue-600">🤖 {activePlan.priceSourceSummary.ai} AI</span>}
                    {activePlan.priceSourceSummary.static > 0   && <span className="text-amber-600">📊 {activePlan.priceSourceSummary.static} research</span>}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Day Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 snap-x">
            {(activePlan.days || []).map((dayObj, i) => {
              const dp      = activeProgress?.days?.find((d) => d.day === i + 1)
              const done    = dp?.meals?.filter((m) => m.completed).length || 0
              const total   = dp?.meals?.length || 4
              const allDone = done === total && total > 0
              return (
                <button key={i} onClick={() => dispatch(setSelectedDay(i))}
                  className={`flex-shrink-0 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 snap-start min-w-[80px] ${
                    selectedDay === i
                      ? 'bg-emerald-600 text-white shadow-glow'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                  }`}
                >
                  <span className="block font-bold text-center">{dayObj.dayName?.slice(0, 3) || `D${i+1}`}</span>
                  {dayObj.date && (
                    <span className={`block text-[10px] text-center mt-0.5 ${selectedDay === i ? 'text-white/80' : 'text-slate-400'}`}>
                      {new Date(dayObj.date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                  {activeProgress && (
                    <span className={`block text-[10px] text-center mt-0.5 ${allDone ? 'text-emerald-300' : selectedDay === i ? 'text-white/70' : 'text-slate-400'}`}>
                      {allDone ? '✓' : `${done}/${total}`}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Day Summary */}
          {activePlan.days?.[selectedDay] && (
            <DayNutritionSummary day={activePlan.days[selectedDay]} dayProgress={selectedDayProgress} />
          )}

          {/* Meal Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MEAL_ORDER.map((mealType) => (
              <MealCheckCard key={mealType} mealType={mealType}
                meal={activePlan.days?.[selectedDay]?.meals?.[mealType]}
                dayNum={selectedDay + 1} progressId={activeProgress?._id}
                dayProgress={selectedDayProgress} toggling={toggling} />
            ))}
          </div>

          {/* No progress tracker */}
          {!activeProgress && activePlan?._id && (
            <div className="card text-center py-8 border-dashed">
              <p className="text-2xl mb-2">📋</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Enable meal tracking</p>
              <p className="text-xs text-slate-400 mb-4">Track daily meals and get a personalized next-week update</p>
              <button onClick={() => dispatch(require('../store/slices/progressSlice').initProgress(activePlan._id)).then(() => dispatch(fetchCurrentProgress()))}
                className="btn-primary py-2 px-6 text-sm">🚀 Start Tracking</button>
            </div>
          )}

          {/* Past Plans */}
          {list.length > 1 && (
            <div className="card">
              <h3 className="font-display font-bold text-slate-800 dark:text-white mb-4 text-sm">📋 Past Meal Plans</h3>
              <div className="space-y-2">
                {list.slice(1, 6).map((plan, i) => (
                  <div key={plan._id || i} className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">7-Day Plan #{list.length - i - 1}</p>
                      <p className="text-xs text-slate-400">{new Date(plan.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-amber-600 font-semibold">₨{plan.weeklyTotalCost || plan.totalCost || '—'}</span>
                      <span className="badge bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-0.5 rounded-full">Archived</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card text-center py-16">
          <p className="text-6xl mb-4">🍽️</p>
          <h3 className="font-display font-bold text-2xl text-slate-800 dark:text-white mb-2">No meal plans yet</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm max-w-sm mx-auto">
            Generate your first AI-powered 7-day plan with live PKR prices from Google Search.
          </p>
          <button onClick={() => setShowGenerator(true)} className="btn-primary py-3 px-8">🤖 Generate My First Plan</button>
        </div>
      )}
    </div>
  )
}
