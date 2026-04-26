import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { fetchProfile } from '../store/slices/profileSlice'
import { fetchMealPlans } from '../store/slices/mealPlanSlice'
import { fetchDashboardStats } from '../store/slices/progressSlice'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Scale, Flame, Utensils, Wallet, Bot, ShoppingCart, TrendingUp, BookOpen, Hospital, Award } from 'lucide-react'
import { useUrdu } from '../context/UrduContext'

function StatCard({ icon: Icon, label, value, sub, color = 'emerald' }) {
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
  const { t, isUrdu } = useUrdu()

  useEffect(() => {
    dispatch(fetchProfile())
    dispatch(fetchMealPlans())
    dispatch(fetchDashboardStats())
  }, [dispatch])

  const bmi = profile?.bmi
  const getBmiStatus = (bmi) => {
    if (!bmi) return { label: isUrdu ? 'دستیاب نہیں' : 'N/A', color: 'slate' }
    if (bmi < 18.5) return { label: isUrdu ? 'کم وزن' : 'Underweight', color: 'blue' }
    if (bmi < 25)   return { label: isUrdu ? 'نارمل' : 'Normal',      color: 'emerald' }
    if (bmi < 30)   return { label: isUrdu ? 'زیادہ وزن' : 'Overweight', color: 'amber' }
    return           { label: isUrdu ? 'موٹاپا' : 'Obese',             color: 'red' }
  }
  const bmiStatus = getBmiStatus(bmi)

  const latestPlan = mealPlans?.[0]

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return t('dashboard.greeting.morning')
    if (h < 17) return t('dashboard.greeting.afternoon')
    return t('dashboard.greeting.evening')
  }

  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || (isUrdu ? 'دوست' : 'there')

  const urduStyle = isUrdu ? { fontFamily: "'Noto Nastaliq Urdu', serif" } : {}

  return (
    <div className="space-y-8 animate-fade-in" style={urduStyle}>

      {/* Greeting Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold">
              {greeting()}, {firstName}!
            </h1>
            <p className="text-emerald-100 mt-1 text-sm">
              {profile
                ? (isUrdu ? 'آپ کا صحت پروفائل مکمل ہے۔ کھانے کا منصوبہ بنائیں!' : 'Your health profile is set up. Ready to plan meals!')
                : (isUrdu ? 'ذاتی AI کھانے کے منصوبے کے لیے صحت پروفائل مکمل کریں۔' : 'Complete your health profile to get personalized AI meal plans.')
              }
            </p>
          </div>
          {!profile && (
            <Link
              to="/profile"
              className="bg-white text-emerald-700 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-emerald-50 transition-colors flex-shrink-0"
            >
              {isUrdu ? 'پروفائل بنائیں ←' : 'Setup Profile →'}
            </Link>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          icon={Scale}
          label={t('dashboard.bmi')}
          value={bmi ? bmi.toFixed(1) : '—'}
          sub={bmiStatus.label}
          color={bmiStatus.color}
        />
        <StatCard
          icon={Flame}
          label={t('dashboard.calories')}
          value={profile?.tdee ? `${Math.round(profile.tdee)}` : '—'}
          sub={`TDEE ${t('general.kcal')}/${t('general.day')}`}
          color="amber"
        />
        <StatCard
          icon={Utensils}
          label={t('dashboard.mealPlans')}
          value={mealPlans?.length || 0}
          sub={isUrdu ? 'بنائے گئے' : 'Generated'}
          color="blue"
        />
        <StatCard
          icon={Wallet}
          label={t('dashboard.budget')}
          value={profile?.dailyBudget ? `₨${profile.dailyBudget}` : '—'}
          sub={`${isUrdu ? 'فی دن' : 'Per day'} (PKR)`}
          color="emerald"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-display font-bold text-xl text-slate-800 dark:text-white mb-5">
          {isUrdu ? 'فوری اقدام' : 'Quick Actions'}
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <QuickActionCard icon={Bot}         title={t('meal.generate')}        desc={isUrdu ? 'نیا 7 روزہ AI منصوبہ بنائیں' : 'Create a new 7-day AI plan'}         to="/meal-plan"  color="emerald" />
          <QuickActionCard icon={ShoppingCart} title={t('grocery.title')}        desc={isUrdu ? 'خریداری کی فہرست دیکھیں' : 'View items to purchase'}              to="/grocery"    color="amber"   />
          <QuickActionCard icon={TrendingUp}   title={t('progress.title')}       desc={isUrdu ? 'کیلوریز اور بجٹ ٹریک کریں' : 'Track calories & budget'}           to="/progress"   color="blue"    />
          <QuickActionCard icon={BookOpen}     title={t('education.title')}      desc={isUrdu ? 'صحت بخش غذا کے مضامین' : 'Articles on healthy eating'}            to="/education"  color="purple"  />
        </div>
      </div>

      {/* Gamified Health Dashboard */}
      {dashboardStats && (
        <div className="card border-2 border-emerald-100 dark:border-emerald-900/40 shadow-xl shadow-emerald-900/5">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-1/3 flex flex-col justify-center items-center text-center border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 pb-8 lg:pb-0 lg:pr-8">
              <h3 className="font-display font-bold text-slate-800 dark:text-white mb-2">
                {isUrdu ? 'ہفتہ وار صحت اسکور' : 'Weekly Health Score'}
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                {isUrdu ? `ہفتہ ${dashboardStats.weekNumber} پابندی` : `Week ${dashboardStats.weekNumber} Adherence`}
              </p>

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
                  <Award className="w-4 h-4" /> {isUrdu ? 'شاندار!' : 'Outstanding!'}
                </div>
              ) : dashboardStats.healthScore >= 50 ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-full">
                  <Flame className="w-4 h-4" /> {isUrdu ? 'جاری رکھیں!' : 'Keep going!'}
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-full">
                  <TrendingUp className="w-4 h-4" /> {isUrdu ? 'آپ کر سکتے ہیں!' : 'You got this!'}
                </div>
              )}
            </div>

            <div className="lg:w-2/3">
              <h3 className="font-display font-bold text-slate-800 dark:text-white mb-6">
                {isUrdu ? 'کیلوری انٹیک رجحان' : 'Calorie Intake Trend'}
              </h3>
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
              <h3 className="font-display font-bold text-slate-800 dark:text-white">{t('profile.title')}</h3>
              <Link to="/profile" className="text-emerald-600 text-xs font-semibold hover:underline">
                {isUrdu ? 'ترمیم ←' : 'Edit →'}
              </Link>
            </div>
            <div className="space-y-3">
              {[
                { label: t('profile.age'),    value: profile.age    ? `${profile.age} ${isUrdu ? 'سال' : 'years'}` : '—' },
                { label: t('profile.gender'), value: profile.gender === 'male' ? t('profile.male') : profile.gender === 'female' ? t('profile.female') : (profile.gender || '—') },
                { label: t('profile.height'), value: profile.height ? `${profile.height} cm` : '—' },
                { label: t('profile.weight'), value: profile.weight ? `${profile.weight} kg` : '—' },
                { label: t('dashboard.bmi'),  value: bmi ? `${bmi.toFixed(1)} (${bmiStatus.label})` : '—' },
                { label: t('profile.goal'),   value: profile.goal?.replace(/_/g, ' ') || '—' },
                {
                  label: t('profile.conditions'),
                  value: [
                    profile.isDiabetic    && t('profile.diabetes'),
                    profile.isHypertensive && t('profile.hypertension'),
                    profile.isCardiac     && t('profile.cardiac'),
                  ].filter(Boolean).join(', ') || (isUrdu ? 'کوئی نہیں' : 'None'),
                },
                {
                  label: t('profile.allergies'),
                  value: profile.allergies?.length ? profile.allergies.join(', ') : (isUrdu ? 'کوئی نہیں' : 'None'),
                },
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
              <h3 className="font-display font-bold text-slate-800 dark:text-white">
                {isUrdu ? 'تازہ ترین کھانے کا منصوبہ' : 'Latest Meal Plan'}
              </h3>
              <Link to="/meal-plan" className="text-emerald-600 text-xs font-semibold hover:underline">
                {isUrdu ? 'سب دیکھیں ←' : 'View All →'}
              </Link>
            </div>
            {latestPlan ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <span className="badge-emerald text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium">
                    {isUrdu ? '7 روزہ منصوبہ' : '7-Day Plan'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(latestPlan.createdAt).toLocaleDateString('en-PK')}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {isUrdu ? 'اوسط روزانہ کیلوریز' : 'Avg Daily Calories'}
                    </span>
                    <span className="text-sm font-bold text-emerald-600">{latestPlan.avgDailyCalories || '—'} kcal</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {isUrdu ? 'اوسط روزانہ لاگت' : 'Avg Daily Cost'}
                    </span>
                    <span className="text-sm font-bold text-amber-600">₨{latestPlan.avgDailyCost || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {isUrdu ? 'ہفتہ وار کل لاگت' : 'Weekly Total Cost'}
                    </span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">₨{latestPlan.weeklyTotalCost || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {isUrdu ? 'حیثیت' : 'Status'}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      latestPlan.status === 'active'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                      {latestPlan.status === 'active' ? (isUrdu ? 'فعال' : 'active') : latestPlan.status}
                    </span>
                  </div>
                </div>
                <Link to="/meal-plan" className="block text-center text-sm text-emerald-600 dark:text-emerald-400 font-semibold hover:underline mt-2">
                  {isUrdu ? 'پورا منصوبہ دیکھیں ←' : 'View Full Plan →'}
                </Link>
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Utensils className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {isUrdu ? 'ابھی تک کوئی منصوبہ نہیں' : 'No meal plans yet'}
                </p>
                <Link to="/meal-plan" className="btn-primary mt-6 inline-flex py-2.5 px-6 text-sm">
                  {t('meal.generate')}
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
            {isUrdu ? 'صحت پروفائل مکمل کریں' : 'Complete your health profile'}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-base mb-8 max-w-md mx-auto leading-relaxed">
            {isUrdu
              ? 'وزن، قد، صحت کی حالت، اور روزانہ بجٹ شامل کریں تاکہ آپ کے لیے ذاتی AI کھانے کا منصوبہ بنایا جا سکے۔'
              : 'Add your weight, height, health conditions, and daily budget to get personalized AI meal plans tailored specifically for you.'
            }
          </p>
          <Link to="/profile" className="btn-primary inline-flex py-3 px-8 text-base">
            {isUrdu ? 'صحت پروفائل بنائیں' : 'Set Up Health Profile'}
          </Link>
        </div>
      )}
    </div>
  )
}
