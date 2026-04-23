import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Salad, ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  const { token } = useSelector((s) => s.auth)
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="text-center animate-fade-in max-w-md w-full mx-auto">
        <div className="w-32 h-32 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/10">
          <Salad className="w-16 h-16 text-emerald-600" />
        </div>
        <h1 className="font-display text-6xl font-bold text-slate-900 dark:text-white mb-2">404</h1>
        <h2 className="font-display text-2xl font-bold text-slate-700 dark:text-slate-300 mb-4">Page Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 max-w-sm mx-auto">
          Looks like this page went missing from our menu. Let's get you back on track.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
          <Link to={token ? '/dashboard' : '/'} className="btn-primary py-3 px-8 flex items-center justify-center gap-2 text-base">
            <ArrowLeft className="w-4 h-4" /> {token ? 'Back to Dashboard' : 'Back to Home'}
          </Link>
          {!token && (
            <Link to="/login" className="btn-secondary py-3 px-8">Login</Link>
          )}
        </div>
      </div>
    </div>
  )
}
