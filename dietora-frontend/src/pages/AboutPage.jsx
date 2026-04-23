import { Link } from 'react-router-dom'

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center text-white text-4xl font-black mx-auto mb-6 shadow-glow">D</div>
        <h1 className="font-display text-5xl font-bold text-slate-900 dark:text-white mb-4">About DIETORA</h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
          AI-powered personalized diet planning designed specifically for Pakistani families — factoring in health conditions, local foods, and daily budgets in PKR.
        </p>
      </div>

      {/* Project Info */}
      <div className="card mb-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="font-display font-bold text-xl text-slate-800 dark:text-white mb-4">The Project</h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
              DIETORA is a Final Year Project (FYP) developed at the Government College University Faisalabad (GCUF). It addresses a critical problem: the lack of affordable, culturally appropriate, and medically safe nutrition guidance for Pakistani families.
            </p>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              Most diet apps are designed for Western foods and ignore Pakistani dietary norms, local prices, and prevalent diseases like diabetes and hypertension that affect millions of Pakistanis.
            </p>
          </div>
          <div>
            <h2 className="font-display font-bold text-xl text-slate-800 dark:text-white mb-4">Our Solution</h2>
            <ul className="space-y-3">
              {[
                'AI generates 7-day meal plans using local Pakistani foods',
                'Filters meals based on diabetes, hypertension, and cardiac conditions',
                'Optimizes meal costs using real Faisalabad market prices in PKR',
                'Calculates BMR & TDEE using Mifflin-St Jeor formula',
                'Provides educational content on Pakistani nutrition',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <span className="w-5 h-5 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center text-emerald-600 text-xs flex-shrink-0 mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="card mb-8">
        <h2 className="font-display font-bold text-xl text-slate-800 dark:text-white mb-5">Technology Stack</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'React.js', desc: 'Frontend UI', icon: '⚛️' },
            { name: 'Node.js', desc: 'Backend API', icon: '🟩' },
            { name: 'MongoDB', desc: 'Database', icon: '🍃' },
            { name: 'Tailwind CSS', desc: 'Styling', icon: '🎨' },
            { name: 'Redux Toolkit', desc: 'State Mgmt', icon: '🔧' },
            { name: 'JWT Auth', desc: 'Security', icon: '🔐' },
            { name: 'Recharts', desc: 'Charts', icon: '📊' },
            { name: 'Vite', desc: 'Build Tool', icon: '⚡' },
          ].map((tech) => (
            <div key={tech.name} className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <span className="text-2xl">{tech.icon}</span>
              <p className="font-semibold text-slate-800 dark:text-white text-sm mt-2">{tech.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{tech.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div className="card mb-8">
        <h2 className="font-display font-bold text-xl text-slate-800 dark:text-white mb-5">Project Details</h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          {[
            { label: 'Institution', value: 'University of Agriculture Faisalabad (UAF)' },
            { label: 'Department', value: 'Computer Science & Information Technology' },
            { label: 'Project Type', value: 'Final Year Project (FYP)' },
            { label: 'Year', value: '2024-2025' },
            { label: 'Scope', value: 'Faisalabad, Punjab, Pakistan' },
            { label: 'Target Users', value: 'Pakistani families with health conditions' },
          ].map((item) => (
            <div key={item.label} className="flex gap-3">
              <span className="text-slate-400 w-28 flex-shrink-0">{item.label}:</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <Link to="/register" className="btn-primary py-3 px-8 text-base">Get Started Free →</Link>
      </div>
    </div>
  )
}
