import { Link } from 'react-router-dom'
import { useUrdu } from '../context/UrduContext'

export default function AboutPage() {
  const { isUrdu } = useUrdu()
  const ur = (en, ur) => isUrdu ? ur : en

  const solutionItems = [
    { en: 'AI generates 7-day meal plans using local Pakistani foods', ur: 'AI مقامی پاکستانی کھانوں کا استعمال کرتے ہوئے ۷ روزہ کھانے کے منصوبے بناتا ہے' },
    { en: 'Filters meals based on diabetes, hypertension, and cardiac conditions', ur: 'ذیابطیس، ہائی بلڈ پریشر اور دل کی بیماری کی بنیاد پر کھانا فلٹر کرتا ہے' },
    { en: 'Optimizes meal costs using real Faisalabad market prices in PKR', ur: 'فیصل آباد کی اصل مارکیٹ قیمتوں پر مبنی PKR میں کھانے کی لاگت کو بہتر بناتا ہے' },
    { en: 'Calculates BMR & TDEE using Mifflin-St Jeor formula', ur: 'Mifflin-St Jeor فارمولے کا استعمال کرتے ہوئے BMR اور TDEE حساب کرتا ہے' },
    { en: 'Provides educational content on Pakistani nutrition', ur: 'پاکستانی غذائیت پر تعلیمی مواد فراہم کرتا ہے' },
  ]

  const techStack = [
    { name: 'React.js', descEn: 'Frontend UI', descUr: 'فرنٹ اینڈ UI', icon: '⚛️' },
    { name: 'Node.js', descEn: 'Backend API', descUr: 'بیک اینڈ API', icon: '🟩' },
    { name: 'MongoDB', descEn: 'Database', descUr: 'ڈیٹا بیس', icon: '🍃' },
    { name: 'Tailwind CSS', descEn: 'Styling', descUr: 'اسٹائلنگ', icon: '🎨' },
    { name: 'Redux Toolkit', descEn: 'State Mgmt', descUr: 'اسٹیٹ مینجمنٹ', icon: '🔧' },
    { name: 'JWT Auth', descEn: 'Security', descUr: 'سیکیورٹی', icon: '🔐' },
    { name: 'Recharts', descEn: 'Charts', descUr: 'چارٹس', icon: '📊' },
    { name: 'Vite', descEn: 'Build Tool', descUr: 'بلڈ ٹول', icon: '⚡' },
  ]

  const projectDetails = [
    { labelEn: 'Institution', labelUr: 'ادارہ', valueEn: 'Government College University Faisalabad (GCUF)', valueUr: 'گورنمنٹ کالج یونیورسٹی فیصل آباد (GCUF)' },
    { labelEn: 'Department', labelUr: 'شعبہ', valueEn: 'Computer Science', valueUr: 'کمپیوٹر سائنس' },
    { labelEn: 'Project Type', labelUr: 'منصوبے کی قسم', valueEn: 'Final Year Project (FYP)', valueUr: 'آخری سال کا منصوبہ (FYP)' },
    { labelEn: 'Year', labelUr: 'سال', valueEn: '2024-2025', valueUr: '۲۰۲۴-۲۰۲۵' },
    { labelEn: 'Scope', labelUr: 'دائرہ کار', valueEn: 'Faisalabad, Punjab, Pakistan', valueUr: 'فیصل آباد، پنجاب، پاکستان' },
    { labelEn: 'Target Users', labelUr: 'ہدف صارفین', valueEn: 'Pakistani families with health conditions', valueUr: 'صحت کے مسائل والے پاکستانی خاندان' },
  ]

  const teamMembers = [
    { name: 'Shahzad Hussain', roleEn: 'Backend & AI Integration', roleUr: 'بیک اینڈ اور AI', emoji: '💻', initials: 'SH' },
    { name: 'Zainab Saleem', roleEn: 'UI / UX & Frontend', roleUr: 'UI/UX اور فرنٹ اینڈ', emoji: '🎨', initials: 'ZS' },
    { name: 'Hanzla Faiz', roleEn: 'Full Stack Developer', roleUr: 'فل اسٹیک ڈویلپر', emoji: '🤖', initials: 'HF' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-16" style={isUrdu ? { fontFamily: "'Noto Nastaliq Urdu', serif" } : {}}>

      {/* ── Hero ─────────────────────────────────────── */}
      <div className="text-center mb-16">
        <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center text-white text-4xl font-black mx-auto mb-6 shadow-glow">D</div>
        <h1 className="font-display text-5xl font-bold text-slate-900 dark:text-white mb-4">
          {ur('About DIETORA', 'DIETORA کے بارے میں')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
          {ur(
            'AI-powered personalized diet planning designed specifically for Pakistani families — factoring in health conditions, local foods, and daily budgets in PKR.',
            'AI سے چلنے والی ذاتی غذائی منصوبہ بندی خاص طور پر پاکستانی خاندانوں کے لیے — صحت کی حالت، مقامی کھانے اور PKR میں روزانہ بجٹ کو مدنظر رکھتے ہوئے۔'
          )}
        </p>
      </div>

      {/* ── Project Info ──────────────────────────────── */}
      <div className="card mb-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="font-display font-bold text-xl text-slate-800 dark:text-white mb-4">
              {ur('The Project', 'منصوبہ')}
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
              {ur(
                'DIETORA is a Final Year Project (FYP) developed at the Government College University Faisalabad (GCUF). It addresses a critical problem: the lack of affordable, culturally appropriate, and medically safe nutrition guidance for Pakistani families.',
                'DIETORA گورنمنٹ کالج یونیورسٹی فیصل آباد (GCUF) میں تیار کردہ آخری سال کا منصوبہ ہے۔ یہ پاکستانی خاندانوں کے لیے سستی، ثقافتی طور پر مناسب اور طبی لحاظ سے محفوظ غذائی رہنمائی کی کمی کو حل کرتا ہے۔'
              )}
            </p>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              {ur(
                'Most diet apps are designed for Western foods and ignore Pakistani dietary norms, local prices, and prevalent diseases like diabetes and hypertension that affect millions of Pakistanis.',
                'زیادہ تر غذائی ایپس مغربی کھانوں کے لیے ڈیزائن کی گئی ہیں اور پاکستانی غذائی اصولوں، مقامی قیمتوں اور ذیابطیس و ہائی بلڈ پریشر جیسی عام بیماریوں کو نظرانداز کرتی ہیں۔'
              )}
            </p>
          </div>
          <div>
            <h2 className="font-display font-bold text-xl text-slate-800 dark:text-white mb-4">
              {ur('Our Solution', 'ہمارا حل')}
            </h2>
            <ul className="space-y-3">
              {solutionItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <span className="w-5 h-5 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center text-emerald-600 text-xs flex-shrink-0 mt-0.5">✓</span>
                  {isUrdu ? item.ur : item.en}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Team Members ──────────────────────────────── */}
      <div className="card mb-8">
        <h2 className="font-display font-bold text-xl text-slate-800 dark:text-white mb-2">
          {ur('Meet the Team', 'ٹیم سے ملیں')}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {ur(
            'DIETORA was built by a passionate team of Computer Science students at GCUF Faisalabad.',
            'DIETORA کو GCUF فیصل آباد کے کمپیوٹر سائنس کے طلباء کی ایک پرجوش ٹیم نے بنایا۔'
          )}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {teamMembers.map((member) => (
            <div key={member.name}
              className="flex flex-col items-center text-center p-5 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800 hover:shadow-md transition-shadow">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-500/20 mb-3">
                {member.initials}
              </div>
              <p className="font-display font-bold text-slate-800 dark:text-white text-base">{member.name}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                {isUrdu ? member.roleUr : member.roleEn}
              </p>
              <span className="text-2xl mt-2">{member.emoji}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-center">
          <p className="text-xs text-slate-400">
            {ur(
              '🎓 Final Year Project — Department of Computer Science, GCUF Faisalabad (2022-2026)',
              '🎓 آخری سال کا منصوبہ — شعبہ کمپیوٹر سائنس، GCUF فیصل آباد (۲۰۲۲-۲۰۲۶)'
            )}
          </p>
        </div>
      </div>

      {/* ── Tech Stack ────────────────────────────────── */}
      <div className="card mb-8">
        <h2 className="font-display font-bold text-xl text-slate-800 dark:text-white mb-5">
          {ur('Technology Stack', 'ٹیکنالوجی اسٹیک')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {techStack.map((tech) => (
            <div key={tech.name} className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <span className="text-2xl">{tech.icon}</span>
              <p className="font-semibold text-slate-800 dark:text-white text-sm mt-2">{tech.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{isUrdu ? tech.descUr : tech.descEn}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Project Details ───────────────────────────── */}
      <div className="card mb-8">
        <h2 className="font-display font-bold text-xl text-slate-800 dark:text-white mb-5">
          {ur('Project Details', 'منصوبے کی تفصیلات')}
        </h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          {projectDetails.map((item) => (
            <div key={item.labelEn} className="flex gap-3">
              <span className="text-slate-400 w-32 flex-shrink-0">{isUrdu ? item.labelUr : item.labelEn}:</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">{isUrdu ? item.valueUr : item.valueEn}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <Link to="/register" className="btn-primary py-3 px-8 text-base">
          {ur('Get Started Free →', '← مفت شروع کریں')}
        </Link>
      </div>
    </div>
  )
}
