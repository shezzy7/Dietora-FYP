// src/components/onboarding/OnboardingWizard.jsx
// Full multi-step onboarding wizard shown to new users after registration

import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { completeOnboarding, updateWizardData } from '../../store/slices/onboardingSlice'
import { fetchProfile } from '../../store/slices/profileSlice'

// ─── Constants ────────────────────────────────────────────
const PRIMARY_REASONS = [
  { value: 'manage_disease', label: 'Manage a health condition', icon: '🏥', desc: 'Diabetes, BP, cardiac, etc.' },
  { value: 'weight_loss', label: 'Lose weight', icon: '📉', desc: 'Shed extra kgs safely' },
  { value: 'weight_gain', label: 'Gain weight', icon: '💪', desc: 'Build muscle & mass' },
  { value: 'healthy_eating', label: 'Eat healthier', icon: '🥗', desc: 'Better nutrition habits' },
  { value: 'budget_eating', label: 'Save money on food', icon: '💰', desc: 'Nutritious & affordable' },
  { value: 'other', label: 'Something else', icon: '✨', desc: 'Tell us more below' },
]

const DISEASES = [
  { key: 'isDiabetic', label: 'Diabetes (Sugar)', icon: '🩸', desc: 'Type 1 or Type 2' },
  { key: 'isHypertensive', label: 'Hypertension (High BP)', icon: '❤️', desc: 'Blood pressure issues' },
  { key: 'isCardiac', label: 'Heart / Cardiac', icon: '🫀', desc: 'Heart disease or condition' },
  { key: 'hasKidneyDisease', label: 'Kidney Disease', icon: '🫘', desc: 'CKD or related' },
  { key: 'hasThyroid', label: 'Thyroid Disorder', icon: '🦋', desc: 'Hypo or Hyperthyroid' },
]

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Mostly sitting', icon: '🛋️', desc: 'Desk job, little exercise' },
  { value: 'lightly_active', label: 'Light activity', icon: '🚶', desc: 'Walk 1–3 days/week' },
  { value: 'moderately_active', label: 'Moderately active', icon: '🏃', desc: 'Exercise 3–5 days/week' },
  { value: 'very_active', label: 'Very active', icon: '🏋️', desc: 'Intense exercise 6–7 days' },
  { value: 'extra_active', label: 'Extremely active', icon: '⚡', desc: 'Physical job + daily training' },
]

const GOALS = [
  { value: 'weight_loss', label: 'Lose Weight', icon: '📉', desc: '500 kcal deficit/day' },
  { value: 'maintenance', label: 'Maintain Weight', icon: '⚖️', desc: 'Stay at current weight' },
  { value: 'weight_gain', label: 'Gain Weight', icon: '📈', desc: '500 kcal surplus/day' },
]

const ALLERGIES = ['nuts', 'dairy', 'gluten', 'shellfish', 'eggs', 'soy']
const BUDGET_PRESETS = [200, 350, 500, 750, 1000, 1500]

