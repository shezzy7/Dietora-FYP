// src/components/onboarding/WeeklyCheckIn.jsx
// End-of-week health check-in modal — submitted after 7 days to generate next plan
// Uses progressSlice (not weeklyProgressSlice)

import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { submitCheckIn, setShowCheckIn } from '../../store/slices/progressSlice'

const FEELINGS = [
  { value: 'much_better', label: 'Much Better', icon: '🤩' },
  { value: 'better',      label: 'Better',       icon: '😊' },
  { value: 'same',        label: 'About the Same', icon: '😐' },
  { value: 'worse',       label: 'Worse',        icon: '😔' },
  { value: 'much_worse',  label: 'Much Worse',   icon: '😢' },
]

const ENERGY_LEVELS = [
  { value: 'very_high', label: 'Very High', icon: '⚡' },
  { value: 'high',      label: 'High',      icon: '🔋' },
  { value: 'moderate',  label: 'Moderate',  icon: '🔆' },
  { value: 'low',       label: 'Low',       icon: '😴' },
  { value: 'very_low',  label: 'Very Low',  icon: '🪫' },
]

const DIGESTION = [
  { value: 'excellent', label: 'Excellent', icon: '✅' },
  { value: 'good',      label: 'Good',      icon: '👍' },
  { value: 'fair',      label: 'Fair',      icon: '🤔' },
  { value: 'poor',      label: 'Poor',      icon: '❌' },
]

const WEIGHT_CHANGE = [
  { value: 'lost',       label: 'Lost weight',       icon: '📉' },
  { value: 'maintained', label: 'Stayed the same',   icon: '⚖️' },
  { value: 'gained',     label: 'Gained weight',     icon: '📈' },
]

