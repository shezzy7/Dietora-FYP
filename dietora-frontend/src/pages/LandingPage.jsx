import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useUrdu } from '../context/UrduContext'
import axios from 'axios'
import {
  Bot, Banknote, Salad, ShoppingCart, BarChart3, BookOpen,
  Star, Check, Target, MessageSquare, Droplets, Heart, Activity
} from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`w-4 h-4 ${i <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
      ))}
    </div>
  )
}

function ReviewCard({ review }) {
  const name = review.user?.name || 'DIETORA User'
  const initial = name.charAt(0).toUpperCase()
  const timeAgo = getTimeAgo(review.createdAt)
  return (
    <div className="card group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <StarRating rating={review.rating} />
        <span className="text-xs text-slate-400">{timeAgo}</span>
      </div>
      <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4 italic">"{review.comment}"</p>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
          {initial}
        </div>
        <div>
          <p className="font-semibold text-slate-800 dark:text-white text-sm">{name}</p>
          {review.category && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{review.category}</p>}
        </div>
      </div>
    </div>
  )
}

function getTimeAgo(dateStr) {
  const now = new Date(), date = new Date(dateStr)
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000), diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000), diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffWeeks < 5) return `${diffWeeks}w ago`
  return `${diffMonths}mo ago`
}

export default function LandingPage() {
  const { user } = useSelector((s) => s.auth)
  const { isUrdu } = useUrdu()
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(true)

  const ur = (en, ur) => isUrdu ? ur : en

  useEffect(() => {
    axios.get(`${API_BASE}/feedback/public`)
      .then((res) => setReviews(res.data?.data || []))
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false))
  }, [])

  const features = [
    { icon: Bot,          titleEn: 'AI Meal Planning',      titleUr: 'AI کھانے کی منصوبہ بندی',    descEn: 'Get personalized 7-day meal plans based on your health conditions, allergies, and budget — tailored for Pakistani foods.', descUr: 'اپنی صحت، الرجی اور بجٹ کی بنیاد پر ذاتی ۷ روزہ کھانے کا منصوبہ حاصل کریں۔' },
    { icon: Banknote,     titleEn: 'Budget Optimizer',      titleUr: 'بجٹ آپٹیمائزر',              descEn: 'Eat healthy within your budget. Our AI optimizes meals using local Faisalabad market prices in PKR.', descUr: 'اپنے بجٹ میں صحت مند کھائیں۔ فیصل آباد کی مقامی مارکیٹ قیمتوں کا استعمال کرتا ہے۔' },
    { icon: Salad,        titleEn: 'Disease-Aware Diets',   titleUr: 'بیماری سے آگاہ خوراک',      descEn: 'Safe meal plans for diabetes, hypertension, and cardiac conditions — medically filtered food suggestions.', descUr: 'ذیابطیس، ہائی بلڈ پریشر اور دل کی بیماری کے لیے محفوظ کھانے کے منصوبے۔' },
    { icon: ShoppingCart, titleEn: 'Smart Grocery Lists',   titleUr: 'ذہین گروسری فہرستیں',       descEn: 'Auto-generated grocery lists from your meal plan. Mark items as purchased, track spending.', descUr: 'کھانے کے منصوبے سے خودکار گروسری فہرست۔ خریدی گئی اشیاء نشان زد کریں۔' },
    { icon: BarChart3,    titleEn: 'Progress Tracking',     titleUr: 'پیش رفت کا ٹریکنگ',         descEn: 'Visual charts for calories consumed, budget adherence, and weekly nutrition breakdown.', descUr: 'کیلوریز، بجٹ اور ہفتہ وار غذائیت کے بصری چارٹس۔' },
    { icon: BookOpen,     titleEn: 'Educational Hub',       titleUr: 'تعلیمی مرکز',               descEn: 'Learn about nutrition, disease management, and healthy Pakistani cooking through expert articles.', descUr: 'غذائیت، بیماری کے انتظام اور صحت مند پاکستانی کھانے کے بارے میں جانیں۔' },
  ]

  const stats = [
    { value: '30+', labelEn: 'Pakistani Foods',  labelUr: 'پاکستانی کھانے' },
    { value: '7-Day', labelEn: 'Meal Plans',     labelUr: 'کھانے کے منصوبے' },
    { value: '3',     labelEn: 'Disease Modes',  labelUr: 'بیماری موڈ' },
    { value: '100%',  labelEn: 'Budget Aware',   labelUr: 'بجٹ کے مطابق' },
  ]

  const diseaseModes = [
    {
      icon: Droplets, color: 'blue',
      titleEn: 'Diabetes', titleUr: 'ذیابطیس',
      descEn: 'Low-glycemic Pakistani foods, avoiding sugar-rich items. Focuses on whole grains, dal, and vegetables.',
      descUr: 'کم گلیسیمک پاکستانی کھانے، چینی سے بھرپور اشیاء سے پرہیز۔ سارا اناج، دال اور سبزیوں پر توجہ۔',
      foods: ['Karela', 'Methi', 'Masoor Dal', 'Whole Wheat Roti'],
    },
    {
      icon: Heart, color: 'red',
      titleEn: 'Hypertension', titleUr: 'ہائی بلڈ پریشر',
      descEn: 'Low-sodium meals, avoiding pickles and processed foods. Rich in potassium from fresh vegetables.',
      descUr: 'کم نمک کھانے، اچار اور پراسیسڈ فوڈز سے پرہیز۔ تازہ سبزیوں سے بھرپور پوٹاشیم۔',
      foods: ['Palak', 'Tomatoes', 'Garlic', 'Bananas'],
    },
    {
      icon: Activity, color: 'purple',
      titleEn: 'Cardiac Health', titleUr: 'دل کی صحت',
      descEn: 'Low saturated fat, high fiber meals. Avoids fried foods, favors grilled and steamed preparations.',
      descUr: 'کم سیچوریٹڈ چکنائی، زیادہ فائبر کھانے۔ تلی ہوئی اشیاء سے پرہیز، گرلڈ اور ابلے ہوئے کھانے۔',
      foods: ['Fish', 'Olive Oil', 'Oats', 'Nuts'],
    },
  ]

  return (
    <div className="overflow-hidden" style={isUrdu ? { fontFamily: "'Noto Nastaliq Urdu', serif" } : {}}>

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-slate-50 via-slate-100 to-emerald-50 dark:from-[#060A14] dark:via-[#0B1021] dark:to-[#0F172A]">
        <div className="absolute inset-0 bg-grid opacity-30 dark:opacity-20 pointer-events-none" />
        <div className="absolute top-20 right-10 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px] animate-pulse-slow pointer-events-none" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-teal-500/20 rounded-full blur-[100px] animate-pulse-slow pointer-events-none" style={{ animationDelay: '2s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse-slow" />
                {ur('AI-Powered Diet Planning', 'AI سے چلنے والی غذائی منصوبہ بندی')}
              </div>

              <h1 className="font-display text-5xl md:text-6xl font-bold text-slate-900 dark:text-white leading-tight">
                {ur('Eat Smart,', 'ذہانت سے کھائیں،')}
                <br />
                <span className="text-gradient">{ur('Stay Healthy', 'صحت مند رہیں')}</span>
                <br />
                <span className="text-4xl md:text-5xl">{ur('with Pakistani Foods', 'پاکستانی کھانوں کے ساتھ')}</span>
              </h1>

              <p className="mt-6 text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg">
                {ur(
                  'DIETORA generates personalized 7-day meal plans based on your health conditions, budget in PKR, and local Pakistani ingredients. Designed for Faisalabad families.',
                  'DIETORA آپ کی صحت، PKR میں بجٹ اور مقامی پاکستانی اجزاء کی بنیاد پر ذاتی ۷ روزہ کھانے کے منصوبے بناتا ہے۔ فیصل آباد کے خاندانوں کے لیے ڈیزائن کیا گیا۔'
                )}
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                {user ? (
                  <Link to="/dashboard" className="btn-primary text-center text-base py-3 px-8">
                    {ur('Go to Dashboard →', '← ڈیش بورڈ پر جائیں')}
                  </Link>
                ) : (
                  <>
                    <Link to="/register" className="btn-primary text-center text-base py-3 px-8">
                      {ur('Get Free Meal Plan →', '← مفت کھانے کا منصوبہ حاصل کریں')}
                    </Link>
                    <Link to="/login" className="btn-outline text-center text-base py-3 px-8">
                      {ur('Login', 'لاگ ان')}
                    </Link>
                  </>
                )}
              </div>

              <div className="mt-8 flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 flex-wrap">
                <span className="flex items-center gap-1.5"><Check className="w-4 h-4" /> {ur('Free to use', 'مفت استعمال')}</span>
                <span>·</span>
                <span className="flex items-center gap-1.5"><Check className="w-4 h-4" /> {ur('Medically filtered', 'طبی لحاظ سے فلٹر')}</span>
                <span>·</span>
                <span className="flex items-center gap-1.5"><Check className="w-4 h-4" /> {ur('Budget-aware', 'بجٹ کے مطابق')}</span>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="hidden lg:flex justify-center">
              <div className="relative">
                <div className="card w-80 animate-float border-white/40 dark:border-white/10 relative z-10 bg-white/60 dark:bg-slate-800/60 backdrop-blur-2xl shadow-2xl">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-display font-bold text-slate-800 dark:text-white">
                      {ur("Today's Meal Plan", 'آج کا کھانے کا منصوبہ')}
                    </h3>
                    <span className="badge-emerald">{ur('Day 1', 'دن ۱')}</span>
                  </div>
                  {[
                    { mealEn: 'Breakfast', mealUr: 'ناشتہ', items: 'Doodh Dalia + Egg', cal: '320 kcal', cost: '₨45' },
                    { mealEn: 'Lunch',     mealUr: 'دوپہر', items: 'Dal Mash + 2 Roti', cal: '480 kcal', cost: '₨60' },
                    { mealEn: 'Dinner',    mealUr: 'رات',   items: 'Chicken Karahi + Rice', cal: '550 kcal', cost: '₨120' },
                    { mealEn: 'Snack',     mealUr: 'اسنیک', items: 'Apple + Lassi', cal: '180 kcal', cost: '₨35' },
                  ].map((m) => (
                    <div key={m.mealEn} className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-700 last:border-0">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{isUrdu ? m.mealUr : m.mealEn}</p>
                        <p className="text-sm text-slate-800 dark:text-white font-medium">{m.items}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-emerald-600 font-semibold">{m.cal}</p>
                        <p className="text-xs text-amber-600 font-semibold">{m.cost}</p>
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 flex justify-between">
                    <div className="text-center">
                      <p className="text-xs text-slate-500">{ur('Total Calories', 'کل کیلوریز')}</p>
                      <p className="font-bold text-emerald-600 text-sm">1,530 kcal</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500">{ur('Daily Cost', 'روزانہ لاگت')}</p>
                      <p className="font-bold text-amber-600 text-sm">₨260</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500">{ur('Protein', 'پروٹین')}</p>
                      <p className="font-bold text-blue-600 text-sm">78g</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-6 -right-6 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-[0_8px_30px_rgba(16,185,129,0.3)] flex items-center gap-2 z-20 animate-float" style={{ animationDelay: '1s' }}>
                  <Target className="w-4 h-4" /> {ur('Diabetes Safe', 'ذیابطیس محفوظ')}
                </div>
                <div className="absolute -bottom-6 -left-6 bg-gradient-to-br from-amber-400 to-amber-500 text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-[0_8px_30px_rgba(245,158,11,0.3)] flex items-center gap-2 z-20 animate-float" style={{ animationDelay: '2s' }}>
                  <Banknote className="w-4 h-4" /> {ur('Budget: ₨300/day', 'بجٹ: ₨300/روز')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────── */}
      <section className="relative py-16 overflow-hidden bg-white/50 dark:bg-[#080D1A]/50 border-y border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.labelEn}>
                <p className="font-display text-4xl font-extrabold text-slate-900 dark:text-white">{s.value}</p>
                <p className="text-emerald-600 dark:text-emerald-400 text-sm mt-1 font-bold">{isUrdu ? s.labelUr : s.labelEn}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────── */}
      <section className="relative py-32 bg-slate-50 dark:bg-[#060A14] overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title">
              {ur('Everything you need for healthy eating', 'صحت مند کھانے کے لیے سب کچھ')}
            </h2>
            <p className="section-subtitle">
              {ur('Designed specifically for Pakistani dietary needs and budgets', 'پاکستانی غذائی ضروریات اور بجٹ کے لیے خاص طور پر ڈیزائن کیا گیا')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.titleEn} className="card-hover group">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-emerald-900/40 dark:to-teal-900/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-5 group-hover:scale-110 transition-transform duration-300 shadow-inner border border-emerald-200/50 dark:border-emerald-800/50">
                  <f.icon className="w-7 h-7" />
                </div>
                <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white mb-2">
                  {isUrdu ? f.titleUr : f.titleEn}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  {isUrdu ? f.descUr : f.descEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Disease Modes ─────────────────────────────── */}
      <section className="relative py-32 bg-white/40 dark:bg-[#0A0F1D] overflow-hidden backdrop-blur-sm">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title">{ur('Medically Aware Meal Planning', 'طبی لحاظ سے آگاہ کھانے کی منصوبہ بندی')}</h2>
            <p className="section-subtitle">{ur('Safe meal recommendations for chronic conditions', 'دائمی بیماریوں کے لیے محفوظ کھانے کی سفارشات')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {diseaseModes.map((d) => (
              <div key={d.titleEn} className="card-hover">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`text-3xl text-${d.color}-500`}><d.icon className="w-8 h-8" /></span>
                  <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">
                    {isUrdu ? d.titleUr : d.titleEn}
                  </h3>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4">
                  {isUrdu ? d.descUr : d.descEn}
                </p>
                <div className="flex flex-wrap gap-2">
                  {d.foods.map((food) => <span key={food} className="badge-emerald">{food}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reviews ───────────────────────────────────── */}
      <section className="relative py-32 bg-slate-50 dark:bg-[#060A14] overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title">{ur('What our users say', 'ہمارے صارفین کیا کہتے ہیں')}</h2>
            <p className="section-subtitle">{ur('Honest feedback from people using DIETORA', 'DIETORA استعمال کرنے والوں کی سچی رائے')}</p>
          </div>
          {reviewsLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            </div>
          ) : reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((review) => <ReviewCard key={review._id} review={review} />)}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white mb-2">
                {ur('Be the first to share your experience!', 'پہلے اپنا تجربہ شیئر کریں!')}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto mb-6">
                {ur(
                  'Create an account, generate your personalized meal plan, and share how DIETORA is helping you eat healthier.',
                  'اکاؤنٹ بنائیں، اپنا ذاتی کھانے کا منصوبہ بنائیں اور شیئر کریں کہ DIETORA آپ کی کیسے مدد کر رہا ہے۔'
                )}
              </p>
              {user
                ? <Link to="/feedback" className="btn-primary py-2.5 px-6 text-sm inline-block">{ur('Share Your Feedback →', '← اپنی رائے دیں')}</Link>
                : <Link to="/register" className="btn-primary py-2.5 px-6 text-sm inline-block">{ur('Get Started Free →', '← مفت شروع کریں')}</Link>
              }
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────── */}
      <section className="relative py-24 bg-gradient-to-br from-emerald-600 to-teal-700 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-display text-4xl font-bold text-white mb-4">
            {ur('Start your healthy journey today', 'آج ہی اپنا صحت مند سفر شروع کریں')}
          </h2>
          <p className="text-emerald-100 text-lg mb-8">
            {ur('Free AI meal planning with local Pakistani foods. No credit card required.', 'مقامی پاکستانی کھانوں کے ساتھ مفت AI کھانے کی منصوبہ بندی۔ کریڈٹ کارڈ کی ضرورت نہیں۔')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="bg-white text-emerald-700 font-bold py-3 px-8 rounded-xl hover:bg-emerald-50 transition-colors">
              {ur('Create Free Account', 'مفت اکاؤنٹ بنائیں')}
            </Link>
            <Link to="/about" className="border-2 border-white text-white font-bold py-3 px-8 rounded-xl hover:bg-white/10 transition-colors">
              {ur('Learn More', 'مزید جانیں')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
