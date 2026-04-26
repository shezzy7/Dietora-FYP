import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useUrdu } from '../context/UrduContext'
import { Lightbulb, Utensils, Hospital, Banknote, Lock, HelpCircle, Search } from 'lucide-react'

const FAQS = [
  {
    categoryEn: 'General', categoryUr: 'عمومی', icon: Lightbulb,
    items: [
      { qEn: 'What is DIETORA?', qUr: 'DIETORA کیا ہے؟', aEn: 'DIETORA is an AI-powered personalized diet planning app designed specifically for Pakistani families. It generates 7-day meal plans based on your health conditions, allergies, and daily budget in PKR — using local Pakistani foods from Faisalabad markets.', aUr: 'DIETORA ایک AI سے چلنے والی ذاتی غذائی منصوبہ بندی ایپ ہے جو خاص طور پر پاکستانی خاندانوں کے لیے ڈیزائن کی گئی ہے۔ یہ آپ کی صحت، الرجی اور روزانہ PKR بجٹ کی بنیاد پر ۷ روزہ کھانے کے منصوبے بناتی ہے۔' },
      { qEn: 'Is DIETORA free to use?', qUr: 'کیا DIETORA مفت ہے؟', aEn: 'Yes! DIETORA is completely free to use. Create an account, fill in your health profile, and start generating personalized meal plans immediately. There are no hidden charges.', aUr: 'جی ہاں! DIETORA مکمل طور پر مفت ہے۔ اکاؤنٹ بنائیں، صحت پروفائل بھریں اور فوری طور پر ذاتی کھانے کے منصوبے بنانا شروع کریں۔' },
      { qEn: 'Who is this app for?', qUr: 'یہ ایپ کس کے لیے ہے؟', aEn: 'DIETORA is designed for Pakistani families — especially those managing chronic conditions like diabetes, hypertension, or cardiac disease — who want to eat healthy within a tight daily budget using local Pakistani foods.', aUr: 'DIETORA پاکستانی خاندانوں کے لیے ہے — خاص طور پر وہ لوگ جو ذیابطیس، ہائی بلڈ پریشر یا دل کی بیماری کو کنٹرول کر رہے ہیں۔' },
      { qEn: 'Is this a medical app?', qUr: 'کیا یہ طبی ایپ ہے؟', aEn: 'DIETORA provides nutritional guidance based on medically-established dietary guidelines. However, it is NOT a substitute for professional medical advice. Always consult your doctor or registered dietitian for medical decisions.', aUr: 'DIETORA طبی لحاظ سے قائم شدہ غذائی رہنما اصولوں پر مبنی غذائی رہنمائی فراہم کرتا ہے۔ تاہم یہ پیشہ ور طبی مشورے کا متبادل نہیں ہے۔' },
    ],
  },
  {
    categoryEn: 'Meal Plans', categoryUr: 'کھانے کے منصوبے', icon: Utensils,
    items: [
      { qEn: 'How does the AI meal plan generator work?', qUr: 'AI کھانے کا منصوبہ ساز کیسے کام کرتا ہے؟', aEn: 'Our system selects meals from a database of local Pakistani foods, filtered by your health conditions and allergies. It then balances your calorie needs and daily budget to generate an optimized 7-day plan.', aUr: 'ہمارا نظام مقامی پاکستانی کھانوں کے ڈیٹا بیس سے کھانے منتخب کرتا ہے، آپ کی صحت اور الرجی کے مطابق فلٹر کرتا ہے پھر کیلوری کی ضرورت اور بجٹ کو متوازن کرتا ہے۔' },
      { qEn: 'Can I generate a new meal plan every week?', qUr: 'کیا میں ہر ہفتے نیا منصوبہ بنا سکتا ہوں؟', aEn: 'Yes! You can generate as many meal plans as you want. Each time, the AI will create a fresh plan tailored to your current health profile and budget settings.', aUr: 'جی ہاں! آپ جتنے چاہیں کھانے کے منصوبے بنا سکتے ہیں۔ ہر بار AI آپ کے موجودہ صحت پروفائل اور بجٹ کے مطابق نیا منصوبہ بنائے گا۔' },
      { qEn: 'What Pakistani foods are included?', qUr: 'کون سے پاکستانی کھانے شامل ہیں؟', aEn: 'The food database includes 30+ common Pakistani foods: Dal mash, masoor dal, chana, chicken karahi, sabzi, whole wheat roti, brown rice, eggs, dahi (yogurt), lassi, karela, palak, and more — all priced according to Faisalabad local market rates.', aUr: 'کھانے کے ڈیٹا بیس میں ۳۰+ عام پاکستانی کھانے شامل ہیں: دال ماش، مسور دال، چنا، مرغی کڑاہی، سبزی، گندم کی روٹی، براؤن چاول، انڈے، دہی، لسی، کریلا، پالک اور مزید۔' },
      { qEn: 'Can I override my budget for a specific plan?', qUr: 'کیا میں مخصوص منصوبے کے لیے بجٹ بدل سکتا ہوں؟', aEn: 'Yes! When generating a new meal plan, you can optionally set a different budget for that specific plan without changing your profile settings.', aUr: 'جی ہاں! نیا کھانے کا منصوبہ بناتے وقت، آپ اپنی پروفائل ترتیبات بدلے بغیر اس مخصوص منصوبے کے لیے مختلف بجٹ مقرر کر سکتے ہیں۔' },
    ],
  },
  {
    categoryEn: 'Health Profile', categoryUr: 'صحت پروفائل', icon: Hospital,
    items: [
      { qEn: 'What is BMI and how is it calculated?', qUr: 'BMI کیا ہے اور یہ کیسے حساب ہوتا ہے؟', aEn: 'BMI (Body Mass Index) = weight(kg) ÷ height(m)². Below 18.5 is underweight, 18.5–24.9 is normal, 25–29.9 is overweight, and 30+ is obese. DIETORA calculates it automatically from your weight and height.', aUr: 'BMI = وزن(کلو) ÷ قد(میٹر)²۔ ۱۸.۵ سے کم کم وزن، ۱۸.۵-۲۴.۹ نارمل، ۲۵-۲۹.۹ زیادہ وزن، اور ۳۰+ موٹاپا ہے۔' },
      { qEn: 'What is TDEE and how does it affect my meal plan?', qUr: 'TDEE کیا ہے اور یہ میرے منصوبے کو کیسے متاثر کرتا ہے؟', aEn: 'TDEE (Total Daily Energy Expenditure) is the total calories you burn per day. DIETORA uses your TDEE to set daily calorie targets in your meal plan so you eat the right amount for your goals.', aUr: 'TDEE وہ کل کیلوریز ہیں جو آپ روزانہ جلاتے ہیں۔ DIETORA آپ کے TDEE کو روزانہ کیلوری اہداف مقرر کرنے کے لیے استعمال کرتا ہے۔' },
      { qEn: 'How does disease filtering work?', qUr: 'بیماری فلٹرنگ کیسے کام کرتی ہے؟', aEn: 'When you select a health condition, DIETORA only includes foods marked as safe for that condition. Diabetic-safe foods have a low glycemic index, while hypertension-safe foods are low in sodium.', aUr: 'جب آپ صحت کی حالت منتخب کرتے ہیں تو DIETORA صرف اس حالت کے لیے محفوظ نشان زد کھانے شامل کرتا ہے۔' },
      { qEn: 'What happens if I have multiple conditions?', qUr: 'کیا ہوتا ہے اگر مجھے کئی بیماریاں ہوں؟', aEn: 'DIETORA applies all filters simultaneously. If you have both diabetes and hypertension, only foods safe for both conditions are included — giving you the strictest, safest recommendations.', aUr: 'DIETORA تمام فلٹر بیک وقت لاگو کرتا ہے۔ اگر آپ کو ذیابطیس اور ہائی بلڈ پریشر دونوں ہیں تو صرف وہ کھانے شامل ہوتے ہیں جو دونوں کے لیے محفوظ ہوں۔' },
    ],
  },
  {
    categoryEn: 'Budget & Grocery', categoryUr: 'بجٹ اور گروسری', icon: Banknote,
    items: [
      { qEn: 'What currency does DIETORA use?', qUr: 'DIETORA کون سی کرنسی استعمال کرتا ہے؟', aEn: 'DIETORA uses Pakistani Rupees (PKR/₨) for all pricing. Food prices are based on approximate Faisalabad local market rates.', aUr: 'DIETORA تمام قیمتوں کے لیے پاکستانی روپے (PKR/₨) استعمال کرتا ہے۔ کھانے کی قیمتیں فیصل آباد کی مقامی مارکیٹ کی تخمینی شرحوں پر مبنی ہیں۔' },
      { qEn: 'How does the grocery list work?', qUr: 'گروسری فہرست کیسے کام کرتی ہے؟', aEn: 'After generating a meal plan, DIETORA automatically creates a grouped grocery list of all ingredients needed for the week. You can check off items as you purchase them and track your spending in real time.', aUr: 'کھانے کا منصوبہ بنانے کے بعد DIETORA خودکار طور پر ہفتے کے لیے تمام ضروری اجزاء کی گروسری فہرست بناتا ہے۔' },
      { qEn: 'What does the Budget Optimizer do?', qUr: 'بجٹ آپٹیمائزر کیا کرتا ہے؟', aEn: 'The Budget Optimizer analyzes your current meal plan cost vs. your set daily budget. If you are over budget, it suggests cheaper alternative meals that still meet your nutritional needs.', aUr: 'بجٹ آپٹیمائزر آپ کے موجودہ کھانے کے منصوبے کی لاگت بمقابلہ آپ کے مقررہ روزانہ بجٹ کا تجزیہ کرتا ہے۔' },
      { qEn: 'What is a realistic daily food budget?', qUr: 'حقیقت پسندانہ روزانہ بجٹ کیا ہے؟', aEn: 'For a single person in Faisalabad: ₨200-350/day is budget-friendly (dal-based), ₨350-500/day is moderate (chicken 3-4x/week), ₨500-750/day is comfortable (varied diet).', aUr: 'فیصل آباد میں ایک شخص کے لیے: ₨۲۰۰-۳۵۰/دن بجٹ دوست (دال پر مبنی)، ₨۳۵۰-۵۰۰/دن معتدل، ₨۵۰۰-۷۵۰/دن آرام دہ ہے۔' },
    ],
  },
  {
    categoryEn: 'Account & Privacy', categoryUr: 'اکاؤنٹ اور رازداری', icon: Lock,
    items: [
      { qEn: 'Is my health data secure?', qUr: 'کیا میرا صحت ڈیٹا محفوظ ہے؟', aEn: 'Yes. Your health profile and personal data are stored securely. We use JWT authentication and encrypted connections. We do not sell or share your personal data with third parties.', aUr: 'جی ہاں۔ آپ کی صحت پروفائل اور ذاتی ڈیٹا محفوظ طریقے سے ذخیرہ کیا جاتا ہے۔ ہم JWT توثیق اور خفیہ کنکشن استعمال کرتے ہیں۔' },
      { qEn: 'Can I delete my account?', qUr: 'کیا میں اپنا اکاؤنٹ حذف کر سکتا ہوں؟', aEn: 'Yes! Go to Account Settings → Delete Account. This will permanently remove your account and all associated data.', aUr: 'جی ہاں! اکاؤنٹ ترتیبات → اکاؤنٹ حذف کریں پر جائیں۔ یہ آپ کا اکاؤنٹ اور تمام متعلقہ ڈیٹا مستقل طور پر حذف کر دے گا۔' },
      { qEn: 'Can I use DIETORA on my phone?', qUr: 'کیا میں موبائل پر DIETORA استعمال کر سکتا ہوں؟', aEn: 'Yes! DIETORA is fully responsive and works on all devices — mobile phones, tablets, and desktops. Open it in any modern browser on your phone for the best experience.', aUr: 'جی ہاں! DIETORA مکمل طور پر ریسپانسیو ہے اور تمام ڈیوائسز پر کام کرتا ہے — موبائل فون، ٹیبلیٹ اور ڈیسک ٹاپ۔' },
    ],
  },
]