export default function WeeklyCheckIn({ progress, onRegenerate }) {
  const dispatch = useDispatch()
  const { submitting } = useSelector((s) => s.progress)

  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    overallFeeling: '',
    weightChange: '',
    currentWeight: '',
    energyLevel: '',
    digestiveHealth: '',
    diseaseSymptoms: '',
    notes: '',
  })

  const update = (key, val) => setForm((p) => ({ ...p, [key]: val }))

  const weekStats = {
    completedMeals: progress?.completedMeals || 0,
    totalMeals: progress?.totalMeals || 28,
    adherencePercent: progress?.adherencePercent || 0,
    weekNumber: progress?.weekNumber || 1,
  }

  const handleSubmit = async () => {
    const result = await dispatch(submitCheckIn({ progressId: progress._id, checkIn: form }))
    if (result.payload) {
      onRegenerate?.(progress._id)
    }
  }

  // ── Step 0: Week Summary ──────────────────────────────
  const renderSummary = () => (
    <div className="text-center">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white mb-2">
        Week {weekStats.weekNumber} Complete!
      </h2>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
        Let's review how your week went before we build your next personalized plan
      </p>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
          <p className="text-2xl font-bold text-emerald-600">{weekStats.adherencePercent}%</p>
          <p className="text-xs text-slate-500 mt-1">Plan followed</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
          <p className="text-2xl font-bold text-blue-600">{weekStats.completedMeals}</p>
          <p className="text-xs text-slate-500 mt-1">Meals eaten</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
          <p className="text-2xl font-bold text-amber-600">
            {weekStats.totalMeals - weekStats.completedMeals}
          </p>
          <p className="text-xs text-slate-500 mt-1">Meals missed</p>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-left text-sm text-slate-600 dark:text-slate-400">
        <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">
          📝 Quick health check-in
        </p>
        <p>
          Answer a few questions so we can adjust Week {weekStats.weekNumber + 1}'s plan to your current health status.
        </p>
      </div>
    </div>
  )

  // ── Step 1: Overall feeling ───────────────────────────
  const renderFeeling = () => (
    <div>
      <h3 className="font-display font-bold text-xl text-slate-800 dark:text-white mb-1">
        How are you feeling overall?
      </h3>
      <p className="text-sm text-slate-400 mb-5">
        Compared to when you started this diet plan
      </p>
      <div className="space-y-2">
        {FEELINGS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => update('overallFeeling', f.value)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
              form.overallFeeling === f.value
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300'
            }`}
          >
            <span className="text-3xl">{f.icon}</span>
            <span className="font-semibold text-slate-800 dark:text-white">{f.label}</span>
            {form.overallFeeling === f.value && (
              <span className="ml-auto text-emerald-600 font-bold text-lg">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )

  // ── Step 2: Weight & body metrics ────────────────────
  const renderMetrics = () => (
    <div>
      <h3 className="font-display font-bold text-xl text-slate-800 dark:text-white mb-1">
        Body Update
      </h3>
      <p className="text-sm text-slate-400 mb-5">
        Update your weight to get a more accurate calorie target next week
      </p>

      {/* Weight change */}
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
        Did your weight change this week?
      </p>
      <div className="grid grid-cols-3 gap-2 mb-5">
        {WEIGHT_CHANGE.map((w) => (
          <button
            key={w.value}
            type="button"
            onClick={() => update('weightChange', w.value)}
            className={`p-3 rounded-xl border-2 text-center transition-all ${
              form.weightChange === w.value
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300'
            }`}
          >
            <span className="block text-2xl mb-1">{w.icon}</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{w.label}</span>
          </button>
        ))}
      </div>

      {/* Current weight input */}
      <div className="mb-5">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
          Current weight (kg) <span className="font-normal text-slate-400">— optional but recommended</span>
        </label>
        <div className="relative">
          <input
            type="number"
            min="10" max="300" step="0.1"
            value={form.currentWeight}
            onChange={(e) => update('currentWeight', e.target.value)}
            placeholder="e.g. 68.5"
            className="w-full border-2 border-slate-200 dark:border-slate-600 rounded-xl p-3 pr-12 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">kg</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          We'll recalculate your BMR, TDEE, and calorie targets automatically
        </p>
      </div>

      {/* Energy level */}
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Energy level this week</p>
      <div className="grid grid-cols-5 gap-2 mb-5">
        {ENERGY_LEVELS.map((e) => (
          <button
            key={e.value}
            type="button"
            onClick={() => update('energyLevel', e.value)}
            className={`p-2 rounded-xl border-2 text-center text-xs transition-all ${
              form.energyLevel === e.value
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
            }`}
          >
            <span className="block text-xl mb-1">{e.icon}</span>
            <span className="text-slate-600 dark:text-slate-400 leading-tight">{e.label}</span>
          </button>
        ))}
      </div>

      {/* Digestive health */}
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Digestive health</p>
      <div className="grid grid-cols-4 gap-2">
        {DIGESTION.map((d) => (
          <button
            key={d.value}
            type="button"
            onClick={() => update('digestiveHealth', d.value)}
            className={`p-2 rounded-xl border-2 text-center text-xs transition-all ${
              form.digestiveHealth === d.value
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300'
            }`}
          >
            <span className="block text-xl mb-1">{d.icon}</span>
            <span className="text-slate-600 dark:text-slate-400">{d.label}</span>
          </button>
        ))}
      </div>
    </div>
  )

  // ── Step 3: Disease symptoms + notes ─────────────────
  const renderSymptoms = () => (
    <div>
      <h3 className="font-display font-bold text-xl text-slate-800 dark:text-white mb-1">
        Health Notes
      </h3>
      <p className="text-sm text-slate-400 mb-5">
        Any symptoms, concerns, or feedback for your next plan?
      </p>

      <div className="mb-4">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
          Disease / symptom update <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <textarea
          value={form.diseaseSymptoms}
          onChange={(e) => update('diseaseSymptoms', e.target.value)}
          placeholder="e.g. My blood sugar improved this week. BP is still slightly high. I felt bloated after the lentil meals..."
          rows={3}
          className="w-full border-2 border-slate-200 dark:border-slate-600 rounded-xl p-3 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 resize-none"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
          Anything else for next week's plan? <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <textarea
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
          placeholder="e.g. I couldn't find karela in my area. Dinner portions were too small. Can we get more chicken-based meals?"
          rows={3}
          className="w-full border-2 border-slate-200 dark:border-slate-600 rounded-xl p-3 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 resize-none"
        />
      </div>

      <div className="mt-5 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl text-sm text-emerald-700 dark:text-emerald-400">
        🤖 After you submit, DIETORA will generate your Week {weekStats.weekNumber + 1} plan adjusted to your health update — with real-time PKR prices.
      </div>
    </div>
  )

  const STEP_RENDERERS = [renderSummary, renderFeeling, renderMetrics, renderSymptoms]
  const TOTAL = STEP_RENDERERS.length
  const isLast = step === TOTAL - 1

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up">

        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 rounded-t-3xl px-6 pt-6 pb-3 border-b border-slate-100 dark:border-slate-800 z-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">
              Week {weekStats.weekNumber} Check-In · {step + 1}/{TOTAL}
            </span>
            <button
              onClick={() => dispatch(setShowCheckIn(false))}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none"
            >
              ✕
            </button>
          </div>
          {/* Progress bar */}
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL }, (_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  i <= step ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {STEP_RENDERERS[step]?.()}
        </div>

        {/* Navigation */}
        <div className="sticky bottom-0 bg-white dark:bg-slate-900 rounded-b-3xl px-6 pb-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="flex-1 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold text-sm hover:border-slate-300 transition-all"
              >
                ← Back
              </button>
            )}
            {isLast ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating next plan...
                  </>
                ) : `🚀 Submit & Get Week ${weekStats.weekNumber + 1} Plan`}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all"
              >
                Continue →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
