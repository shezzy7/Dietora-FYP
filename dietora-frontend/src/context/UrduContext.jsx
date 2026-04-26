// src/context/UrduContext.jsx
// Bilingual support (English / Urdu) — added per NutriGuide Pakistan proposal
// which specifies "Urdu-friendly" and "bilingual interface" as core requirements.
//
// Architecture:
//   - UrduProvider wraps the whole app (added in main.jsx or App.jsx)
//   - useUrdu() hook gives any component access to { isUrdu, toggleUrdu, t }
//   - t(key) looks up a translation string; falls back to the key itself
//   - UrduToggleButton is a floating button shown site-wide when logged in
//
// Usage in any component:
//   import { useUrdu } from '../context/UrduContext'
//   const { t, isUrdu } = useUrdu()
//   <h1>{t('dashboard.title')}</h1>

import { createContext, useContext, useState, useCallback } from 'react'

// ── Translation dictionary ─────────────────────────────────
// English is the default; Urdu strings are provided here.
// Add more keys as needed — any missing key falls back to English.
const TRANSLATIONS = {
  // ── Navigation labels ──────────────────────────────────
  'nav.dashboard':     { en: 'Dashboard',       ur: 'ڈیش بورڈ' },
  'nav.mealPlan':      { en: 'Meal Planner',    ur: 'کھانے کا منصوبہ' },
  'nav.grocery':       { en: 'Grocery List',    ur: 'گروسری فہرست' },
  'nav.budget':        { en: 'Budget',          ur: 'بجٹ' },
  'nav.progress':      { en: 'Progress',        ur: 'پیش رفت' },
  'nav.education':     { en: 'Education',       ur: 'تعلیم' },
  'nav.feedback':      { en: 'Feedback',        ur: 'رائے' },
  'nav.profile':       { en: 'Health Profile',  ur: 'صحت پروفائل' },
  'nav.stores':        { en: 'Store Finder',    ur: 'دکان تلاش' },
  'nav.settings':      { en: 'Settings',        ur: 'ترتیبات' },

  // ── Dashboard ─────────────────────────────────────────
  'dashboard.title':        { en: 'Dashboard',             ur: 'ڈیش بورڈ' },
  'dashboard.greeting.morning': { en: 'Good morning',      ur: 'صبح بخیر' },
  'dashboard.greeting.afternoon': { en: 'Good afternoon',  ur: 'دوپہر بخیر' },
  'dashboard.greeting.evening': { en: 'Good evening',      ur: 'شام بخیر' },
  'dashboard.bmi':          { en: 'BMI',                   ur: 'بی ایم آئی' },
  'dashboard.calories':     { en: 'Daily Calories',        ur: 'روزانہ کیلوریز' },
  'dashboard.mealPlans':    { en: 'Meal Plans',            ur: 'کھانے کے منصوبے' },
  'dashboard.budget':       { en: 'Daily Budget',          ur: 'روزانہ بجٹ' },

  // ── Meal Planner ──────────────────────────────────────
  'meal.generate':      { en: 'Generate New Plan',     ur: 'نیا منصوبہ بنائیں' },
  'meal.breakfast':     { en: 'Breakfast',             ur: 'ناشتہ' },
  'meal.lunch':         { en: 'Lunch',                 ur: 'دوپہر کا کھانا' },
  'meal.dinner':        { en: 'Dinner',                ur: 'رات کا کھانا' },
  'meal.snack':         { en: 'Snack',                 ur: 'اسنیک' },
  'meal.calories':      { en: 'Calories',              ur: 'کیلوریز' },
  'meal.protein':       { en: 'Protein',               ur: 'پروٹین' },
  'meal.carbs':         { en: 'Carbs',                 ur: 'کاربس' },
  'meal.fat':           { en: 'Fat',                   ur: 'چکنائی' },
  'meal.price':         { en: 'Price',                 ur: 'قیمت' },
  'meal.recipe':        { en: 'Recipe',                ur: 'ترکیب' },
  'meal.markDone':      { en: 'Mark as Done',          ur: 'مکمل کریں' },
  'meal.swap':          { en: 'Swap',                  ur: 'تبدیل کریں' },

  // ── Health Profile ────────────────────────────────────
  'profile.title':      { en: 'Health Profile',        ur: 'صحت پروفائل' },
  'profile.age':        { en: 'Age (years)',            ur: 'عمر (سال)' },
  'profile.gender':     { en: 'Gender',                ur: 'جنس' },
  'profile.male':       { en: 'Male',                  ur: 'مرد' },
  'profile.female':     { en: 'Female',                ur: 'عورت' },
  'profile.weight':     { en: 'Weight (kg)',           ur: 'وزن (کلوگرام)' },
  'profile.height':     { en: 'Height (cm)',           ur: 'قد (سینٹی میٹر)' },
  'profile.goal':       { en: 'Your Goal',             ur: 'آپ کا ہدف' },
  'profile.conditions': { en: 'Medical Conditions',    ur: 'طبی حالات' },
  'profile.allergies':  { en: 'Food Allergies',        ur: 'غذائی الرجی' },
  'profile.budget':     { en: 'Daily Budget (PKR)',    ur: 'روزانہ بجٹ (روپے)' },
  'profile.save':       { en: 'Save Profile',          ur: 'پروفائل محفوظ کریں' },
  'profile.diabetes':   { en: 'Diabetes',              ur: 'ذیابطیس' },
  'profile.hypertension': { en: 'Hypertension',        ur: 'ہائی بلڈ پریشر' },
  'profile.cardiac':    { en: 'Cardiac Disease',       ur: 'دل کی بیماری' },
  'profile.kidney':     { en: 'Kidney Disease',        ur: 'گردے کی بیماری' },
  'profile.thyroid':    { en: 'Thyroid Condition',     ur: 'تھائرائیڈ' },
  'profile.constipation': { en: 'Constipation',        ur: 'قبض' },
  'profile.anemia':     { en: 'Anemia',                ur: 'خون کی کمی' },
  'profile.obesity':    { en: 'Obesity',               ur: 'موٹاپا' },

  // ── Grocery List ──────────────────────────────────────
  'grocery.title':      { en: 'Grocery List',          ur: 'گروسری فہرست' },
  'grocery.purchased':  { en: 'Purchased',             ur: 'خریدا گیا' },
  'grocery.total':      { en: 'Total',                 ur: 'کل' },

  // ── Budget ────────────────────────────────────────────
  'budget.title':       { en: 'Budget Optimizer',      ur: 'بجٹ آپٹیمائزر' },
  'budget.weekly':      { en: 'Weekly Budget',         ur: 'ہفتہ وار بجٹ' },
  'budget.spent':       { en: 'Plan Cost',             ur: 'منصوبے کی لاگت' },
  'budget.optimize':    { en: 'Optimize Budget',       ur: 'بجٹ بہتر بنائیں' },

  // ── Progress ──────────────────────────────────────────
  'progress.title':     { en: 'My Progress',           ur: 'میری پیش رفت' },
  'progress.adherence': { en: 'Budget Adherence',      ur: 'بجٹ پابندی' },

  // ── Education ─────────────────────────────────────────
  'education.title':    { en: 'Educational Hub',       ur: 'تعلیمی مرکز' },
  'education.search':   { en: 'Search articles...',    ur: 'مضامین تلاش کریں...' },

  // ── General ───────────────────────────────────────────
  'general.loading':    { en: 'Loading...',            ur: 'لوڈ ہو رہا ہے...' },
  'general.save':       { en: 'Save',                  ur: 'محفوظ کریں' },
  'general.cancel':     { en: 'Cancel',                ur: 'منسوخ کریں' },
  'general.submit':     { en: 'Submit',                ur: 'جمع کریں' },
  'general.per_day':    { en: 'per day',               ur: 'روزانہ' },
  'general.week':       { en: 'Week',                  ur: 'ہفتہ' },
  'general.day':        { en: 'Day',                   ur: 'دن' },
  'general.kcal':       { en: 'kcal',                  ur: 'کیلوری' },

  // ── Landing page ──────────────────────────────────────
  'landing.hero':       { en: 'AI-Powered Pakistani Diet Planner', ur: 'اے آئی سے چلنے والا پاکستانی غذائی منصوبہ ساز' },
  'landing.subtitle':   { en: 'Personalized meal plans for diabetes, hypertension & cardiac conditions — with real PKR prices', ur: 'ذیابطیس، ہائی بلڈ پریشر اور دل کی بیماری کے لیے ذاتی کھانے کے منصوبے — اصل پاکستانی قیمتوں کے ساتھ' },
  'landing.cta':        { en: 'Get Started Free',      ur: 'مفت شروع کریں' },
}

