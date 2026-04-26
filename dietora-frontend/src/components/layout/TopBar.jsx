import { useDispatch, useSelector } from 'react-redux'
import { toggleTheme } from '../../store/slices/themeSlice'
import { toggleChatbot } from '../../store/slices/chatbotSlice'
import { useLocation } from 'react-router-dom'
import { Menu, Bot, Sun, Moon } from 'lucide-react'
import { useUrdu } from '../../context/UrduContext'

const PAGE_NAME_KEYS = {
  '/dashboard': 'nav.dashboard',
  '/profile':   'nav.profile',
  '/meal-plan': 'nav.mealPlan',
  '/grocery':   'nav.grocery',
  '/budget':    'nav.budget',
  '/progress':  'nav.progress',
  '/education': 'nav.education',
  '/feedback':  'nav.feedback',
  '/admin':     'nav.settings',
  '/account':   'nav.settings',
}

export default function TopBar({ onMenuClick }) {
  const dispatch = useDispatch()
  const { dark } = useSelector((s) => s.theme)
  const { user } = useSelector((s) => s.auth)
  const location = useLocation()
  const { t, isUrdu, toggleUrdu } = useUrdu()

  const titleKey = PAGE_NAME_KEYS[location.pathname]
  const title = titleKey ? t(titleKey) : 'DIETORA'

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 flex items-center px-4 md:px-6 gap-4">
      {/* Mobile Menu */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page Title */}
      <div className="flex-1">
        <h1
          className="font-display font-bold text-slate-800 dark:text-white text-lg"
          style={isUrdu ? { fontFamily: "'Noto Nastaliq Urdu', serif" } : {}}
        >
          {title}
        </h1>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">

        {/* Language Toggle */}
        <button
          onClick={toggleUrdu}
          title={isUrdu ? 'Switch to English' : 'اردو میں تبدیل کریں'}
          className="px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors text-xs font-bold border border-emerald-200 dark:border-emerald-800 select-none"
          aria-label="Toggle language"
        >
          {isUrdu ? 'EN' : 'اردو'}
        </button>

        {/* Chatbot */}
        <button
          onClick={() => dispatch(toggleChatbot())}
          className="p-2 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
          title="Open AI Chatbot"
        >
          <Bot className="w-5 h-5" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => dispatch(toggleTheme())}
          className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* User Avatar */}
        {user && (
          <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm ml-2 shadow-sm border-2 border-white dark:border-slate-800 cursor-pointer hover:scale-105 transition-transform">
            {user.name?.[0]?.toUpperCase() || 'U'}
          </div>
        )}
      </div>
    </header>
  )
}
