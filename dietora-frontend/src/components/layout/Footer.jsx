import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="relative bg-slate-50 dark:bg-[#04070D] border-t border-slate-200/50 dark:border-slate-800/50 mt-auto overflow-hidden">
      {/* Glow Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-px bg-gradient-to-r from-transparent via-emerald-500/30 dark:via-emerald-500/50 to-transparent pointer-events-none" />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[800px] h-48 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-[100%] blur-[80px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-8">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 font-display font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white mb-4 w-fit group">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl flex items-center justify-center shadow-[0_4px_12px_rgba(16,185,129,0.3)] group-hover:shadow-[0_4px_20px_rgba(16,185,129,0.5)] transition-shadow">
                <span className="text-white text-lg font-black tracking-tighter">D</span>
              </div>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300">DIETORA</span>
            </Link>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-xs font-medium">
              AI-powered personalized diet planning tailored for Pakistani families. Healthy eating within your budget.
            </p>
            <p className="text-xs mt-6 text-slate-400 dark:text-slate-500 font-semibold tracking-wide uppercase">
              FYP Project — University of Agriculture Faisalabad
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-4 text-sm uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-3 text-sm font-medium">
              <li><Link to="/" className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Home</Link></li>
              <li><Link to="/about" className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">About</Link></li>
              <li><Link to="/faq" className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">FAQ</Link></li>
              <li><Link to="/register" className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Get Started</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-4 text-sm uppercase tracking-wider">Features</h4>
            <ul className="space-y-3 text-sm font-medium text-slate-600 dark:text-slate-400">
              <li><span className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-default">AI Meal Plans</span></li>
              <li><span className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-default">Budget Optimizer</span></li>
              <li><span className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-default">Grocery Lists</span></li>
              <li><span className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-default">Progress Tracking</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800/60 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-500">
            © {new Date().getFullYear()} DIETORA. All rights reserved.
          </p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-500 flex items-center gap-1.5">
            Built with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse-slow" /> for a healthier Pakistan.
          </p>
        </div>
      </div>
    </footer>
  )
}
