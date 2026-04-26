import { NavLink } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../store/slices/authSlice'
import { useUrdu } from '../../context/UrduContext'
import {
  LayoutDashboard, User, CalendarDays, ShoppingCart,
  Wallet, TrendingUp, BookOpen, MessageSquare,
  Settings, LogOut, UserCog,
} from 'lucide-react'

export default function Sidebar({ open, onClose }) {
  const dispatch   = useDispatch()
  const { user }   = useSelector((s) => s.auth)
  const { t, isUrdu } = useUrdu()

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
    { to: '/profile',   icon: User,            labelKey: 'nav.profile'   },
    { to: '/meal-plan', icon: CalendarDays,    labelKey: 'nav.mealPlan'  },
    { to: '/grocery',   icon: ShoppingCart,    labelKey: 'nav.grocery'   },
    { to: '/budget',    icon: Wallet,          labelKey: 'nav.budget'    },
    { to: '/progress',  icon: TrendingUp,      labelKey: 'nav.progress'  },
    { to: '/education', icon: BookOpen,        labelKey: 'nav.education' },
    { to: '/feedback',  icon: MessageSquare,   labelKey: 'nav.feedback'  },
  ]

  return (
    <aside className={`
      fixed top-0 left-0 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800
      flex flex-col z-40 transition-transform duration-300
      ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
    `}>
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 font-display font-bold text-xl text-emerald-600">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-md">
            <span className="text-white text-sm font-black">D</span>
          </div>
          DIETORA
        </div>
        <button onClick={onClose} className="lg:hidden p-1 text-slate-400 hover:text-slate-600">✕</button>
      </div>

      {/* User */}
      {user && (
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 font-bold text-sm">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) => `sidebar-link group ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity shrink-0" />
              <span style={isUrdu ? { fontFamily: "'Noto Nastaliq Urdu', serif" } : {}}>
                {t(item.labelKey)}
              </span>
            </NavLink>
          )
        })}

        {user?.role === 'admin' && (
          <NavLink
            to="/admin"
            onClick={onClose}
            className={({ isActive }) => `sidebar-link group ${isActive ? 'active' : ''}`}
          >
            <Settings className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity shrink-0" />
            <span style={isUrdu ? { fontFamily: "'Noto Nastaliq Urdu', serif" } : {}}>
              Admin Panel
            </span>
          </NavLink>
        )}
      </nav>

      {/* Bottom Actions */}
      <div className="px-3 py-4 border-t border-slate-100 dark:border-slate-800 space-y-1">
        <NavLink
          to="/account"
          onClick={onClose}
          className={({ isActive }) => `sidebar-link group ${isActive ? 'active' : ''}`}
        >
          <UserCog className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity shrink-0" />
          <span style={isUrdu ? { fontFamily: "'Noto Nastaliq Urdu', serif" } : {}}>
            {t('nav.settings')}
          </span>
        </NavLink>
        <button
          onClick={() => dispatch(logout())}
          className="sidebar-link w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 group"
        >
          <LogOut className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity shrink-0" />
          <span style={isUrdu ? { fontFamily: "'Noto Nastaliq Urdu', serif" } : {}}>
            {isUrdu ? 'لاگ آؤٹ' : 'Logout'}
          </span>
        </button>
      </div>
    </aside>
  )
}
