// src/pages/MealPlanPage.jsx
// DIETORA — Meal Plan Page
// v5: Dual data-source disclosure popups
//   - planDataSource popup  → AI-generated vs Greedy Fallback
//   - priceDataSource popup → Live Search vs Static Fallback
//   Both auto-show on plan load; user can dismiss each one independently.

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  generateMealPlan,
  fetchMealPlans,
  fetchActivePlan,
  setSelectedDay,
  fetchAlternatives,
  swapMeal
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
import RecipeModal from '../components/meal/RecipeModal'
import {
  Sunrise, Sun, Moon, Apple, Globe, Bot, BarChart2, Shuffle, ChefHat,
  CalendarDays, Loader2, Hospital, Activity, HeartPulse, Droplets,
  CheckCircle2, Heart, Pill, Fingerprint, AlertTriangle, Flame, Coins,
  ShoppingCart, Check, CheckSquare, Utensils, FileText, Lock, X,
  Sparkles, Info, Database
} from 'lucide-react'

const MEAL_ICONS  = { breakfast: Sunrise, lunch: Sun, dinner: Moon, snack: Apple }
const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' }
const MEAL_ORDER  = ['breakfast', 'lunch', 'dinner', 'snack']

// ─── Price source display metadata ───────────────────────
const PRICE_SOURCE_META = {
  grounded: { label: 'Live Google Search',   icon: Globe,     colorText: 'text-emerald-600', colorBg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' },
  live:     { label: 'Live Web Search',      icon: Globe,     colorText: 'text-emerald-600', colorBg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' },
  ai:       { label: 'AI Market Knowledge',  icon: Bot,       colorText: 'text-blue-600',    colorBg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
  static:   { label: 'Market Research Data', icon: BarChart2, colorText: 'text-amber-600',   colorBg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' },
}

function PriceSourceBadge({ source, inline = false }) {
  const meta = PRICE_SOURCE_META[source] || PRICE_SOURCE_META.static
  const Icon = meta.icon
  if (inline) {
    return (
      <span title={`Price source: ${meta.label}`} className={`text-[10px] font-semibold ${meta.colorText}`}>
        <Icon className="w-3 h-3 inline-block" />
      </span>
    )
  }
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${meta.colorBg} ${meta.colorText}`}>
      <Icon className="w-3.5 h-3.5" /> {meta.label}
    </span>
  )
}

// ══════════════════════════════════════════════════════════
//  DATA SOURCE DISCLOSURE POPUP
//  Dono (plan + price) ke liye ek generic dismissable popup
// ══════════════════════════════════════════════════════════
function DataSourcePopup({ type, planDataSource, priceDataSource, priceSourceSummary, onDismiss }) {
  // type: 'plan' | 'price'

  if (type === 'plan') {
    const isFallback = planDataSource === 'greedy_fallback'
    return (
      <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md animate-slide-up border-2 ${
          isFallback
            ? 'border-amber-300 dark:border-amber-700'
            : 'border-emerald-300 dark:border-emerald-700'
        }`}>
          {/* Header */}
          <div className={`rounded-t-2xl px-6 py-4 flex items-center justify-between ${
            isFallback
              ? 'bg-amber-50 dark:bg-amber-900/30'
              : 'bg-emerald-50 dark:bg-emerald-900/30'
          }`}>
            <div className="flex items-center gap-3">
              {isFallback
                ? <Database className="w-7 h-7 text-amber-600" />
                : <Sparkles className="w-7 h-7 text-emerald-600" />
              }
              <div>
                <h3 className={`font-display font-bold text-lg ${
                  isFallback ? 'text-amber-800 dark:text-amber-300' : 'text-emerald-800 dark:text-emerald-300'
                }`}>
                  {isFallback ? 'Meal Plan: Fallback Mode' : 'Meal Plan: AI Generated ✨'}
                </h3>
                <p className={`text-xs font-medium ${
                  isFallback ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {isFallback ? 'Intelligent backup system used' : 'Clinical AI successfully generated your plan'}
                </p>
              </div>
            </div>
            <button onClick={onDismiss} className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            {isFallback ? (
              <>
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                  Aapka meal plan <strong>Dietora ke intelligent fallback system</strong> ne banaya hai.
                  AI (Groq LLM) 3 koshishon ke baad plan nahi bana saka — is liye hum ne ek{' '}
                  <strong>medically-safe, deterministic algorithm</strong> use kiya.
                </p>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <Info className="w-4 h-4" /> Fallback plan ke bare mein jaanein
                  </p>
                  <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1 list-disc list-inside">
                    <li>Aapki medical conditions aur allergies ka poora khayal rakha gaya hai ✓</li>
                    <li>Sab foods disease-safe hain ✓</li>
                    <li>Variety AI plan se thodi kam ho sakti hai</li>
                    <li>Clinical analysis (nutrients/targets) available nahi ho sakti</li>
                  </ul>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Behtar personalization ke liye <strong>Generate New Plan</strong> dobara try karein — AI service usually jald theek ho jaati hai.
                </p>
              </>
            ) : (
              <>
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                  Aapka meal plan <strong>Dietora ke Clinical AI</strong> ne banaya hai — Groq LLM (llama-3.3-70b)
                  ne aapki health profile, medical conditions, allergies aur budget ka complete analysis karke{' '}
                  7-day plan select kiya hai.
                </p>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> AI plan ki khubiyan
                  </p>
                  <ul className="text-xs text-emerald-700 dark:text-emerald-400 space-y-1 list-disc list-inside">
                    <li>Clinical dietitian-level nutrient targets ✓</li>
                    <li>Disease aur allergen safety guaranteed ✓</li>
                    <li>7-din variety aur rotation ✓</li>
                    <li>Aapke budget ke mutabiq ✓</li>
                  </ul>
                </div>
              </>
            )}
          </div>

          <div className="px-6 pb-5">
            <button
              onClick={onDismiss}
              className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${
                isFallback
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              Theek hai, samajh gaya
            </button>
          </div>
        </div>
      </div>
    )
  }

  // type === 'price'
  const isStatic = priceDataSource === 'static'
  const liveCount = (priceSourceSummary?.grounded || 0) + (priceSourceSummary?.live || 0)
  const staticCount = priceSourceSummary?.static || 0
  const aiCount = priceSourceSummary?.ai || 0

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md animate-slide-up border-2 ${
        isStatic
          ? 'border-amber-300 dark:border-amber-700'
          : 'border-emerald-300 dark:border-emerald-700'
      }`}>
        {/* Header */}
        <div className={`rounded-t-2xl px-6 py-4 flex items-center justify-between ${
          isStatic
            ? 'bg-amber-50 dark:bg-amber-900/30'
            : 'bg-emerald-50 dark:bg-emerald-900/30'
        }`}>
          <div className="flex items-center gap-3">
            {isStatic
              ? <BarChart2 className="w-7 h-7 text-amber-600" />
              : <Globe className="w-7 h-7 text-emerald-600" />
            }
            <div>
              <h3 className={`font-display font-bold text-lg ${
                isStatic ? 'text-amber-800 dark:text-amber-300' : 'text-emerald-800 dark:text-emerald-300'
              }`}>
                {isStatic ? 'Prices: Research Data' : 'Prices: Live Sources 🌐'}
              </h3>
              <p className={`text-xs font-medium ${
                isStatic ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {isStatic
                  ? 'Prices from April 2026 Faisalabad research baseline'
                  : 'Prices fetched from live web sources'
                }
              </p>
            </div>
          </div>
          <button onClick={onDismiss} className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {isStatic ? (
            <>
              <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                Is waqt prices <strong>Dietora ke pre-researched database</strong> se aayi hain.
                Yeh prices April 2026 mein Faisalabad ke local dhabas, bazaar rates (UrduPoint),
                aur grocery stores se gather ki gayi hain.
              </p>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 space-y-2">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <Info className="w-4 h-4" /> Research data ke bare mein
                </p>
                <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1 list-disc list-inside">
                  <li>Source: UrduPoint market rates + local dhaba survey ✓</li>
                  <li>Faisalabad serving-level prices (per person, per portion) ✓</li>
                  <li>Live prices is waqt fetch nahi ho payin (timeout/API issue)</li>
                  <li>Prices thodi purani ho sakti hain — market inflation ignore ho sakta hai</li>
                </ul>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live prices automatic background mein update hoti rehti hain jab service available ho.
              </p>
            </>
          ) : (
            <>
              <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                Aapke meal plan ki prices <strong>live web sources</strong> se fetch ki gayi hain —
                Tavily Search + Gemini AI ne aaj ke Faisalabad market rates check karke accurate
                serving-level prices provide ki hain.
              </p>

              {/* Source breakdown */}
              {priceSourceSummary && (liveCount + staticCount + aiCount) > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {liveCount > 0 && (
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center border border-emerald-200 dark:border-emerald-800">
                      <Globe className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                      <p className="font-bold text-emerald-700 dark:text-emerald-400 text-lg">{liveCount}</p>
                      <p className="text-[10px] text-emerald-600">Live Search</p>
                    </div>
                  )}
                  {aiCount > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center border border-blue-200 dark:border-blue-800">
                      <Bot className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                      <p className="font-bold text-blue-700 dark:text-blue-400 text-lg">{aiCount}</p>
                      <p className="text-[10px] text-blue-600">AI Knowledge</p>
                    </div>
                  )}
                  {staticCount > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center border border-amber-200 dark:border-amber-800">
                      <BarChart2 className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                      <p className="font-bold text-amber-700 dark:text-amber-400 text-lg">{staticCount}</p>
                      <p className="text-[10px] text-amber-600">Research Data</p>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3">
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  ✓ Prices dhaba serving-level hain (per person, per portion) — per-kg ya wholesale nahi
                </p>
              </div>
            </>
          )}
        </div>

        <div className="px-6 pb-5">
          <button
            onClick={onDismiss}
            className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${
              isStatic
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            Samajh gaya, theek hai
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Meal Swap Modal ──────────────────────────────────────
function MealSwapModal({ isOpen, onClose, day, mealType, planId }) {
  const dispatch = useDispatch()
  const [alternatives, setAlternatives] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    dispatch(fetchAlternatives({ planId, day, meal: mealType }))
      .unwrap()
      .then(res => {
        setAlternatives(res)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [isOpen, planId, day, mealType, dispatch])

  const handleSwap = (foodId) => {
    dispatch(swapMeal({ planId, day, meal: mealType, foodItemId: foodId }))
      .then(() => onClose())
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md animate-slide-up">
        <h3 className="font-display font-bold text-xl text-slate-800 dark:text-white mb-4">Swap {MEAL_LABELS[mealType]}</h3>
        {loading ? (
          <div className="py-8 text-center"><div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto" /></div>
        ) : (
          <div className="space-y-3">
            {alternatives.map(alt => (
              <div key={alt._id} className="border border-slate-200 dark:bg-slate-700 rounded-xl p-3 flex justify-between items-center hover:border-emerald-400 transition-colors">
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-white">{alt.name}</h4>
                  <p className="text-xs text-slate-500">{alt.calories} kcal | ₨{alt.price}</p>
                </div>
                <button onClick={() => handleSwap(alt._id)} className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-lg hover:bg-emerald-200">
                  Select
                </button>
              </div>
            ))}
            {alternatives.length === 0 && <p className="text-sm text-slate-500">No alternatives found.</p>}
          </div>
        )}
        <button onClick={onClose} className="mt-5 w-full btn-secondary py-2">Cancel</button>
      </div>
    </div>
  )
}

// ─── Helper: kya yeh day future mein hai? ─────────────────
function isFutureDay(dateStr) {
  if (!dateStr) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dayDate = new Date(dateStr)
  dayDate.setHours(0, 0, 0, 0)
  return dayDate.getTime() > today.getTime()
}

// ─── Meal Check-off Card ──────────────────────────────────
function MealCheckCard({ mealType, meal, dayNum, progressId, dayProgress, toggling, onSwapClick, onRecipeClick, dayDate }) {
  const dispatch   = useDispatch()
  const mealDone   = dayProgress?.meals?.find((m) => m.mealType === mealType)?.completed || false
  const isToggling = toggling === `${dayNum}-${mealType}`
  const isFuture   = isFutureDay(dayDate)

  const handleToggle = () => {
    if (!progressId || isFuture) return
    dispatch(toggleMeal({ progressId, day: dayNum, mealType, completed: !mealDone }))
  }

  const Icon = MEAL_ICONS[mealType] || Sunrise

  if (!meal) {
    return (
      <div className="meal-card opacity-40 border-dashed border-2 border-slate-200 dark:border-slate-700 bg-transparent">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-5 h-5 text-slate-400" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{MEAL_LABELS[mealType]}</span>
        </div>
        <p className="text-slate-400 dark:text-slate-500 text-sm italic">No meal assigned</p>
      </div>
    )
  }

  return (
    <div className={`meal-card relative transition-all duration-300 ${
      mealDone ? 'border-emerald-300 bg-emerald-50/80 dark:bg-emerald-900/20' : 'hover:-translate-y-1 hover:shadow-xl'
    } ${isFuture ? 'opacity-80' : ''}`}>
      {mealDone && (
        <div className="absolute -top-2 -right-2 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center z-10 shadow-lg shadow-emerald-500/30">
          <CheckCircle2 className="w-4 h-4 text-white" />
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {MEAL_LABELS[mealType]}
          </span>
        </div>
        {!mealDone && progressId && !isFuture && (
          <button onClick={() => onSwapClick(mealType)} title="Find alternatives"
            className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-100/80 dark:bg-emerald-900/50 px-2.5 py-1 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors">
            <Shuffle className="w-3 h-3" /> Swap
          </button>
        )}
      </div>

      <div className="mb-1">
        <h4 className={`font-display font-bold text-base leading-snug transition-colors ${
          mealDone ? 'text-emerald-700 dark:text-emerald-400 line-through opacity-80' : 'text-slate-800 dark:text-white'
        }`}>
          {meal.name}
        </h4>
        <button onClick={() => onRecipeClick(meal)}
          className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
          <ChefHat className="w-3 h-3" /> View Recipe
        </button>
      </div>
      {meal.category && <p className="text-xs text-slate-400 mb-4 capitalize">{meal.category}</p>}

      <div className="grid grid-cols-3 gap-1.5 mb-3">
        <div className="text-center bg-emerald-50 dark:bg-emerald-900/20 rounded-lg py-1.5">
          <p className="text-xs font-bold text-emerald-600">{meal.calories}</p>
          <p className="text-[10px] text-slate-400">kcal</p>
        </div>
        <div className="text-center bg-blue-50 dark:bg-blue-900/20 rounded-lg py-1.5">
          <p className="text-xs font-bold text-blue-600">{meal.protein}g</p>
          <p className="text-[10px] text-slate-400">protein</p>
        </div>
        <div className="text-center bg-amber-50 dark:bg-amber-900/20 rounded-lg py-1.5">
          <p className="text-xs font-bold text-amber-600 flex items-center justify-center gap-0.5">
            ₨{meal.price}
            {meal.priceSource && <PriceSourceBadge source={meal.priceSource} inline />}
          </p>
          <p className="text-[10px] text-slate-400">price</p>
        </div>
      </div>

      {(meal.is_diabetic_safe || meal.is_hypertension_safe || meal.is_cardiac_safe || meal.is_kidney_safe || meal.is_thyroid_safe) && (
        <div className="mb-3 flex gap-1 flex-wrap">
          {meal.is_diabetic_safe     && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50   dark:bg-blue-900/20   text-blue-600 flex items-center gap-0.5"><Droplets className="w-2.5 h-2.5" /> Safe</span>}
          {meal.is_hypertension_safe && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50    dark:bg-red-900/20    text-red-600 flex items-center gap-0.5"><Heart className="w-2.5 h-2.5" /> Safe</span>}
          {meal.is_cardiac_safe      && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center gap-0.5"><Activity className="w-2.5 h-2.5" /> Safe</span>}
          {meal.is_kidney_safe       && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50  dark:bg-amber-900/20  text-amber-700 flex items-center gap-0.5"><Pill className="w-2.5 h-2.5" /> Safe</span>}
          {meal.is_thyroid_safe      && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-50   dark:bg-teal-900/20   text-teal-700 flex items-center gap-0.5"><Fingerprint className="w-2.5 h-2.5" /> Safe</span>}
        </div>
      )}

      {progressId && (
        isFuture ? (
          <div className="w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-700/60 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-dashed border-slate-300 dark:border-slate-600">
            <Lock className="w-3.5 h-3.5" /> Available on {new Date(dayDate).toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' })}
          </div>
        ) : (
          <button onClick={handleToggle} disabled={isToggling}
            className={`w-full py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
              mealDone
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:text-emerald-700'
            }`}>
            {isToggling
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : mealDone
                ? <><Check className="w-4 h-4" /> Done — Tap to undo</>
                : <><CheckSquare className="w-4 h-4" /> Mark as Done</>
            }
          </button>
        )
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
  const future         = isFutureDay(day.date)

  return (
    <div className="card bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-100 dark:border-emerald-800">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="font-display font-bold text-slate-700 dark:text-white text-base flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-emerald-600" /> {day.dayName}
          {day.date && (
            <span className="ml-1.5 font-normal text-slate-400 text-xs">
              · {new Date(day.date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
          {' '}— Daily Summary
          {future && (
            <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
              <Lock className="w-3 h-3" /> Upcoming
            </span>
          )}
        </h3>
        {!future && (
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-semibold text-emerald-600">{completedMeals}/{totalMeals} done</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-5 gap-2">
        {[
          { label: 'Calories', value: totals.cal,          color: 'text-emerald-600' },
          { label: 'Protein',  value: `${totals.prot}g`,   color: 'text-blue-600' },
          { label: 'Carbs',    value: `${totals.carbs}g`,  color: 'text-orange-500' },
          { label: 'Fat',      value: `${totals.fat}g`,    color: 'text-purple-600' },
          { label: 'Cost',     value: `₨${totals.cost}`,   color: 'text-amber-600' },
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
          <h3 className="font-display font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-emerald-600" /> Week {progress.weekNumber} Progress
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {completedMeals}/{totalMeals} meals completed · <span className="font-semibold text-emerald-600">{pct}% adherence</span>
          </p>
        </div>
        {weekCompleted && !checkInCompleted && (
          <button onClick={onCheckInClick}
            className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20 animate-pulse">
            Complete Check-In
          </button>
        )}
        {checkInCompleted && (
          <span className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-xl flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Week Complete
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
              <div className={`h-2 rounded-full mx-auto mb-1 transition-all ${
                dp === 100 ? 'bg-emerald-500' : dp >= 50 ? 'bg-amber-400' : dp > 0 ? 'bg-orange-300' : 'bg-slate-200 dark:bg-slate-700'
              }`} />
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
    { text: 'Analysing your health conditions...', icon: HeartPulse },
    { text: 'AI building clinical dietary brief...', icon: Bot },
    { text: 'Selecting medically safe foods...', icon: Activity },
    { text: 'Fetching live PKR prices...', icon: Globe },
    { text: 'Assembling your 7-day plan...', icon: CalendarDays },
    { text: 'Almost ready...', icon: CheckCircle2 },
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
        <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-5 min-h-[40px] transition-all duration-300">
          {(() => {
            const CurrentIcon = steps[step].icon
            return <><CurrentIcon className="w-5 h-5 text-emerald-500" /> {steps[step].text}</>
          })()}
        </div>
        <div className="flex gap-1 justify-center">
          {steps.map((_, i) => (
            <div key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-600'}`}
              style={{ width: i <= step ? '18px' : '6px' }} />
          ))}
        </div>
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

  const [showGenerator,      setShowGenerator]      = useState(false)
  const [budgetOverride,     setBudgetOverride]      = useState('')
  const [swapData,           setSwapData]            = useState(null)
  const [recipeData,         setRecipeData]          = useState(null)

  // ── Data-source disclosure popup state ────────────────────
  // We track the last planId we showed popups for, so they
  // don't re-appear if the user navigates away and back.
  const [disclosurePlanId,   setDisclosurePlanId]   = useState(null)
  const [showPlanPopup,      setShowPlanPopup]       = useState(false)
  const [showPricePopup,     setShowPricePopup]      = useState(false)

  useEffect(() => {
    dispatch(fetchProfile())
    dispatch(fetchMealPlans())
    dispatch(fetchActivePlan())
    dispatch(fetchCurrentProgress())
  }, [dispatch])

  useEffect(() => {
    if (current?._id) dispatch(fetchCurrentProgress())
  }, [current?._id, dispatch])

  const activePlan = current || list?.[0]

  // Auto-select today's day
  useEffect(() => {
    if (!activePlan?.days?.length) return
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayIdx = activePlan.days.findIndex((d) => {
      if (!d.date) return false
      const dayDate = new Date(d.date)
      dayDate.setHours(0, 0, 0, 0)
      return dayDate.getTime() === today.getTime()
    })
    dispatch(setSelectedDay(todayIdx !== -1 ? todayIdx : 0))
  }, [activePlan?._id])

  // ── Trigger disclosure popups when a new plan loads ───────
  // Show plan popup first, then price popup after user dismisses plan popup.
  // We store the planId we last showed popups for to avoid repeat shows.
  useEffect(() => {
    if (!activePlan?._id) return
    if (activePlan._id === disclosurePlanId) return   // already shown for this plan

    setDisclosurePlanId(activePlan._id)
    // Show plan source popup first
    setShowPlanPopup(true)
    // Price popup will be triggered after plan popup is dismissed
  }, [activePlan?._id])

  const handlePlanPopupDismiss = () => {
    setShowPlanPopup(false)
    // After plan popup, show price popup
    if (activePlan?.priceDataSource) {
      setShowPricePopup(true)
    }
  }

  const handlePricePopupDismiss = () => {
    setShowPricePopup(false)
  }

  const activeProgress      = (progress?.mealPlan === activePlan?._id || progress?.mealPlan?._id === activePlan?._id) ? progress : null
  const selectedDayProgress = activeProgress?.days?.find((d) => d.day === selectedDay + 1)
  const selectedDayDate     = activePlan?.days?.[selectedDay]?.date || null

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
      <div className="max-w-lg mx-auto text-center py-20 animate-fade-in card border-dashed border-2 bg-slate-50/50 dark:bg-slate-800/50">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
          <Hospital className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="font-display font-bold text-2xl text-slate-800 dark:text-white mb-2">Setup your health profile first</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6 text-base leading-relaxed">We need your health info, conditions, and budget to generate a safe, personalized plan.</p>
        <Link to="/profile" className="btn-primary py-3 px-8 inline-flex">Setup Health Profile →</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Data Source Disclosure Popups ─────────────────── */}
      {showPlanPopup && activePlan && (
        <DataSourcePopup
          type="plan"
          planDataSource={activePlan.planDataSource || 'ai_generated'}
          onDismiss={handlePlanPopupDismiss}
        />
      )}
      {showPricePopup && activePlan && (
        <DataSourcePopup
          type="price"
          priceDataSource={activePlan.priceDataSource || 'static'}
          priceSourceSummary={activePlan.priceSourceSummary}
          onDismiss={handlePricePopupDismiss}
        />
      )}

      {/* ── Generating / CheckIn Overlays ─────────────────── */}
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
          <p className="page-subtitle">Personalized 7-day plans · Live PKR prices · Daily check-offs</p>
        </div>
        <button onClick={() => setShowGenerator(true)} disabled={generating}
          className="btn-primary flex items-center gap-2 flex-shrink-0">
          <Bot className="w-5 h-5" /> Generate New Plan
        </button>
      </div>

      {/* ── Error Banner ──────────────────────────────────── */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
          <AlertTriangle className="text-red-500 w-5 h-5 flex-shrink-0" />
          <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* ── Generator Modal ──────────────────────────────── */}
      {showGenerator && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md animate-slide-up">
            <h3 className="font-display font-bold text-xl text-slate-800 dark:text-white mb-1">Generate 7-Day Plan</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-5">Health profile & real-time PKR prices applied automatically</p>

            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-5 space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <p className="flex items-center gap-1.5"><Hospital className="w-3.5 h-3.5 text-slate-400" /> Conditions: {[profile.isDiabetic && 'Diabetes', profile.isHypertensive && 'Hypertension', profile.isCardiac && 'Cardiac', profile.hasKidneyDisease && 'Kidney', profile.hasThyroid && 'Thyroid'].filter(Boolean).join(', ') || 'None'}</p>
              <p className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-slate-400" /> Allergies: {profile.allergies?.join(', ') || 'None'}</p>
              <p className="flex items-center gap-1.5"><Flame className="w-3.5 h-3.5 text-orange-500" /> Daily target: ~{Math.round(profile.dailyCalorieTarget || profile.tdee || 2000)} kcal</p>
              <p className="flex items-center gap-1.5"><Coins className="w-3.5 h-3.5 text-amber-500" /> Default budget: ₨{profile.dailyBudget}/day</p>
              <p className="text-emerald-600 font-semibold flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Prices sourced live from web</p>
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
              <button onClick={handleGenerate} className="btn-primary flex-1"><Bot className="w-5 h-5" /> Generate Now</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Plan View ────────────────────────────────────── */}
      {activePlan ? (
        <>
          {activeProgress && <WeeklyProgressBar progress={activeProgress} onCheckInClick={() => dispatch(setShowCheckIn(true))} />}

          {/* Plan Info Bar */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center">
                  <CalendarDays className="w-6 h-6 text-emerald-600" />
                </div>
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
                  <p className="font-bold text-emerald-600 text-sm">₨{activePlan.weeklyTotalCost || 0}</p>
                  <p className="text-xs text-slate-400">Weekly Cost</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-amber-600 text-sm">{Math.round((activePlan.weeklyTotalCalories || 0) / 7)}</p>
                  <p className="text-xs text-slate-400">Avg kcal/day</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-blue-600 text-sm">₨{activePlan.avgDailyCost || Math.round((activePlan.weeklyTotalCost || 0) / 7)}</p>
                  <p className="text-xs text-slate-400">Per Day</p>
                </div>
              </div>
              <Link to="/grocery" className="btn-amber py-2 px-4 text-sm flex-shrink-0 flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4"/> Grocery List
              </Link>
            </div>

            {/* Data source info bar — clickable to re-open popups */}
            <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
              {/* Plan source badge */}
              <button
                onClick={() => setShowPlanPopup(true)}
                title="Click to learn more about how your meal plan was generated"
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-opacity hover:opacity-80 ${
                  activePlan.planDataSource === 'greedy_fallback'
                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
                    : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                }`}
              >
                {activePlan.planDataSource === 'greedy_fallback'
                  ? <><Database className="w-3.5 h-3.5" /> Fallback Plan <Info className="w-3 h-3 opacity-60" /></>
                  : <><Sparkles className="w-3.5 h-3.5" /> AI Generated <Info className="w-3 h-3 opacity-60" /></>
                }
              </button>

              {/* Price source badge */}
              {activePlan.priceDataSource && (
                <button
                  onClick={() => setShowPricePopup(true)}
                  title="Click to learn more about how prices were sourced"
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <span className="text-xs text-slate-400">Prices:</span>
                  <PriceSourceBadge source={activePlan.priceDataSource} />
                  <Info className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                </button>
              )}

              {/* Source counts */}
              {activePlan.priceSourceSummary && (
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                  {(activePlan.priceSourceSummary.grounded || activePlan.priceSourceSummary.live || 0) > 0 &&
                    <span className="text-emerald-600 flex items-center gap-1">
                      <Globe className="w-3 h-3"/>
                      {(activePlan.priceSourceSummary.grounded || 0) + (activePlan.priceSourceSummary.live || 0)} live
                    </span>
                  }
                  {activePlan.priceSourceSummary.ai > 0 &&
                    <span className="text-blue-600 flex items-center gap-1"><Bot className="w-3 h-3"/> {activePlan.priceSourceSummary.ai} AI</span>
                  }
                  {activePlan.priceSourceSummary.static > 0 &&
                    <span className="text-amber-600 flex items-center gap-1"><BarChart2 className="w-3 h-3"/> {activePlan.priceSourceSummary.static} research</span>
                  }
                </div>
              )}
            </div>
          </div>

          {/* Day Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 snap-x">
            {(activePlan.days || []).map((dayObj, i) => {
              const dp      = activeProgress?.days?.find((d) => d.day === i + 1)
              const done    = dp?.meals?.filter((m) => m.completed).length || 0
              const total   = dp?.meals?.length || 4
              const allDone = done === total && total > 0
              const future  = isFutureDay(dayObj.date)
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
                    <span className={`flex justify-center items-center gap-0.5 text-[10px] mt-0.5 ${
                      future
                        ? selectedDay === i ? 'text-white/60' : 'text-slate-300 dark:text-slate-600'
                        : allDone ? 'text-emerald-300' : selectedDay === i ? 'text-white/70' : 'text-slate-400'
                    }`}>
                      {future ? <Lock className="w-3 h-3" /> : allDone ? <Check className="w-3 h-3" /> : `${done}/${total}`}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {activePlan.days?.[selectedDay] && (
            <DayNutritionSummary day={activePlan.days[selectedDay]} dayProgress={selectedDayProgress} />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MEAL_ORDER.map((mealType) => (
              <MealCheckCard key={mealType} mealType={mealType}
                meal={activePlan.days?.[selectedDay]?.meals?.[mealType]}
                dayNum={selectedDay + 1} progressId={activeProgress?._id}
                dayProgress={selectedDayProgress} toggling={toggling}
                dayDate={selectedDayDate}
                onSwapClick={(mt) => setSwapData({ day: selectedDay + 1, mealType: mt, planId: activePlan._id })}
                onRecipeClick={(meal) => setRecipeData({ foodId: meal.foodId, foodName: meal.name })} />
            ))}
          </div>

          <MealSwapModal
            isOpen={!!swapData}
            onClose={() => setSwapData(null)}
            day={swapData?.day}
            mealType={swapData?.mealType}
            planId={swapData?.planId}
          />

          <RecipeModal
            isOpen={!!recipeData}
            onClose={() => setRecipeData(null)}
            foodId={recipeData?.foodId}
            foodName={recipeData?.foodName}
          />

          {!activeProgress && activePlan?._id && (
            <div className="card text-center py-10 border-dashed border-2 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-base font-bold text-slate-800 dark:text-white mb-2">Enable meal tracking</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">Track daily meals and get a personalized next-week update based on your adherence</p>
              <button
                onClick={() => dispatch(require('../store/slices/progressSlice').initProgress(activePlan._id))
                  .then(() => dispatch(fetchCurrentProgress()))}
                className="btn-primary py-2.5 px-8 inline-flex">
                <Activity className="w-4 h-4" /> Start Tracking
              </button>
            </div>
          )}

          {list.length > 1 && (
            <div className="card">
              <h3 className="font-display font-bold text-slate-800 dark:text-white mb-4 text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-400" /> Past Meal Plans
              </h3>
              <div className="space-y-2">
                {list.slice(1, 6).map((plan, i) => (
                  <div key={plan._id || i} className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">7-Day Plan #{list.length - i - 1}</p>
                      <p className="text-xs text-slate-400">{new Date(plan.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-amber-600 font-semibold">₨{plan.weeklyTotalCost || '—'}</span>
                      <span className="badge bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-0.5 rounded-full">Archived</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card text-center py-20 border-dashed border-2 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
            <Utensils className="w-12 h-12 text-emerald-600" />
          </div>
          <h3 className="font-display font-bold text-3xl text-slate-800 dark:text-white mb-3">No meal plans yet</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-8 text-base max-w-md mx-auto leading-relaxed">
            Generate your first AI-powered 7-day plan with live PKR prices and clinical safety checks.
          </p>
          <button onClick={() => setShowGenerator(true)} className="btn-primary py-3 px-8 text-base inline-flex">
            <Bot className="w-5 h-5" /> Generate My First Plan
          </button>
        </div>
      )}
    </div>
  )
}
