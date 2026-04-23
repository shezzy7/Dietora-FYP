import { Inbox } from 'lucide-react'

// Spinner
export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4 border-2', md: 'w-8 h-8 border-3', lg: 'w-12 h-12 border-4' }
  return (
    <div className={`${sizes[size]} border-emerald-200 border-t-emerald-600 rounded-full animate-spin ${className}`} />
  )
}

// Loading overlay
export function LoadingOverlay({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <Spinner size="lg" />
      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{text}</p>
    </div>
  )
}

// Empty state
export function EmptyState({ icon = <Inbox className="w-12 h-12 text-slate-400" />, title, subtitle, action }) {
  return (
    <div className="text-center py-16">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="font-display font-bold text-xl text-slate-800 dark:text-white mb-2">{title}</h3>
      {subtitle && <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-sm mx-auto">{subtitle}</p>}
      {action}
    </div>
  )
}

// Badge
export function Badge({ children, variant = 'emerald' }) {
  const variants = {
    emerald: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400',
    amber:   'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
    red:     'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
    blue:    'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400',
    purple:  'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400',
    slate:   'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  )
}

// Stat Card
export function StatCard({ icon, label, value, sub, color = 'emerald' }) {
  const iconColors = {
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
    amber:   'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
    blue:    'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
    red:     'bg-red-50 dark:bg-red-900/20 text-red-600',
    purple:  'bg-purple-50 dark:bg-purple-900/20 text-purple-600',
  }
  const textColors = {
    emerald: 'text-emerald-600', amber: 'text-amber-600',
    blue: 'text-blue-600', red: 'text-red-600', purple: 'text-purple-600',
  }
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card dark:shadow-card-dark border border-slate-100 dark:border-slate-700 p-5 flex flex-col gap-2">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${iconColors[color] || iconColors.emerald}`}>
        {icon}
      </div>
      <div className="mt-1">
        <p className={`text-2xl font-display font-bold ${textColors[color] || textColors.emerald}`}>{value}</p>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// Progress Bar
export function ProgressBar({ value, max = 100, color = 'emerald', label, showPct = true }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  const colors = {
    emerald: 'bg-emerald-500', amber: 'bg-amber-500',
    blue: 'bg-blue-500', red: 'bg-red-500',
  }
  return (
    <div>
      {(label || showPct) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>}
          {showPct && <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{pct}%</span>}
        </div>
      )}
      <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colors[color] || colors.emerald}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// Section header
export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">{title}</h1>
        {subtitle && <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

// Card
export function Card({ children, className = '', hover = false }) {
  const base = 'bg-white dark:bg-slate-800 rounded-2xl shadow-card dark:shadow-card-dark border border-slate-100 dark:border-slate-700 p-6'
  const hoverClass = hover ? ' hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer' : ''
  return <div className={`${base}${hoverClass} ${className}`}>{children}</div>
}

// Input Field
export function InputField({ label, error, icon, ...props }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>}
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
        <input
          {...props}
          className={`w-full ${icon ? 'pl-10' : 'px-4'} py-3 rounded-xl border ${error ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 dark:border-slate-600'} bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-sm`}
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}
