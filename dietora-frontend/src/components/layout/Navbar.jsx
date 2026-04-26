import { Link, NavLink } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { toggleTheme } from '../../store/slices/themeSlice'
import { logout } from '../../store/slices/authSlice'
import { useState } from 'react'
import { Sun, Moon, Menu, X } from 'lucide-react'
import { useUrdu } from '../../context/UrduContext'

export default function Navbar() {
  const dispatch = useDispatch()
  const { dark } = useSelector((s) => s.theme)
  const { user } = useSelector((s) => s.auth)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isUrdu, toggleUrdu } = useUrdu()

  return (
    <nav className="sticky top-0 z-50 glass border-b border-slate-100 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 font-display font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white group">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl flex items-center justify-center shadow-[0_4px_12px_rgba(16,185,129,0.3)] group-hover:shadow-[0_4px_20px_rgba(16,185,129,0.5)] transition-shadow">
              <span className="text-white text-lg font-black tracking-tighter">D</span>
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300">DIETORA</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/" end className={({isActive}) => isActive ? 'text-emerald-600 font-semibold text-sm' : 'nav-link'}>
              {isUrdu ? 'ہوم' : 'Home'}
            </NavLink>
            <NavLink to="/about" className={({isActive}) => isActive ? 'text-emerald-600 font-semibold text-sm' : 'nav-link'}>
              {isUrdu ? 'ہمارے بارے میں' : 'About'}
            </NavLink>
            <NavLink to="/faq" className={({isActive}) => isActive ? 'text-emerald-600 font-semibold text-sm' : 'nav-link'}>
              {isUrdu ? 'سوالات' : 'FAQ'}
            </NavLink>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">

            {/* Language Toggle */}
            <button
              onClick={toggleUrdu}
              title={isUrdu ? 'Switch to English' : 'اردو میں تبدیل کریں'}
              className="px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors text-xs font-bold border border-emerald-200 dark:border-emerald-800 select-none"
              aria-label="Toggle language"
            >
              {isUrdu ? 'EN' : 'اردو'}
            </button>

            <button
              onClick={() => dispatch(toggleTheme())}
              className="p-2.5 rounded-xl text-slate-500 bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 border border-slate-200/50 dark:border-slate-700/50 transition-all hover:scale-105 active:scale-95"
              title={dark ? 'Light mode' : 'Dark mode'}
            >
              {dark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <Link to="/dashboard" className="btn-primary py-2 px-4 text-sm">
                  {isUrdu ? 'ڈیش بورڈ' : 'Dashboard'}
                </Link>
                <button onClick={() => dispatch(logout())} className="btn-secondary py-2 px-4 text-sm">
                  {isUrdu ? 'لاگ آؤٹ' : 'Logout'}
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="btn-secondary py-2 px-4 text-sm">
                  {isUrdu ? 'لاگ ان' : 'Login'}
                </Link>
                <Link to="/register" className="btn-primary py-2 px-4 text-sm">
                  {isUrdu ? 'شروع کریں' : 'Get Started'}
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-2 animate-slide-up relative z-50">
            <div className="p-2 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-md">
              <NavLink to="/" end className="block py-3 px-4 rounded-xl nav-link mb-1 hover:bg-slate-100/50 dark:hover:bg-slate-800/50" onClick={() => setMobileOpen(false)}>
                {isUrdu ? 'ہوم' : 'Home'}
              </NavLink>
              <NavLink to="/about" className="block py-3 px-4 rounded-xl nav-link mb-1 hover:bg-slate-100/50 dark:hover:bg-slate-800/50" onClick={() => setMobileOpen(false)}>
                {isUrdu ? 'ہمارے بارے میں' : 'About'}
              </NavLink>
              <NavLink to="/faq" className="block py-3 px-4 rounded-xl nav-link mb-2 hover:bg-slate-100/50 dark:hover:bg-slate-800/50" onClick={() => setMobileOpen(false)}>
                {isUrdu ? 'سوالات' : 'FAQ'}
              </NavLink>
              {!user && (
                <div className="flex gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 px-2 mt-2">
                  <Link to="/login" className="btn-secondary py-2.5 px-4 text-sm flex-1 text-center" onClick={() => setMobileOpen(false)}>
                    {isUrdu ? 'لاگ ان' : 'Login'}
                  </Link>
                  <Link to="/register" className="btn-primary py-2.5 px-4 text-sm flex-1 text-center" onClick={() => setMobileOpen(false)}>
                    {isUrdu ? 'شروع کریں' : 'Get Started'}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
