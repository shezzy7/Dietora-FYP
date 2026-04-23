import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { fetchProfile } from '../store/slices/profileSlice'
import { fetchMealPlans } from '../store/slices/mealPlanSlice'
import { fetchDashboardStats } from '../store/slices/progressSlice'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Scale, Flame, Utensils, Wallet, Bot, ShoppingCart, TrendingUp, BookOpen, Hospital, Award } from 'lucide-react'

function StatCard({ icon, label, value, sub, color = 'emerald' }) {
  const colors = {
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600',
    slate: 'bg-slate-50 dark:bg-slate-700/50 text-slate-500',
  }
  return (
    <div className="stat-card">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${colors[color] || colors.emerald}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="mt-2">
        <p className="text-2xl font-display font-bold text-slate-800 dark:text-white">{value}</p>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function QuickActionCard({ icon: Icon, title, desc, to, color }) {
  const colors = {
    emerald: 'from-emerald-500 to-teal-600 shadow-emerald-500/20',
    amber: 'from-amber-500 to-orange-600 shadow-amber-500/20',
    blue: 'from-blue-500 to-indigo-600 shadow-blue-500/20',
    purple: 'from-purple-500 to-pink-600 shadow-purple-500/20',
  }
  return (
    <Link to={to} className={`bg-gradient-to-br ${colors[color]} rounded-3xl p-6 text-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 block relative overflow-hidden group`}>
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
      <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-md mb-4 border border-white/10">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h3 className="font-display font-bold text-lg mb-1 relative z-10">{title}</h3>
      <p className="text-white/80 text-xs leading-relaxed relative z-10">{desc}</p>
    </Link>
  )
}

export default function DashboardPage() {
  const dispatch = useDispatch()
  const { user } = useSelector((s) => s.auth)
  const { data: profile } = useSelector((s) => s.profile)
  const { list: mealPlans } = useSelector((s) => s.mealPlan)
  const { dashboardStats } = useSelector((s) => s.progress)

  useEffect(() => {
    dispatch(fetchProfile())
    dispatch(fetchMealPlans())
    dispatch(fetchDashboardStats())
  }, [dispatch])

  const bmi = profile?.bmi
  const getBmiStatus = (bmi) => {
    if (!bmi) return { label: 'N/A', color: 'slate' }
    if (bmi < 18.5) return { label: 'Underweight', color: 'blue' }
    if (bmi < 25) return { label: 'Normal', color: 'emerald' }
    if (bmi < 30) return { label: 'Overweight', color: 'amber' }
    return { label: 'Obese', color: 'red' }
  }
  const bmiStatus = getBmiStatus(bmi)

  const latestPlan = mealPlans?.[0]

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  // Extract first name safely — handles null/undefined user
  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Greeting Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            {/* BUG FIX: firstName is now always defined — no more "Good afternoon, !" */}
            <h1 className="font-display text-2xl font-bold">
              {greeting()}, {firstName}!
            </h1>
            <p className="text-emerald-100 mt-1 text-sm">
              {profile
                ? 'Your health profile is set up. Ready to plan meals!'
                : 'Complete your health profile to get personalized AI meal plans.'}
            </p>
          </div>
          {!profile && (
            <Link
              to="/profile"
              className="bg-white text-emerald-700 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-emerald-50 transition-colors flex-shrink-0"
            >
              Setup Profile →
            </Link>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          icon={Scale}
          label="BMI"
          value={bmi ? bmi.toFixed(1) : '—'}
          sub={bmiStatus.label}
          color={bmiStatus.color}
        />
        <StatCard
          icon={Flame}
          label="Daily Calories"
          value={profile?.tdee ? `${Math.round(profile.tdee)}` : '—'}
          sub="TDEE kcal/day"
          color="amber"
        />
        <StatCard
          icon={Utensils}
          label="Meal Plans"
          value={mealPlans?.length || 0}
          sub="Generated"
          color="blue"
        />
        <StatCard
          icon={Wallet}
          label="Daily Budget"
          value={profile?.dailyBudget ? `₨${profile.dailyBudget}` : '—'}
          sub="Per day (PKR)"
          color="emerald"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-display font-bold text-xl text-slate-800 dark:text-white mb-5">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <QuickActionCard icon={Bot} title="Generate Meal Plan" desc="Create a new 7-day AI plan" to="/meal-plan" color="emerald" />
          <QuickActionCard icon={ShoppingCart} title="Grocery List" desc="View items to purchase" to="/grocery" color="amber" />
          <QuickActionCard icon={TrendingUp} title="My Progress" desc="Track calories & budget" to="/progress" color="blue" />
          <QuickActionCard icon={BookOpen} title="Learn Nutrition" desc="Articles on healthy eating" to="/education" color="purple" />
        </div>
      </div>

      {/* Gamified Health Dashboard */}
      {dashboardStats && (
        <div className="card border-2 border-emerald-100 dark:border-emerald-900/40 shadow-xl shadow-emerald-900/5">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-1/3 flex flex-col justify-center items-center text-center border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 pb-8 lg:pb-0 lg:pr-8">
              <h3 className="font-display font-bold text-slate-800 dark:text-white mb-2">Weekly Health Score</h3>
              <p className="text-xs text-slate-500 mb-6">Week {dashboardStats.weekNumber} Adherence</p>
              
              <div className="relative w-40 h-40 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 mb-4 shadow-inner">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle cx="80" cy="80" r="70" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="12" fill="none" />
                  <circle cx="80" cy="80" r="70" className="stroke-emerald-500 transition-all duration-1000 ease-out" strokeWidth="12" fill="none" strokeDasharray="440" strokeDashoffset={440 - (440 * dashboardStats.healthScore) / 100} strokeLinecap="round" />
                </svg>
                <div className="text-center z-10">
                  <span className="text-4xl font-display font-bold text-emerald-600">{dashboardStats.healthScore}%</span>
                </div>
              </div>

              {dashboardStats.healthScore >= 80 ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full">
                  <Award className="w-4 h-4" /> Outstanding!
                </div>
              ) : dashboardStats.healthScore >= 50 ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-full">
                  <Flame className="w-4 h-4" /> Keep going!
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-full">
                  <TrendingUp className="w-4 h-4" /> You got this!
                </div>
              )}
            </div>

            <div className="lg:w-2/3">
              <h3 className="font-display font-bold text-slate-800 dark:text-white mb-6">Calorie Intake Trend</h3>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashboardStats.chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                    />
                    <Area type="monotone" dataKey="calories" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCalories)" activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Health Profile Summary */}
      {profile && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-slate-800 dark:text-white">Health Profile</h3>
              <Link to="/profile" className="text-emerald-600 text-xs font-semibold hover:underline">Edit →</Link>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Age', value: profile.age ? `${profile.age} years` : '—' },
                { label: 'Gender', value: profile.gender || '—' },
                { label: 'Height', value: profile.height ? `${profile.height} cm` : '—' },
                { label: 'Weight', value: profile.weight ? `${profile.weight} kg` : '—' },
                { label: 'BMI', value: bmi ? `${bmi.toFixed(1)} (${bmiStatus.label})` : '—' },
                { label: 'Goal', value: profile.goal?.replace(/_/g, ' ') || '—' },
                {
                  label: 'Conditions',
                  value: [
                    profile.isDiabetic && 'Diabetes',
                    profile.isHypertensive && 'Hypertension',
                    profile.isCardiac && 'Cardiac',
                  ].filter(Boolean).join(', ') || 'None',
                },
                { label: 'Allergies', value: profile.allergies?.length ? profile.allergies.join(', ') : 'None' },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-slate-700 last:border-0"
                >
                  <span className="text-sm text-slate-500 dark:text-slate-400">{row.label}</span>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 capitalize">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Latest Meal Plan */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-slate-800 dark:text-white">Latest Meal Plan</h3>
              <Link to="/meal-plan" className="text-emerald-600 text-xs font-semibold hover:underline">View All →</Link>
            </div>
            {latestPlan ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <span className="badge-emerald text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium">
                    7-Day Plan
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(latestPlan.createdAt).toLocaleDateString('en-PK')}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Avg Daily Calories</span>
                    <span className="text-sm font-bold text-emerald-600">{latestPlan.avgDailyCalories || '—'} kcal</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Avg Daily Cost</span>
                    <span className="text-sm font-bold text-amber-600">₨{latestPlan.avgDailyCost || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Weekly Total Cost</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">₨{latestPlan.weeklyTotalCost || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Status</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      latestPlan.status === 'active'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                      {latestPlan.status}
                    </span>
                  </div>
                </div>
                <Link to="/meal-plan" className="block text-center text-sm text-emerald-600 dark:text-emerald-400 font-semibold hover:underline mt-2">
                  View Full Plan →
                </Link>
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Utensils className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">No meal plans yet</p>
                <Link to="/meal-plan" className="btn-primary mt-6 inline-flex py-2.5 px-6 text-sm">
                  Generate Plan
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Profile CTA */}
      {!profile && (
        <div className="card text-center py-16 border-dashed border-2 border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
            <Hospital className="w-10 h-10 text-emerald-600" />
          </div>
          <h3 className="font-display font-bold text-2xl text-slate-800 dark:text-white mb-3">
            Complete your health profile
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-base mb-8 max-w-md mx-auto leading-relaxed">
            Add your weight, height, health conditions, and daily budget to get personalized AI meal plans tailored specifically for you.
          </p>
          <Link to="/profile" className="btn-primary inline-flex py-3 px-8 text-base">
            Set Up Health Profile
          </Link>
        </div>
      )}
    </div>
  )
}