// ─── Step Progress Bar ────────────────────────────────────
function StepBar({ current, total }) {
  return (
    <div className="flex gap-1.5 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
            i < current
              ? 'bg-emerald-500'
              : i === current
              ? 'bg-emerald-300'
              : 'bg-slate-200 dark:bg-slate-700'
          }`}
        />
      ))}
    </div>
  )
}

// ─── BMI Live Calculator ──────────────────────────────────
function BmiDisplay({ weight, height }) {
  if (!weight || !height) return null
  const bmi = parseFloat((weight / Math.pow(height / 100, 2)).toFixed(1))
  const getInfo = () => {
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' }
    if (bmi < 25) return { label: 'Normal ✓', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' }
    if (bmi < 30) return { label: 'Overweight', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' }
    return { label: 'Obese', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' }
  }
  const info = getInfo()
  return (
    <div className={`mt-4 p-3 rounded-xl flex items-center justify-between ${info.bg}`}>
      <span className="text-sm text-slate-600 dark:text-slate-300">Your BMI</span>
      <span className={`font-bold text-lg ${info.color}`}>{bmi} — {info.label}</span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  MAIN WIZARD COMPONENT
// ═══════════════════════════════════════════════════════════
export default function OnboardingWizard({ onComplete }) {
  const dispatch = useDispatch()
  const { saving } = useSelector((s) => s.onboarding)
  const { user } = useSelector((s) => s.auth)

  const [step, setStep] = useState(0)
  const [data, setData] = useState({
    primaryGoalReason: '',
    hasDisease: null,          // null = not answered yet
    diseaseDescription: '',
    isDiabetic: false,
    isHypertensive: false,
    isCardiac: false,
    hasKidneyDisease: false,
    hasThyroid: false,
    age: '',
    gender: 'male',
    weight: '',
    height: '',
    activityLevel: 'moderately_active',
    goal: 'maintenance',
    allergies: [],
    dailyBudget: 500,
  })
  const [errors, setErrors] = useState({})

  const firstName = user?.name?.split(' ')[0] || 'there'
  const TOTAL_STEPS = 7

  const update = (field, value) => {
    setData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const toggleAllergy = (a) => {
    setData((prev) => ({
      ...prev,
      allergies: prev.allergies.includes(a)
        ? prev.allergies.filter((x) => x !== a)
        : [...prev.allergies, a],
    }))
  }

  const validateStep = () => {
    const e = {}
    if (step === 0 && !data.primaryGoalReason) e.primaryGoalReason = 'Please select a reason'
    if (step === 1 && data.hasDisease === null) e.hasDisease = 'Please answer this question'
    if (step === 3) {
      if (!data.age || parseInt(data.age) < 5 || parseInt(data.age) > 120) e.age = 'Valid age required (5–120)'
      if (!data.weight || parseFloat(data.weight) < 10) e.weight = 'Valid weight required'
      if (!data.height || parseFloat(data.height) < 50) e.height = 'Valid height required'
    }
    if (step === 6 && (!data.dailyBudget || parseInt(data.dailyBudget) < 100)) {
      e.dailyBudget = 'Minimum budget is ₨100'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => {
    if (!validateStep()) return
    // Skip disease description step if user said No
    if (step === 1 && data.hasDisease === false) {
      setStep(3) // skip step 2
      return
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))
  }

  const back = () => {
    // If on step 3 and hasDisease is false, go back to step 1
    if (step === 3 && data.hasDisease === false) {
      setStep(1)
      return
    }
    setStep((s) => Math.max(s - 1, 0))
  }

  const handleSubmit = async () => {
    if (!validateStep()) return
    await dispatch(completeOnboarding(data))
    await dispatch(fetchProfile())
    onComplete?.()
  }

  // ── STEP RENDERERS ────────────────────────────────────────

  // Step 0: Why are you here?
  const renderStep0 = () => (
    <div>
      <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white mb-1">
        Welcome, {firstName}! 👋
      </h2>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
        Tell us why you're here so we can personalize your experience
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PRIMARY_REASONS.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => update('primaryGoalReason', r.value)}
            className={`p-4 rounded-xl border-2 text-left transition-all duration-150 ${
              data.primaryGoalReason === r.value
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600'
            }`}
          >
            <span className="text-2xl">{r.icon}</span>
            <p className="font-semibold text-sm text-slate-800 dark:text-white mt-2">{r.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{r.desc}</p>
          </button>
        ))}
      </div>
      {errors.primaryGoalReason && (
        <p className="text-red-500 text-sm mt-3">{errors.primaryGoalReason}</p>
      )}
    </div>
  )

  // Step 1: Are you struggling with a disease?
  const renderStep1 = () => (
    <div>
      <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white mb-1">
        Health Check
      </h2>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
        This helps us create a safe, medically appropriate diet plan for you
      </p>
      <p className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-5">
        Are you struggling with any disease or health condition?
      </p>
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => { update('hasDisease', true) }}
          className={`p-6 rounded-2xl border-2 text-center transition-all duration-200 ${
            data.hasDisease === true
              ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
              : 'border-slate-200 dark:border-slate-700 hover:border-red-300'
          }`}
        >
          <span className="text-4xl block mb-3">😷</span>
          <p className="font-bold text-slate-800 dark:text-white text-lg">Yes</p>
          <p className="text-xs text-slate-400 mt-1">I have a health condition</p>
        </button>
        <button
          type="button"
          onClick={() => { update('hasDisease', false) }}
          className={`p-6 rounded-2xl border-2 text-center transition-all duration-200 ${
            data.hasDisease === false
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
              : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300'
          }`}
        >
          <span className="text-4xl block mb-3">💪</span>
          <p className="font-bold text-slate-800 dark:text-white text-lg">No</p>
          <p className="text-xs text-slate-400 mt-1">I'm generally healthy</p>
        </button>
      </div>
      {errors.hasDisease && <p className="text-red-500 text-sm mt-3">{errors.hasDisease}</p>}
    </div>
  )

  // Step 2: Tell us about your condition
  const renderStep2 = () => (
    <div>
      <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white mb-1">
        Your Health Condition
      </h2>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
        This helps us suggest only safe foods and flag dangerous ones for you
      </p>

      {/* Disease checkboxes */}
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
        Which conditions apply? (select all that apply)
      </p>
      <div className="space-y-2 mb-6">
        {DISEASES.map((d) => (
          <button
            key={d.key}
            type="button"
            onClick={() => update(d.key, !data[d.key])}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-150 ${
              data[d.key]
                ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-red-200'
            }`}
          >
            <span className="text-2xl">{d.icon}</span>
            <div className="flex-1">
              <p className="font-semibold text-sm text-slate-800 dark:text-white">{d.label}</p>
              <p className="text-xs text-slate-400">{d.desc}</p>
            </div>
            <div className={`w-5 h-5 rounded flex items-center justify-center border-2 flex-shrink-0 ${
              data[d.key] ? 'bg-red-500 border-red-500' : 'border-slate-300 dark:border-slate-600'
            }`}>
              {data[d.key] && <span className="text-white text-xs font-bold">✓</span>}
            </div>
          </button>
        ))}
      </div>

      {/* Free-text description */}
      <div>
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
          Tell us more about your condition <span className="font-normal text-slate-400">(optional but helpful)</span>
        </label>
        <textarea
          value={data.diseaseDescription}
          onChange={(e) => update('diseaseDescription', e.target.value)}
          placeholder="e.g. I have Type 2 Diabetes since 3 years. My sugar stays around 180. I also have mild BP issues and my doctor advised me to avoid salty foods..."
          rows={4}
          className="w-full border-2 border-slate-200 dark:border-slate-600 rounded-xl p-3 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 resize-none"
        />
        <p className="text-xs text-slate-400 mt-1">
          The more you tell us, the better we can tailor your diet plan
        </p>
      </div>
    </div>
  )

  // Step 3: Basic measurements
  const renderStep3 = () => (
    <div>
      <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white mb-1">
        Your Body Stats
      </h2>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
        Used to calculate your BMI, BMR, and daily calorie needs
      </p>
      <div className="space-y-4">
        {/* Gender */}
        <div>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">Gender</label>
          <div className="grid grid-cols-2 gap-3">
            {[{ value: 'male', label: 'Male', icon: '👨' }, { value: 'female', label: 'Female', icon: '👩' }].map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => update('gender', g.value)}
                className={`p-3 rounded-xl border-2 flex items-center gap-3 transition-all ${
                  data.gender === g.value
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <span className="text-xl">{g.icon}</span>
                <span className="font-semibold text-sm text-slate-800 dark:text-white">{g.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Age */}
        <div>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
            Age (years)
          </label>
          <input
            type="number"
            min="5"
            max="120"
            value={data.age}
            onChange={(e) => update('age', e.target.value)}
            placeholder="e.g. 28"
            className={`w-full border-2 rounded-xl p-3 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 ${
              errors.age ? 'border-red-400' : 'border-slate-200 dark:border-slate-600'
            }`}
          />
          {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
        </div>

        {/* Weight + Height */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Weight (kg)
            </label>
            <input
              type="number"
              min="10"
              max="300"
              step="0.1"
              value={data.weight}
              onChange={(e) => update('weight', e.target.value)}
              placeholder="e.g. 70"
              className={`w-full border-2 rounded-xl p-3 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 ${
                errors.weight ? 'border-red-400' : 'border-slate-200 dark:border-slate-600'
              }`}
            />
            {errors.weight && <p className="text-red-500 text-xs mt-1">{errors.weight}</p>}
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Height (cm)
            </label>
            <input
              type="number"
              min="50"
              max="250"
              value={data.height}
              onChange={(e) => update('height', e.target.value)}
              placeholder="e.g. 170"
              className={`w-full border-2 rounded-xl p-3 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 ${
                errors.height ? 'border-red-400' : 'border-slate-200 dark:border-slate-600'
              }`}
            />
            {errors.height && <p className="text-red-500 text-xs mt-1">{errors.height}</p>}
          </div>
        </div>

        {/* Live BMI */}
        <BmiDisplay weight={parseFloat(data.weight)} height={parseFloat(data.height)} />
      </div>
    </div>
  )

  // Step 4: Activity level
  const renderStep4 = () => (
    <div>
      <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white mb-1">
        How Active Are You?
      </h2>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
        This determines your TDEE (total daily calorie burn)
      </p>
      <div className="space-y-3">
        {ACTIVITY_LEVELS.map((level) => (
          <button
            key={level.value}
            type="button"
            onClick={() => update('activityLevel', level.value)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-150 ${
              data.activityLevel === level.value
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300'
            }`}
          >
            <span className="text-2xl">{level.icon}</span>
            <div>
              <p className="font-semibold text-sm text-slate-800 dark:text-white">{level.label}</p>
              <p className="text-xs text-slate-400">{level.desc}</p>
            </div>
            {data.activityLevel === level.value && (
              <span className="ml-auto text-emerald-600 text-lg">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )

  // Step 5: Goal
  const renderStep5 = () => (
    <div>
      <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white mb-1">
        What's Your Goal?
      </h2>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
        Your meal plan calories will be adjusted based on this
      </p>
      <div className="space-y-4">
        {GOALS.map((g) => (
          <button
            key={g.value}
            type="button"
            onClick={() => update('goal', g.value)}
            className={`w-full flex items-center gap-5 p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
              data.goal === g.value
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300'
            }`}
          >
            <span className="text-4xl">{g.icon}</span>
            <div>
              <p className="font-bold text-slate-800 dark:text-white">{g.label}</p>
              <p className="text-sm text-slate-400 mt-0.5">{g.desc}</p>
            </div>
            {data.goal === g.value && (
              <span className="ml-auto text-emerald-600 text-xl font-bold">✓</span>
            )}
          </button>
        ))}
      </div>

      {/* Allergies */}
      <div className="mt-6">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
          Any food allergies? <span className="font-normal text-slate-400">(optional)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {ALLERGIES.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => toggleAllergy(a)}
              className={`px-4 py-2 rounded-full border-2 text-sm capitalize font-medium transition-all ${
                data.allergies.includes(a)
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700'
                  : 'border-slate-200 dark:border-slate-600 text-slate-500 hover:border-amber-300'
              }`}
            >
              {data.allergies.includes(a) ? '✓ ' : ''}{a}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  // Step 6: Budget
  const renderStep6 = () => (
    <div>
      <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white mb-1">
        Daily Food Budget
      </h2>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
        We'll suggest meals that fit within your Pakistani Rupee budget
      </p>

      {/* Preset buttons */}
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
        Quick select:
      </p>
      <div className="grid grid-cols-3 gap-3 mb-5">
        {BUDGET_PRESETS.map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => update('dailyBudget', b)}
            className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${
              parseInt(data.dailyBudget) === b
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-300'
            }`}
          >
            ₨{b}
          </button>
        ))}
      </div>

      {/* Custom input */}
      <div>
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
          Or enter a custom amount:
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₨</span>
          <input
            type="number"
            min="100"
            max="10000"
            value={data.dailyBudget}
            onChange={(e) => update('dailyBudget', parseInt(e.target.value) || '')}
            placeholder="Enter amount in PKR"
            className={`w-full border-2 rounded-xl pl-9 pr-4 py-3 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 ${
              errors.dailyBudget ? 'border-red-400' : 'border-slate-200 dark:border-slate-600'
            }`}
          />
        </div>
        {errors.dailyBudget && <p className="text-red-500 text-xs mt-1">{errors.dailyBudget}</p>}
      </div>

      <div className="mt-5 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl text-sm text-amber-700 dark:text-amber-400">
        <strong>💡 Tip:</strong> ₨300–500/day is a good range for balanced Pakistani meals. We'll always show real estimated prices.
      </div>
    </div>
  )

  // Step 7 (final): Summary + confirm
  const renderSummary = () => (
    <div>
      <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white mb-1">
        All Set! Review Your Profile
      </h2>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
        Your personalized meal plan will be based on these details
      </p>

      <div className="space-y-3">
        {[
          { label: 'Goal', value: PRIMARY_REASONS.find(r => r.value === data.primaryGoalReason)?.label || data.primaryGoalReason },
          { label: 'Health Condition', value: data.hasDisease ? '✅ Yes — disease-safe meals will be chosen' : '✅ No conditions' },
          ...(data.hasDisease ? [{
            label: 'Conditions', value: DISEASES.filter(d => data[d.key]).map(d => d.label).join(', ') || 'Not specified'
          }] : []),
          { label: 'Age / Gender', value: `${data.age} years · ${data.gender === 'male' ? '👨 Male' : '👩 Female'}` },
          { label: 'Weight / Height', value: `${data.weight} kg · ${data.height} cm` },
          { label: 'Activity Level', value: ACTIVITY_LEVELS.find(a => a.value === data.activityLevel)?.label || data.activityLevel },
          { label: 'Fitness Goal', value: GOALS.find(g => g.value === data.goal)?.label || data.goal },
          { label: 'Allergies', value: data.allergies.length ? data.allergies.join(', ') : 'None' },
          { label: 'Daily Budget', value: `₨${data.dailyBudget}/day` },
        ].map((row) => (
          <div
            key={row.label}
            className="flex items-start justify-between py-2.5 border-b border-slate-100 dark:border-slate-700 last:border-0 gap-4"
          >
            <span className="text-sm text-slate-500 dark:text-slate-400 flex-shrink-0">{row.label}</span>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 text-right capitalize">{row.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl text-sm text-emerald-700 dark:text-emerald-400">
        🎉 After setup, go to <strong>Meal Plan</strong> to generate your first AI-powered 7-day Pakistani diet plan!
      </div>
    </div>
  )

  const STEPS = [
    renderStep0,
    renderStep1,
    renderStep2,
    renderStep3,
    renderStep4,
    renderStep5,
    renderStep6,
  ]

  // Actual step count (since step 2 can be skipped)
  const effectiveStep = step
  const isLastStep = effectiveStep === STEPS.length - 1

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-emerald-600 to-teal-700 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 rounded-t-3xl px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 z-10">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-black">D</span>
              </div>
              <span className="font-display font-bold text-emerald-600 text-sm">DIETORA Setup</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Step {effectiveStep + 1} of {STEPS.length}
            </span>
          </div>
          <StepBar current={effectiveStep} total={STEPS.length} />
        </div>

        {/* Step content */}
        <div className="px-6 py-5">
          {STEPS[effectiveStep]?.()}
        </div>

        {/* Navigation */}
        <div className="sticky bottom-0 bg-white dark:bg-slate-900 rounded-b-3xl px-6 pb-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex gap-3">
            {effectiveStep > 0 && (
              <button
                type="button"
                onClick={back}
                className="flex-1 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold text-sm hover:border-slate-300 transition-all"
              >
                ← Back
              </button>
            )}
            {isLastStep ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Setting up your profile...
                  </>
                ) : '🚀 Complete Setup & Start'}
              </button>
            ) : (
              <button
                type="button"
                onClick={next}
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
