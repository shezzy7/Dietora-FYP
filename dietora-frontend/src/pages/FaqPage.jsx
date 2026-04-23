import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Lightbulb, Utensils, Hospital, Banknote, Lock, HelpCircle, Search } from 'lucide-react'

const FAQS = [
  {
    category: 'General',
    icon: Lightbulb,
    items: [
      {
        q: 'What is DIETORA?',
        a: 'DIETORA is an AI-powered personalized diet planning app designed specifically for Pakistani families. It generates 7-day meal plans based on your health conditions (diabetes, hypertension, cardiac), allergies, and daily budget in PKR — using local Pakistani foods from Faisalabad markets.',
      },
      {
        q: 'Is DIETORA free to use?',
        a: 'Yes! DIETORA is completely free to use. Create an account, fill in your health profile, and start generating personalized meal plans immediately. There are no hidden charges.',
      },
      {
        q: 'Who is this app for?',
        a: 'DIETORA is designed for Pakistani families — especially those managing chronic conditions like diabetes, hypertension, or cardiac disease — who want to eat healthy within a tight daily budget using local Pakistani foods.',
      },
      {
        q: 'Is this a medical app?',
        a: 'DIETORA provides nutritional guidance based on medically-established dietary guidelines. However, it is NOT a substitute for professional medical advice. Always consult your doctor or registered dietitian for medical decisions.',
      },
    ],
  },
  {
    category: 'Meal Plans',
    icon: Utensils,
    items: [
      {
        q: 'How does the AI meal plan generator work?',
        a: 'Our system selects meals from a database of local Pakistani foods, filtered by your health conditions and allergies. It then balances your calorie needs (calculated from your BMR/TDEE using the Mifflin-St Jeor formula) and daily budget to generate an optimized 7-day plan.',
      },
      {
        q: 'Can I generate a new meal plan every week?',
        a: 'Yes! You can generate as many meal plans as you want. Each time, the AI will create a fresh plan tailored to your current health profile and budget settings.',
      },
      {
        q: 'What Pakistani foods are included?',
        a: 'The food database includes 30+ common Pakistani foods: Dal mash, masoor dal, chana, chicken karahi, sabzi, whole wheat roti, brown rice, eggs, dahi (yogurt), lassi, karela, palak, tomatoes, fruits, and more — all priced according to Faisalabad local market rates.',
      },
      {
        q: 'Can I override my budget for a specific plan?',
        a: 'Yes! When generating a new meal plan, you can optionally set a different budget for that specific plan without changing your profile settings.',
      },
    ],
  },
  {
    category: 'Health Profile',
    icon: Hospital,
    items: [
      {
        q: 'What is BMI and how is it calculated?',
        a: 'BMI (Body Mass Index) = weight(kg) ÷ height(m)². It classifies weight status: below 18.5 is underweight, 18.5–24.9 is normal, 25–29.9 is overweight, and 30+ is obese. DIETORA calculates it automatically from your weight and height.',
      },
      {
        q: 'What is TDEE and how does it affect my meal plan?',
        a: 'TDEE (Total Daily Energy Expenditure) is the total calories you burn per day, calculated using your BMR × activity level multiplier. DIETORA uses your TDEE to set daily calorie targets in your meal plan so you eat the right amount for your goals.',
      },
      {
        q: 'How does disease filtering work?',
        a: 'When you select a health condition (diabetes, hypertension, or cardiac), DIETORA only includes foods marked as safe for that condition. For example, diabetic-safe foods have a low glycemic index, while hypertension-safe foods are low in sodium.',
      },
      {
        q: 'What happens if I have multiple conditions?',
        a: 'DIETORA applies all filters simultaneously. If you have both diabetes and hypertension, only foods safe for both conditions are included in your meal plan — giving you the strictest, safest recommendations.',
      },
    ],
  },
  {
    category: 'Budget & Grocery',
    icon: Banknote,
    items: [
      {
        q: 'What currency does DIETORA use?',
        a: 'DIETORA uses Pakistani Rupees (PKR/₨) for all pricing. Food prices are based on approximate Faisalabad local market rates as of 2024-2025.',
      },
      {
        q: 'How does the grocery list work?',
        a: 'After generating a meal plan, DIETORA automatically creates a grouped grocery list of all ingredients needed for the week. You can check off items as you purchase them and track your spending in real time.',
      },
      {
        q: 'What does the Budget Optimizer do?',
        a: 'The Budget Optimizer analyzes your current meal plan cost vs. your set daily budget. If you are over budget, it suggests cheaper alternative meals that still meet your nutritional needs and health requirements.',
      },
      {
        q: 'What is a realistic daily food budget?',
        a: 'For a single person in Faisalabad: ₨200-350/day is budget-friendly (dal-based), ₨350-500/day is moderate (includes chicken 3-4x/week), ₨500-750/day is comfortable (varied diet with meat, dairy, fruits). Families should multiply accordingly.',
      },
    ],
  },
  {
    category: 'Account & Privacy',
    icon: Lock,
    items: [
      {
        q: 'Is my health data secure?',
        a: 'Yes. Your health profile and personal data are stored securely in our database. We use JWT authentication and encrypted connections. We do not sell or share your personal data with third parties.',
      },
      {
        q: 'Can I delete my account?',
        a: 'Currently, please contact us via the Feedback page to request account deletion. We are working on an in-app self-service deletion option.',
      },
      {
        q: 'Can I use DIETORA on my phone?',
        a: 'Yes! DIETORA is fully responsive and works on all devices — mobile phones, tablets, and desktops. Open it in any modern browser on your phone for the best experience.',
      },
    ],
  },
]

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-all duration-200 ${open ? 'shadow-md' : ''}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
      >
        <span className="font-medium text-slate-800 dark:text-white text-sm pr-4 leading-relaxed">{q}</span>
        <span className={`flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 text-xs font-bold transition-transform duration-200 ${open ? 'rotate-45' : ''}`}>
          +
        </span>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-700/50">
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed pt-4">{a}</p>
        </div>
      )}
    </div>
  )
}

