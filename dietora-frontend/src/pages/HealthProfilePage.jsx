// src/pages/HealthProfilePage.jsx
import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProfile, saveProfile } from '../store/slices/profileSlice'
import { useUrdu } from '../context/UrduContext'
import toast from 'react-hot-toast'
import { Droplets, Heart, Activity, Pill, Fingerprint, Armchair, PersonStanding, Dumbbell, Zap, TrendingDown, Scale, TrendingUp, User, Target, Stethoscope, AlertTriangle, Coins, Bot, Loader2, Save, Rocket, ActivitySquare, Check, BarChart3, Wind, Beaker, Weight } from 'lucide-react'

const DISEASES = [
  { key: 'isDiabetic',       labelKey: 'profile.diabetes',      icon: Droplets,      color: 'blue',   descEn: 'Type 2 Diabetes — low-GI, high-fiber foods prioritised',                    descUr: 'ذیابطیس — کم گلیسیمک، زیادہ فائبر خوراک' },
  { key: 'isHypertensive',   labelKey: 'profile.hypertension',  icon: Heart,         color: 'red',    descEn: 'High Blood Pressure — low-sodium meals selected',                           descUr: 'ہائی بلڈ پریشر — کم نمک کھانا' },
  { key: 'isCardiac',        labelKey: 'profile.cardiac',       icon: Activity,      color: 'purple', descEn: 'Heart Disease — low-fat, low-cholesterol meals',                            descUr: 'دل کی بیماری — کم چکنائی والا کھانا' },
  { key: 'hasKidneyDisease', labelKey: 'profile.kidney',        icon: Pill,          color: 'amber',  descEn: 'CKD — low potassium, low phosphorus, controlled protein',                   descUr: 'گردے کی بیماری — کم پوٹاشیم، کنٹرولڈ پروٹین' },
  { key: 'hasThyroid',       labelKey: 'profile.thyroid',       icon: Fingerprint,   color: 'teal',   descEn: 'Thyroid — avoids goitrogens, iodine-safe foods',                            descUr: 'تھائرائیڈ — محفوظ غذائی انتخاب' },
  { key: 'hasConstipation',  labelKey: 'profile.constipation',  icon: Wind,          color: 'green',  descEn: 'Digestive issues — high-fiber, gut-friendly foods prioritised',              descUr: 'قبض — زیادہ فائبر، ہضم دوست خوراک' },
  { key: 'hasAnemia',        labelKey: 'profile.anemia',        icon: Beaker,        color: 'rose',   descEn: 'Iron deficiency — iron-rich foods + Vitamin C for absorption',              descUr: 'خون کی کمی — آئرن سے بھرپور خوراک' },
  { key: 'hasObesity',       labelKey: 'profile.obesity',       icon: Scale,         color: 'orange', descEn: 'Weight management — low-calorie, high-satiety, high-fiber meals',            descUr: 'موٹاپا — کم کیلوری، زیادہ پیٹ بھرنے والی خوراک' },
]
const ALLERGIES = ['nuts', 'dairy', 'gluten', 'shellfish', 'eggs', 'soy']
const ACTIVITY_LEVELS = [
  { value: 'sedentary',         labelEn: 'Sedentary',         labelUr: 'غیر فعال',       descEn: 'Little/no exercise',       descUr: 'کم یا کوئی ورزش نہیں',    icon: Armchair },
  { value: 'lightly_active',    labelEn: 'Lightly Active',    labelUr: 'ہلکا فعال',      descEn: '1-3 days/week',            descUr: 'ہفتے میں ۱-۳ دن',         icon: PersonStanding },
  { value: 'moderately_active', labelEn: 'Moderately Active', labelUr: 'معتدل فعال',     descEn: '3-5 days/week',            descUr: 'ہفتے میں ۳-۵ دن',         icon: ActivitySquare },
  { value: 'very_active',       labelEn: 'Very Active',       labelUr: 'بہت فعال',       descEn: '6-7 days/week',            descUr: 'ہفتے میں ۶-۷ دن',         icon: Dumbbell },
  { value: 'extra_active',      labelEn: 'Extra Active',      labelUr: 'انتہائی فعال',   descEn: 'Physical job + training',  descUr: 'جسمانی کام + تربیت',      icon: Zap },
]
const GOALS = [
  { value: 'weight_loss',  labelEn: 'Lose Weight',     labelUr: 'وزن کم کریں',    icon: TrendingDown, descEn: '500 kcal deficit/day', descUr: '۵۰۰ کیلوری کمی' },
  { value: 'maintenance',  labelEn: 'Maintain Weight', labelUr: 'وزن برقرار رکھیں', icon: Scale,       descEn: 'Eat at TDEE',          descUr: 'TDEE کے مطابق کھانا' },
  { value: 'weight_gain',  labelEn: 'Gain Weight',     labelUr: 'وزن بڑھائیں',    icon: TrendingUp,   descEn: '500 kcal surplus/day', descUr: '۵۰۰ کیلوری اضافہ' },
]

