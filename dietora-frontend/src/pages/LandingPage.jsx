import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'

const features = [
  { icon: '🤖', title: 'AI Meal Planning', desc: 'Get personalized 7-day meal plans based on your health conditions, allergies, and budget — tailored for Pakistani foods.' },
  { icon: '💰', title: 'Budget Optimizer', desc: 'Eat healthy within your budget. Our AI optimizes meals using local Faisalabad market prices in PKR.' },
  { icon: '🥗', title: 'Disease-Aware Diets', desc: 'Safe meal plans for diabetes, hypertension, and cardiac conditions — medically filtered food suggestions.' },
  { icon: '🛒', title: 'Smart Grocery Lists', desc: 'Auto-generated grocery lists from your meal plan. Mark items as purchased, track spending.' },
  { icon: '📊', title: 'Progress Tracking', desc: 'Visual charts for calories consumed, budget adherence, and weekly nutrition breakdown.' },
  { icon: '📚', title: 'Educational Hub', desc: 'Learn about nutrition, disease management, and healthy Pakistani cooking through expert articles.' },
]

const stats = [
  { value: '30+', label: 'Pakistani Foods' },
  { value: '7-Day', label: 'Meal Plans' },
  { value: '3', label: 'Disease Modes' },
  { value: '100%', label: 'Budget Aware' },
]

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`text-sm ${i <= rating ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}>★</span>
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
      <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4 italic">
        "{review.comment}"
      </p>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
          {initial}
        </div>
        <div>
          <p className="font-semibold text-slate-800 dark:text-white text-sm">{name}</p>
          {review.category && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{review.category}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function getTimeAgo(dateStr) {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  const diffWeeks = Math.floor(diffDays / 7)
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
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API_BASE}/feedback/public`)
      .then((res) => {
        setReviews(res.data?.data || [])
      })
      .catch(() => {
        setReviews([])
      })
      .finally(() => setReviewsLoading(false))
  }, [])

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-hero-pattern opacity-50" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse-slow" />
                AI-Powered Diet Planning
              </div>

              <h1 className="font-display text-5xl md:text-6xl font-bold text-slate-900 dark:text-white leading-tight">
                Eat Smart,
                <br />
                <span className="text-gradient">Stay Healthy</span>
                <br />
                <span className="text-4xl md:text-5xl">with Pakistani Foods</span>
              </h1>

              <p className="mt-6 text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg">
                DIETORA generates personalized 7-day meal plans based on your health conditions, budget in PKR, and local Pakistani ingredients. Designed for Faisalabad families.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                {user ? (
                  <Link to="/dashboard" className="btn-primary text-center text-base py-3 px-8">
                    Go to Dashboard →
                  </Link>
                ) : (
                  <>
                    <Link to="/register" className="btn-primary text-center text-base py-3 px-8">
                      Get Free Meal Plan →
                    </Link>
                    <Link to="/login" className="btn-outline text-center text-base py-3 px-8">
                      Login
                    </Link>
                  </>
                )}
              </div>

              {/* Trust Badges */}
              <div className="mt-8 flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">✓ Free to use</span>
                <span>·</span>
                <span className="flex items-center gap-1">✓ Medically filtered</span>
                <span>·</span>
                <span className="flex items-center gap-1">✓ Budget-aware</span>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="hidden lg:flex justify-center">
              <div className="relative">
                {/* Mock Dashboard Card */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 w-80 border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-display font-bold text-slate-800 dark:text-white">Today's Meal Plan</h3>
                    <span className="badge-emerald">Day 1</span>
                  </div>
                  {[
                    { meal: '🌅 Breakfast', items: 'Doodh Dalia + Egg', cal: '320 kcal', cost: '₨45' },
                    { meal: '☀️ Lunch', items: 'Dal Mash + 2 Roti', cal: '480 kcal', cost: '₨60' },
                    { meal: '🌙 Dinner', items: 'Chicken Karahi + Rice', cal: '550 kcal', cost: '₨120' },
                    { meal: '🍎 Snack', items: 'Apple + Lassi', cal: '180 kcal', cost: '₨35' },
                  ].map((m) => (
                    <div key={m.meal} className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-700 last:border-0">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{m.meal}</p>
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
                      <p className="text-xs text-slate-500">Total Calories</p>
                      <p className="font-bold text-emerald-600 text-sm">1,530 kcal</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Daily Cost</p>
                      <p className="font-bold text-amber-600 text-sm">₨260</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Protein</p>
                      <p className="font-bold text-blue-600 text-sm">78g</p>
                    </div>
                  </div>
                </div>

                {/* Floating Badges */}
                <div className="absolute -top-4 -right-4 bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-glow">
                  🎯 Diabetes Safe
                </div>
                <div className="absolute -bottom-4 -left-4 bg-amber-500 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-glow-amber">
                  💰 Budget: ₨300/day
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-emerald-600 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="font-display text-4xl font-bold text-white">{s.value}</p>
                <p className="text-emerald-100 text-sm mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title">Everything you need for healthy eating</h2>
            <p className="section-subtitle">Designed specifically for Pakistani dietary needs and budgets</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="card-hover group">
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-200">
                  {f.icon}
                </div>
                <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white mb-2">{f.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disease Modes */}
      <section className="py-24 bg-slate-50 dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title">Medically Aware Meal Planning</h2>
            <p className="section-subtitle">Safe meal recommendations for chronic conditions</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '🩸', title: 'Diabetes', color: 'blue', desc: 'Low-glycemic Pakistani foods, avoiding sugar-rich items. Focuses on whole grains, dal, and vegetables.', foods: ['Karela', 'Methi', 'Masoor Dal', 'Whole Wheat Roti'] },
              { icon: '❤️', title: 'Hypertension', color: 'red', desc: 'Low-sodium meals, avoiding pickles and processed foods. Rich in potassium from fresh vegetables.', foods: ['Palak', 'Tomatoes', 'Garlic', 'Bananas'] },
              { icon: '🫀', title: 'Cardiac Health', color: 'purple', desc: 'Low saturated fat, high fiber meals. Avoids fried foods, favors grilled and steamed preparations.', foods: ['Fish', 'Olive Oil', 'Oats', 'Nuts'] },
            ].map((d) => (
              <div key={d.title} className="card">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{d.icon}</span>
                  <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">{d.title}</h3>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4">{d.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {d.foods.map((food) => (
                    <span key={food} className="badge-emerald">{food}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* User Reviews — Real feedback from actual users */}
      <section className="py-24 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title">What our users say</h2>
            <p className="section-subtitle">Honest feedback from people using DIETORA</p>
          </div>

          {reviewsLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            </div>
          ) : reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((review) => (
                <ReviewCard key={review._id} review={review} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-4">
                💬
              </div>
              <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white mb-2">
                Be the first to share your experience!
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto mb-6">
                Create an account, generate your personalized meal plan, and share how DIETORA is helping you eat healthier.
              </p>
              {user ? (
                <Link to="/feedback" className="btn-primary py-2.5 px-6 text-sm inline-block">
                  Share Your Feedback →
                </Link>
              ) : (
                <Link to="/register" className="btn-primary py-2.5 px-6 text-sm inline-block">
                  Get Started Free →
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-teal-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-display text-4xl font-bold text-white mb-4">Start your healthy journey today</h2>
          <p className="text-emerald-100 text-lg mb-8">Free AI meal planning with local Pakistani foods. No credit card required.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="bg-white text-emerald-700 font-bold py-3 px-8 rounded-xl hover:bg-emerald-50 transition-colors">
              Create Free Account
            </Link>
            <Link to="/about" className="border-2 border-white text-white font-bold py-3 px-8 rounded-xl hover:bg-white/10 transition-colors">
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