function FaqItem({ qEn, qUr, aEn, aUr, isUrdu }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-all duration-200 ${open ? 'shadow-md' : ''}`}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
        <span className="font-medium text-slate-800 dark:text-white text-sm pr-4 leading-relaxed">
          {isUrdu ? qUr : qEn}
        </span>
        <span className={`flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 text-xs font-bold transition-transform duration-200 ${open ? 'rotate-45' : ''}`}>
          +
        </span>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-700/50">
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed pt-4">
            {isUrdu ? aUr : aEn}
          </p>
        </div>
      )}
    </div>
  )
}

export default function FaqPage() {
  const { isUrdu } = useUrdu()
  const [activeCategory, setActiveCategory] = useState('All')

  const ur = (en, ur) => isUrdu ? ur : en

  const allLabel = ur('All', 'سب')
  const categories = [allLabel, ...FAQS.map((f) => isUrdu ? f.categoryUr : f.categoryEn)]

  const filtered = activeCategory === allLabel
    ? FAQS
    : FAQS.filter((f) => (isUrdu ? f.categoryUr : f.categoryEn) === activeCategory)

  return (
    <div className="max-w-4xl mx-auto px-4 py-16" style={isUrdu ? { fontFamily: "'Noto Nastaliq Urdu', serif" } : {}}>
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-3xl flex items-center justify-center mx-auto mb-5">
          <HelpCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="font-display text-5xl font-bold text-slate-900 dark:text-white mb-4">
          {ur('Frequently Asked Questions', 'اکثر پوچھے جانے والے سوالات')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto">
          {ur(
            "Everything you need to know about DIETORA's meal planning, health features, and budget optimization.",
            'DIETORA کی کھانے کی منصوبہ بندی، صحت کی خصوصیات اور بجٹ آپٹیمائزیشن کے بارے میں سب کچھ۔'
          )}
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 justify-center mb-10">
        {categories.map((cat, i) => {
          const faqSection = FAQS[i - 1]
          return (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
                activeCategory === cat
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-400'
              }`}>
              {i === 0
                ? <><Search className="w-4 h-4 inline-block mr-1 -mt-0.5" />{cat}</>
                : faqSection
                  ? <><faqSection.icon className="w-4 h-4 inline-block mr-1 -mt-0.5" />{cat}</>
                  : cat
              }
            </button>
          )
        })}
      </div>

      {/* FAQ Sections */}
      <div className="space-y-10">
        {filtered.map((section) => (
          <div key={section.categoryEn}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl text-emerald-600"><section.icon className="w-6 h-6" /></span>
              <h2 className="font-display font-bold text-lg text-slate-800 dark:text-white">
                {isUrdu ? section.categoryUr : section.categoryEn}
              </h2>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700 ml-2" />
            </div>
            <div className="space-y-3">
              {section.items.map((item) => (
                <FaqItem key={item.qEn} {...item} isUrdu={isUrdu} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Still have questions */}
      <div className="mt-16 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-center">
        <h2 className="font-display font-bold text-2xl text-white mb-2">
          {ur('Still have questions?', 'اب بھی سوالات ہیں؟')}
        </h2>
        <p className="text-emerald-100 mb-6 text-sm">
          {ur('Chat with our AI nutrition assistant or send us feedback directly.', 'ہمارے AI غذائی اسسٹنٹ سے چیٹ کریں یا ہمیں براہ راست رائے بھیجیں۔')}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/register" className="bg-white text-emerald-700 font-bold py-2.5 px-6 rounded-xl hover:bg-emerald-50 transition-colors text-sm">
            {ur('Get Started Free', 'مفت شروع کریں')}
          </Link>
          <Link to="/login" className="border-2 border-white text-white font-bold py-2.5 px-6 rounded-xl hover:bg-white/10 transition-colors text-sm">
            {ur('Login & Ask Chatbot', 'لاگ ان کریں اور چیٹ بوٹ سے پوچھیں')}
          </Link>
        </div>
      </div>
    </div>
  )
}