const DISEASE_COLORS = {
  blue:   { active: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600',       hover: 'hover:border-blue-300',   badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600' },
  red:    { active: 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600',            hover: 'hover:border-red-300',    badge: 'bg-red-100 dark:bg-red-900/40 text-red-600' },
  purple: { active: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600', hover: 'hover:border-purple-300', badge: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600' },
  amber:  { active: 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700',    hover: 'hover:border-amber-300',  badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700' },
  teal:   { active: 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700',        hover: 'hover:border-teal-300',   badge: 'bg-teal-100 dark:bg-teal-900/40 text-teal-700' },
  green:  { active: 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700',    hover: 'hover:border-green-300',  badge: 'bg-green-100 dark:bg-green-900/40 text-green-700' },
  rose:   { active: 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-700',        hover: 'hover:border-rose-300',   badge: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700' },
  orange: { active: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700', hover: 'hover:border-orange-300', badge: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700' },
}

function BmiMeter({ bmi, isUrdu }) {
  if (!bmi) return null
  const clampedBmi = Math.min(Math.max(bmi, 10), 45)
  const pct = ((clampedBmi - 10) / 35) * 100
  const getColor = () => {
    if (bmi < 18.5) return '#3b82f6'
    if (bmi < 25)   return '#10b981'
    if (bmi < 30)   return '#f59e0b'
    return '#ef4444'
  }
  const getLabel = () => {
    if (isUrdu) {
      if (bmi < 18.5) return 'کم وزن'
      if (bmi < 25)   return 'نارمل وزن'
      if (bmi < 30)   return 'زیادہ وزن'
      return 'موٹاپا'
    }
    if (bmi < 18.5) return 'Underweight'
    if (bmi < 25)   return 'Normal Weight'
    if (bmi < 30)   return 'Overweight'
    return 'Obese'
  }
  return (
    <div className="mt-5 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          BMI: <span style={{ color: getColor() }} className="font-bold text-base">{bmi.toFixed(1)}</span>
        </span>
        <span className="text-sm font-bold" style={{ color: getColor() }}>{getLabel()}</span>
      </div>
      <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: getColor() }} />
      </div>
    </div>
  )
}

export default function HealthProfilePage() {
  const dispatch = useDispatch()
  const { data: profile, loading, saving } = useSelector((s) => s.profile)
  const { t, isUrdu } = useUrdu()

  const ur = (en, ur) => isUrdu ? ur : en

  const defaultForm = {
    age: '', weight: '', height: '', gender: 'male',
    activityLevel: 'moderately_active', goal: 'maintenance',
    isDiabetic: false, isHypertensive: false, isCardiac: false,
    hasKidneyDisease: false, hasThyroid: false,
    hasConstipation: false, hasAnemia: false, hasObesity: false,
    allergies: [], dailyBudget: '', diseaseDescription: '',
  }

  const [form, setForm] = useState(defaultForm)
  const [bmi, setBmi]   = useState(null)

  useEffect(() => { dispatch(fetchProfile()) }, [dispatch])

  useEffect(() => {
    if (profile) {
      setForm({
        age:              profile.age              || '',
        weight:           profile.weight           || '',
        height:           profile.height           || '',
        gender:           profile.gender           || 'male',
        activityLevel:    profile.activityLevel    || 'moderately_active',
        goal:             profile.goal             || 'maintenance',
        isDiabetic:       profile.isDiabetic       || false,
        isHypertensive:   profile.isHypertensive   || false,
        isCardiac:        profile.isCardiac         || false,
        hasKidneyDisease: profile.hasKidneyDisease  || false,
        hasThyroid:       profile.hasThyroid        || false,
        hasConstipation:  profile.hasConstipation   || false,
        hasAnemia:        profile.hasAnemia         || false,
        hasObesity:       profile.hasObesity        || false,
        allergies:        profile.allergies         || [],
        dailyBudget:      profile.dailyBudget       || '',
        diseaseDescription: profile.diseaseDescription || '',
      })
      setBmi(profile.bmi || null)
    }
  }, [profile])

  useEffect(() => {
    const w = parseFloat(form.weight)
    const h = parseFloat(form.height)
    if (w > 0 && h > 0) {
      const hm = h / 100
      setBmi(parseFloat((w / (hm * hm)).toFixed(1)))
    } else {
      setBmi(null)
    }
  }, [form.weight, form.height])

  const toggleAllergy = (a) =>
    setForm((prev) => ({
      ...prev,
      allergies: prev.allergies.includes(a)
        ? prev.allergies.filter((x) => x !== a)
        : [...prev.allergies, a],
    }))

  const toggleDisease = (key) =>
    setForm((prev) => ({ ...prev, [key]: !prev[key] }))

  const anyDisease = form.isDiabetic || form.isHypertensive || form.isCardiac ||
    form.hasKidneyDisease || form.hasThyroid || form.hasConstipation ||
    form.hasAnemia || form.hasObesity

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.age || !form.weight || !form.height) {
      toast.error(ur('Please fill in age, weight, and height', 'عمر، وزن اور قد درج کریں'))
      return
    }
    if (!form.dailyBudget || parseInt(form.dailyBudget) < 100) {
      toast.error(ur('Daily budget must be at least ₨100', 'روزانہ بجٹ کم از کم ₨100 ہونا چاہیے'))
      return
    }
    dispatch(saveProfile({
      age: parseInt(form.age), weight: parseFloat(form.weight),
      height: parseFloat(form.height), gender: form.gender,
      activityLevel: form.activityLevel, goal: form.goal,
      isDiabetic: form.isDiabetic, isHypertensive: form.isHypertensive,
      isCardiac: form.isCardiac, hasKidneyDisease: form.hasKidneyDisease,
      hasThyroid: form.hasThyroid, hasConstipation: form.hasConstipation,
      hasAnemia: form.hasAnemia, hasObesity: form.hasObesity,
      allergies: form.allergies, dailyBudget: parseInt(form.dailyBudget),
      diseaseDescription: form.diseaseDescription, hasDisease: anyDisease,
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">{ur('Loading your profile...', 'پروفائل لوڈ ہو رہی ہے...')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-8" style={isUrdu ? { fontFamily: "'Noto Nastaliq Urdu', serif" } : {}}>
      <div className="page-header">
        <h1 className="page-title">{t('profile.title')}</h1>
        <p className="page-subtitle">
          {profile
            ? ur('Update your health info — BMI, BMR & TDEE recalculate automatically', 'اپنی صحت کی معلومات اپ ڈیٹ کریں — BMI، BMR اور TDEE خود بخود دوبارہ حساب ہوگا')
            : ur('Set up your profile to get personalized AI meal plans', 'ذاتی AI کھانے کے منصوبے حاصل کرنے کے لیے پروفائل ترتیب دیں')}
        </p>
      </div>

      {/* AI notice */}
      <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl flex items-start gap-3">
        <Bot className="w-6 h-6 flex-shrink-0 text-emerald-600 mt-0.5" />
        <div className="text-sm text-emerald-700 dark:text-emerald-400">
          <strong>{ur('Two-Phase AI Analysis:', 'دو مرحلہ AI تجزیہ:')}</strong>{' '}
          {ur(
            'When you generate a meal plan, AI first performs a clinical health analysis of your profile, then selects each meal individually based on your medical conditions.',
            'جب آپ کھانے کا منصوبہ بناتے ہیں تو AI پہلے آپ کی صحت کا طبی تجزیہ کرتا ہے، پھر آپ کی طبی حالت کی بنیاد پر ہر کھانا منتخب کرتا ہے۔'
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Basic Info ─────────────────────────────── */}
        <div className="card">
          <h2 className="font-display font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2 text-base">
            <span className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg flex items-center justify-center text-emerald-600">
              <User className="w-4 h-4" />
            </span>
            {ur('Basic Information', 'بنیادی معلومات')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">{t('profile.age')}</label>
              <input type="number" min="5" max="120" value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                placeholder={ur('e.g. 30', 'مثلاً ۳۰')} className="input-field" required />
            </div>
            <div>
              <label className="label">{t('profile.gender')}</label>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="input-field">
                <option value="male">{t('profile.male')}</option>
                <option value="female">{t('profile.female')}</option>
              </select>
            </div>
            <div>
              <label className="label">{t('profile.weight')}</label>
              <input type="number" min="10" max="300" step="0.1" value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                placeholder={ur('e.g. 70', 'مثلاً ۷۰')} className="input-field" required />
            </div>
            <div>
              <label className="label">{t('profile.height')}</label>
              <input type="number" min="50" max="250" value={form.height}
                onChange={(e) => setForm({ ...form, height: e.target.value })}
                placeholder={ur('e.g. 170', 'مثلاً ۱۷۰')} className="input-field" required />
            </div>
          </div>
          <BmiMeter bmi={bmi} isUrdu={isUrdu} />
        </div>

        {/* ── Goal ───────────────────────────────────── */}
        <div className="card">
          <h2 className="font-display font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 text-base">
            <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center text-purple-600">
              <Target className="w-4 h-4" />
            </span>
            {t('profile.goal')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {GOALS.map((g) => {
              const GoalIcon = g.icon
              return (
                <button key={g.value} type="button" onClick={() => setForm({ ...form, goal: g.value })}
                  className={`p-4 rounded-xl border-2 text-left transition-all duration-150 ${
                    form.goal === g.value
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-slate-200 dark:border-slate-600 hover:border-emerald-300'
                  }`}>
                  <GoalIcon className="w-6 h-6 mb-2 text-slate-700 dark:text-slate-200" />
                  <p className="font-semibold text-sm text-slate-800 dark:text-white">{isUrdu ? g.labelUr : g.labelEn}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{isUrdu ? g.descUr : g.descEn}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Activity Level ─────────────────────────── */}
        <div className="card">
          <h2 className="font-display font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 text-base">
            <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center text-blue-600">
              <Activity className="w-4 h-4" />
            </span>
            {ur('Activity Level', 'سرگرمی کی سطح')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ACTIVITY_LEVELS.map((level) => {
              const LevelIcon = level.icon
              return (
                <button key={level.value} type="button" onClick={() => setForm({ ...form, activityLevel: level.value })}
                  className={`p-3 rounded-xl border-2 text-left transition-all duration-150 ${
                    form.activityLevel === level.value
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-slate-200 dark:border-slate-600 hover:border-emerald-300'
                  }`}>
                  <LevelIcon className="w-5 h-5 mb-1.5 text-slate-700 dark:text-slate-200" />
                  <p className="font-semibold text-sm text-slate-800 dark:text-white">{isUrdu ? level.labelUr : level.labelEn}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{isUrdu ? level.descUr : level.descEn}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Medical Conditions ─────────────────────── */}
        <div className="card">
          <h2 className="font-display font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2 text-base">
            <span className="w-8 h-8 bg-red-100 dark:bg-red-900/40 rounded-lg flex items-center justify-center text-red-600">
              <Stethoscope className="w-4 h-4" />
            </span>
            {t('profile.conditions')}
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            {ur(
              'The AI performs a clinical analysis of each condition and selects only medically safe foods.',
              'AI ہر بیماری کا طبی تجزیہ کرتا ہے اور صرف طبی لحاظ سے محفوظ کھانا منتخب کرتا ہے۔'
            )}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DISEASES.map((d) => {
              const colors   = DISEASE_COLORS[d.color]
              const isOn     = form[d.key]
              const DiseaseIcon = d.icon
              return (
                <button key={d.key} type="button" onClick={() => toggleDisease(d.key)}
                  className={`p-4 rounded-xl border-2 text-left transition-all duration-150 ${
                    isOn ? colors.active : `border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 ${colors.hover}`
                  }`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <DiseaseIcon className={`w-5 h-5 ${isOn ? '' : 'opacity-60'}`} />
                      <span className="font-semibold text-sm">{t(d.labelKey)}</span>
                    </div>
                    {isOn && <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${colors.badge}`}>{ur('ON', 'فعال')}</span>}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">{isUrdu ? d.descUr : d.descEn}</p>
                </button>
              )
            })}
          </div>

          {anyDisease && (
            <div className="mt-4">
              <label className="label">
                {ur('Describe your condition in your own words', 'اپنی بیماری اپنے الفاظ میں بیان کریں')}
                <span className="font-normal text-slate-400 ml-1">({ur('optional but improves AI analysis', 'اختیاری لیکن AI تجزیہ بہتر کرتا ہے')})</span>
              </label>
              <textarea
                value={form.diseaseDescription}
                onChange={(e) => setForm({ ...form, diseaseDescription: e.target.value })}
                placeholder={ur(
                  'e.g. I have been diabetic for 5 years. My blood sugar is usually around 180-200 mg/dL...',
                  'مثلاً: مجھے ۵ سال سے ذیابطیس ہے، میرا بلڈ شوگر عام طور پر ۱۸۰-۲۰۰ ہوتا ہے...'
                )}
                rows={3}
                className="w-full border-2 border-slate-200 dark:border-slate-600 rounded-xl p-3 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 resize-none mt-1"
              />
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5" />
                {ur('This description is sent directly to the AI clinical analysis', 'یہ بیان براہ راست AI طبی تجزیہ کو بھیجا جاتا ہے')}
              </p>
            </div>
          )}
        </div>

        {/* ── Allergies ──────────────────────────────── */}
        <div className="card">
          <h2 className="font-display font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2 text-base">
            <span className="w-8 h-8 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </span>
            {t('profile.allergies')}
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            {ur('All allergens are strictly excluded from every meal slot', 'تمام الرجی پیدا کرنے والی اشیاء ہر کھانے سے سختی سے خارج کی جاتی ہیں')}
          </p>
          <div className="flex gap-2 flex-wrap">
            {ALLERGIES.map((a) => (
              <button key={a} type="button" onClick={() => toggleAllergy(a)}
                className={`px-4 py-2 rounded-full border-2 text-sm capitalize font-medium transition-all duration-150 flex items-center gap-1.5 ${
                  form.allergies.includes(a)
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                    : 'border-slate-200 dark:border-slate-600 text-slate-500 hover:border-amber-300'
                }`}>
                {form.allergies.includes(a) && <Check className="w-3.5 h-3.5" />}{a}
              </button>
            ))}
          </div>
        </div>

        {/* ── Budget ─────────────────────────────────── */}
        <div className="card">
          <h2 className="font-display font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 text-base">
            <span className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg flex items-center justify-center text-emerald-600">
              <Coins className="w-4 h-4" />
            </span>
            {t('profile.budget')}
          </h2>
          <div className="max-w-xs">
            <label className="label">{ur('Maximum daily budget in Pakistani Rupees', 'پاکستانی روپوں میں زیادہ سے زیادہ روزانہ بجٹ')}</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₨</span>
              <input type="number" min="100" max="10000" value={form.dailyBudget}
                onChange={(e) => setForm({ ...form, dailyBudget: e.target.value })}
                placeholder={ur('e.g. 500', 'مثلاً ۵۰۰')} className="input-field pl-8" required />
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {[200, 350, 500, 750, 1000].map((b) => (
                <button key={b} type="button" onClick={() => setForm({ ...form, dailyBudget: b })}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    parseInt(form.dailyBudget) === b
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'border-slate-200 dark:border-slate-600 text-slate-500 hover:border-amber-400'
                  }`}>
                  ₨{b}/{ur('day', 'روز')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Calculated Values Preview ─────────────── */}
        {profile?.tdee && (
          <div className="card bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-100 dark:border-emerald-800">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4" /> {ur('Current Calculated Values', 'موجودہ حسابی اقدار')}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'BMI',    value: profile.bmi?.toFixed(1) || '—' },
                { label: 'BMR',    value: `${Math.round(profile.bmr) || '—'} kcal` },
                { label: 'TDEE',   value: `${Math.round(profile.tdee) || '—'} kcal` },
                { label: ur('Target', 'ہدف'), value: `${Math.round(profile.dailyCalorieTarget) || '—'} kcal` },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className="font-bold text-emerald-600 text-lg">{item.value}</p>
                  <p className="text-xs text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <button type="submit" disabled={saving}
          className="btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-2">
          {saving ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> {ur('Saving Profile...', 'پروفائل محفوظ ہو رہی ہے...')}</>
          ) : (
            profile
              ? <><Save className="w-5 h-5" /> {ur('Update Health Profile', 'صحت پروفائل اپ ڈیٹ کریں')}</>
              : <><Rocket className="w-5 h-5" /> {ur('Create Health Profile', 'صحت پروفائل بنائیں')}</>
          )}
        </button>
      </form>
    </div>
  )
}