export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const categories = ['All', ...FAQS.map((f) => f.category)]

  const filtered = activeCategory === 'All' ? FAQS : FAQS.filter((f) => f.category === activeCategory)

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-3xl flex items-center justify-center mx-auto mb-5">
          <HelpCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="font-display text-5xl font-bold text-slate-900 dark:text-white mb-4">Frequently Asked Questions</h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto">
          Everything you need to know about DIETORA's meal planning, health features, and budget optimization.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 justify-center mb-10">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
              activeCategory === cat
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-400'
            }`}
          >
            {FAQS.find((f) => f.category === cat) ? (() => {
              const Icon = FAQS.find((f) => f.category === cat).icon
              return <Icon className="w-4 h-4 inline-block mr-1 -mt-0.5" />
            })() : <Search className="w-4 h-4 inline-block mr-1 -mt-0.5" />} {cat}
          </button>
        ))}
      </div>

      {/* FAQ Sections */}
      <div className="space-y-10">
        {filtered.map((section) => (
          <div key={section.category}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl text-emerald-600"><section.icon className="w-6 h-6" /></span>
              <h2 className="font-display font-bold text-lg text-slate-800 dark:text-white">{section.category}</h2>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700 ml-2" />
            </div>
            <div className="space-y-3">
              {section.items.map((item) => (
                <FaqItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Still have questions */}
      <div className="mt-16 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-center">
        <h2 className="font-display font-bold text-2xl text-white mb-2">Still have questions?</h2>
        <p className="text-emerald-100 mb-6 text-sm">
          Chat with our AI nutrition assistant or send us feedback directly.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/register" className="bg-white text-emerald-700 font-bold py-2.5 px-6 rounded-xl hover:bg-emerald-50 transition-colors text-sm">
            Get Started Free
          </Link>
          <Link to="/login" className="border-2 border-white text-white font-bold py-2.5 px-6 rounded-xl hover:bg-white/10 transition-colors text-sm">
            Login & Ask Chatbot
          </Link>
        </div>
      </div>
    </div>
  )
}