// ── Context ───────────────────────────────────────────────
const UrduContext = createContext({
  isUrdu: false,
  toggleUrdu: () => {},
  t: (key) => key,
})

export function UrduProvider({ children }) {
  const [isUrdu, setIsUrdu] = useState(() => {
    try { return localStorage.getItem('dietora_lang') === 'ur' } catch { return false }
  })

  const toggleUrdu = useCallback(() => {
    setIsUrdu((prev) => {
      const next = !prev
      try { localStorage.setItem('dietora_lang', next ? 'ur' : 'en') } catch {}
      return next
    })
  }, [])

  // t(key) — returns the string in current language; falls back to English then the key
  const t = useCallback((key) => {
    const entry = TRANSLATIONS[key]
    if (!entry) return key
    return isUrdu ? (entry.ur || entry.en || key) : (entry.en || key)
  }, [isUrdu])

  return (
    <UrduContext.Provider value={{ isUrdu, toggleUrdu, t }}>
      {/* Apply Urdu font direction when Urdu is active */}
      <div dir={isUrdu ? 'rtl' : 'ltr'} lang={isUrdu ? 'ur' : 'en'} style={{ fontFamily: isUrdu ? "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif" : undefined }}>
        {children}
      </div>
    </UrduContext.Provider>
  )
}

export function useUrdu() {
  return useContext(UrduContext)
}

// ── Floating language toggle button ──────────────────────
// Rendered globally alongside ChatbotWidget
export function UrduToggleButton() {
  const { isUrdu, toggleUrdu } = useUrdu()

  return (
    <button
      onClick={toggleUrdu}
      title={isUrdu ? 'Switch to English' : 'اردو میں تبدیل کریں'}
      className="fixed bottom-6 right-24 z-50 w-14 h-14 bg-gradient-to-br from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white rounded-full shadow-lg shadow-emerald-700/30 flex flex-col items-center justify-center gap-0 transition-all duration-200 hover:scale-110 active:scale-95 select-none"
      aria-label="Toggle Urdu language"
    >
      <span className="text-[11px] font-bold leading-tight">{isUrdu ? 'EN' : 'اردو'}</span>
      <span className="text-[9px] opacity-70 leading-tight">{isUrdu ? 'English' : 'Urdu'}</span>
    </button>
  )
}
