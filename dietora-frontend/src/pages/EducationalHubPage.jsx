// src/pages/EducationalHubPage.jsx
import { useState } from 'react'
import { useUrdu } from '../context/UrduContext'
import { Droplets, Heart, Activity, Microscope, Dumbbell, Scale, BookOpen, Search, ArrowLeft, ShieldAlert, Globe, ExternalLink } from 'lucide-react'

const ARTICLES = [
  {
    id: 1,
    titleEn: 'Managing Diabetes Through Pakistani Diet',
    titleUr: 'پاکستانی خوراک سے ذیابطیس کا انتظام',
    category: 'Diabetes', categoryUr: 'ذیابطیس',
    icon: Droplets, readTime: '5 min', color: 'blue',
    summaryEn: 'Diabetes is one of the most common chronic conditions in Pakistan. Diet plays a critical role in blood sugar management.',
    summaryUr: 'ذیابطیس پاکستان میں سب سے عام دائمی بیماریوں میں سے ہے۔ خوراک خون میں شکر کنٹرول میں اہم کردار ادا کرتی ہے۔',
    content: [
      { headingEn: 'Understanding Glycemic Index', headingUr: 'گلیسیمک انڈیکس کو سمجھنا', bodyEn: 'The glycemic index (GI) measures how quickly a food raises blood sugar. Low-GI foods (below 55) are ideal for diabetics. Whole wheat roti has a lower GI than white bread, and brown rice is better than polished white rice.', bodyUr: 'گلیسیمک انڈیکس ناپتا ہے کہ کھانا کتنی جلدی خون میں شکر بڑھاتا ہے۔ کم GI کھانے ذیابطیس کے مریضوں کے لیے بہترین ہیں۔' },
      { headingEn: 'Best Pakistani Foods for Diabetics', headingUr: 'ذیابطیسی مریضوں کے لیے بہترین پاکستانی کھانے', bodyEn: 'Karela (bitter gourd) lowers blood sugar. Methi (fenugreek) seeds improve insulin sensitivity. Dal (lentils) are high in fiber with a low glycemic index. Palak and leafy vegetables are excellent for diabetics.', bodyUr: 'کریلا خون میں شکر کم کرتا ہے۔ میتھی کے بیج انسولین حساسیت بہتر کرتے ہیں۔ دال میں زیادہ فائبر اور کم GI ہے۔' },
      { headingEn: 'Foods to Avoid', headingUr: 'پرہیز کریں', bodyEn: 'White sugar, sugary drinks, refined flour (maida), biryani with excessive rice, mithai (sweets), and deep-fried foods should be limited or avoided.', bodyUr: 'سفید چینی، میٹھے مشروبات، میدہ، زیادہ چاول والی بریانی، مٹھائی اور تلی ہوئی اشیاء سے پرہیز کریں۔' },
      { headingEn: 'Meal Timing Tips', headingUr: 'کھانے کے وقت کے نکات', bodyEn: 'Eat smaller, more frequent meals to maintain stable blood sugar. Never skip breakfast. Avoid eating large amounts of carbohydrates at one sitting.', bodyUr: 'خون میں شکر مستحکم رکھنے کے لیے چھوٹے چھوٹے کھانے کھائیں۔ ناشتہ کبھی نہ چھوڑیں۔' },
    ],
  },
  {
    id: 2,
    titleEn: 'Hypertension Diet Guide for Pakistanis',
    titleUr: 'پاکستانیوں کے لیے ہائی بلڈ پریشر غذائی رہنمائی',
    category: 'Hypertension', categoryUr: 'ہائی بلڈ پریشر',
    icon: Heart, readTime: '6 min', color: 'red',
    summaryEn: 'High blood pressure affects 1 in 3 Pakistani adults. The right diet can reduce systolic BP by 8-14 mmHg without medication.',
    summaryUr: 'ہائی بلڈ پریشر ہر ۳ میں سے ۱ پاکستانی بالغ کو متاثر کرتا ہے۔ صحیح خوراک دوا کے بغیر بلڈ پریشر کم کر سکتی ہے۔',
    content: [
      { headingEn: 'The DASH Diet', headingUr: 'DASH غذا', bodyEn: 'The DASH diet is proven to lower blood pressure. It emphasizes fruits, vegetables, whole grains, and low-fat dairy while reducing sodium and saturated fats.', bodyUr: 'DASH غذا بلڈ پریشر کم کرنے میں مؤثر ہے۔ اس میں پھل، سبزیاں، سارا اناج اور کم چکنائی والی دودھ کی مصنوعات شامل ہیں۔' },
      { headingEn: 'Sodium Reduction', headingUr: 'نمک کم کرنا', bodyEn: 'Use less salt when cooking, avoid achaar (pickles), and use spices like zeera and haldi for flavor instead of extra salt.', bodyUr: 'کھانا پکاتے وقت کم نمک استعمال کریں، اچار سے پرہیز کریں اور ذائقے کے لیے زیرہ اور ہلدی استعمال کریں۔' },
    ],
  },
  {
    id: 3,
    titleEn: 'Heart-Healthy Eating in Pakistan',
    titleUr: 'پاکستان میں دل کے لیے صحت مند کھانا',
    category: 'Cardiac Health', categoryUr: 'دل کی صحت',
    icon: Activity, readTime: '7 min', color: 'purple',
    summaryEn: 'Cardiovascular disease is the leading cause of death in Pakistan. A heart-healthy diet can reduce your risk by up to 80%.',
    summaryUr: 'پاکستان میں دل کی بیماری موت کی سب سے بڑی وجہ ہے۔ دل کے لیے صحت مند خوراک خطرہ ۸۰ فیصد تک کم کر سکتی ہے۔',
    content: [
      { headingEn: 'Healthy vs Unhealthy Fats', headingUr: 'صحت مند بمقابلہ غیر صحت مند چکنائی', bodyEn: 'Saturated fats in ghee and red meat raise LDL cholesterol. Replace with unsaturated fats from olive oil, nuts, and fish.', bodyUr: 'گھی اور سرخ گوشت میں سیچوریٹڈ چکنائی LDL کولیسٹرول بڑھاتی ہے۔ زیتون کا تیل، گری دار میوے اور مچھلی سے بدلیں۔' },
      { headingEn: 'Best Heart Foods', headingUr: 'دل کے لیے بہترین کھانے', bodyEn: 'Fish (machli) rich in omega-3, walnuts and almonds reduce bad cholesterol, whole oats lower LDL by 5-10%.', bodyUr: 'اومیگا ۳ سے بھرپور مچھلی، اخروٹ اور بادام خراب کولیسٹرول کم کرتے ہیں، جئی LDL ۵-۱۰٪ کم کرتا ہے۔' },
    ],
  },
  {
    id: 4,
    titleEn: 'Understanding BMR and TDEE',
    titleUr: 'BMR اور TDEE کو سمجھنا',
    category: 'Nutrition Science', categoryUr: 'غذائی سائنس',
    icon: Microscope, readTime: '4 min', color: 'emerald',
    summaryEn: 'BMR and TDEE are the foundation of all calorie-based nutrition planning.',
    summaryUr: 'BMR اور TDEE تمام کیلوری پر مبنی غذائی منصوبہ بندی کی بنیاد ہیں۔',
    content: [
      { headingEn: 'What is BMR?', headingUr: 'BMR کیا ہے؟', bodyEn: 'Basal Metabolic Rate (BMR) is the number of calories your body burns at complete rest to maintain basic functions like breathing and circulation.', bodyUr: 'بیسل میٹابولک ریٹ (BMR) وہ کیلوریز ہیں جو آپ کا جسم مکمل آرام میں سانس لینے اور گردش جیسی بنیادی افعال کے لیے جلاتا ہے۔' },
      { headingEn: 'What is TDEE?', headingUr: 'TDEE کیا ہے؟', bodyEn: 'Total Daily Energy Expenditure (TDEE) = BMR × Activity Multiplier. This is how many calories you actually need per day.', bodyUr: 'کل روزانہ توانائی خرچ (TDEE) = BMR × سرگرمی ضرب۔ یہ وہ کیلوریز ہیں جو آپ کو روزانہ درکار ہیں۔' },
    ],
  },
  {
    id: 5,
    titleEn: 'Protein Sources in Pakistani Diet',
    titleUr: 'پاکستانی خوراک میں پروٹین کے ذرائع',
    category: 'Macronutrients', categoryUr: 'میکرونیوٹرینٹس',
    icon: Dumbbell, readTime: '5 min', color: 'amber',
    summaryEn: 'Protein is essential for muscle building, immune function, and satiety.',
    summaryUr: 'پروٹین پٹھوں کی تعمیر، مدافعتی نظام اور پیٹ بھرنے کے لیے ضروری ہے۔',
    content: [
      { headingEn: 'Animal Protein Sources', headingUr: 'حیوانی پروٹین کے ذرائع', bodyEn: 'Chicken: 100g gives 31g protein. Eggs: 1 egg gives 6g protein. Fish: 100g gives 22g protein, heart-healthy.', bodyUr: 'مرغی: ۱۰۰ گرام سے ۳۱ گرام پروٹین۔ انڈا: ۱ انڈے سے ۶ گرام پروٹین۔ مچھلی: ۱۰۰ گرام سے ۲۲ گرام پروٹین۔' },
      { headingEn: 'Plant Protein Sources', headingUr: 'نباتاتی پروٹین کے ذرائع', bodyEn: 'Masoor Dal: 1 cup = 18g protein. Chana: 1 cup = 15g protein. Mung beans: 1 cup = 14g protein.', bodyUr: 'مسور دال: ۱ کپ = ۱۸ گرام پروٹین۔ چنا: ۱ کپ = ۱۵ گرام پروٹین۔ مونگ: ۱ کپ = ۱۴ گرام پروٹین۔' },
    ],
  },
  {
    id: 6,
    titleEn: 'Healthy Weight Management for Pakistanis',
    titleUr: 'پاکستانیوں کے لیے صحت مند وزن کا انتظام',
    category: 'Weight Management', categoryUr: 'وزن کا انتظام',
    icon: Scale, readTime: '6 min', color: 'teal',
    summaryEn: 'Obesity rates in Pakistan have doubled in 20 years. Sustainable weight management requires a balanced approach.',
    summaryUr: 'پاکستان میں موٹاپے کی شرح ۲۰ سالوں میں دوگنی ہو گئی ہے۔ پائیدار وزن کے انتظام کے لیے متوازن نقطہ نظر درکار ہے۔',
    content: [
      { headingEn: 'Why Crash Diets Fail', headingUr: 'کریش ڈائیٹ کیوں ناکام ہوتی ہے', bodyEn: 'Extreme calorie restriction causes muscle loss, slows metabolism, and leads to rebound weight gain. Aim for gradual 0.5-1 kg per week loss.', bodyUr: 'انتہائی کیلوری پابندی پٹھوں کی کمی، میٹابولزم کی سست روی اور دوبارہ وزن بڑھنے کا سبب بنتی ہے۔' },
      { headingEn: 'Portion Control', headingUr: 'مقدار کا کنٹرول', bodyEn: 'Use a smaller plate, eat roti instead of naan, have dal + 2 rotis instead of biryani for lunch.', bodyUr: 'چھوٹی پلیٹ استعمال کریں، نان کی بجائے روٹی کھائیں، دوپہر کو بریانی کی بجائے دال + ۲ روٹی کھائیں۔' },
    ],
  },
]

const colorMap = {
  blue:    { badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',       border: 'border-blue-200 dark:border-blue-800' },
  red:     { badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',           border: 'border-red-200 dark:border-red-800' },
  purple:  { badge: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
  emerald: { badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
  amber:   { badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',   border: 'border-amber-200 dark:border-amber-800' },
  teal:    { badge: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400',       border: 'border-teal-200 dark:border-teal-800' },
}

const WHO_NIH_GUIDELINES = [
  {
    source: 'WHO', color: 'blue',
    titleEn: 'Healthy Diet — Key Facts', titleUr: 'صحت مند خوراک — اہم حقائق',
    guidelines: [
      { en: 'Adults should consume at least 400g (5 portions) of fruits and vegetables per day.', ur: 'بالغوں کو روزانہ کم از کم ۴۰۰ گرام (۵ حصے) پھل اور سبزیاں کھانی چاہئیں۔' },
      { en: 'Free sugars should make up less than 10% of total energy intake (~50g/day).', ur: 'چینی کل توانائی کے ۱۰٪ سے کم ہونی چاہیے (تقریباً ۵۰ گرام/دن)۔' },
      { en: 'Salt intake should be less than 5g (about 1 teaspoon) per day.', ur: 'نمک کا استعمال روزانہ ۵ گرام (ایک چائے کا چمچ) سے کم ہونا چاہیے۔' },
      { en: 'Fiber intake should be at least 25g per day.', ur: 'فائبر کا استعمال روزانہ کم از کم ۲۵ گرام ہونا چاہیے۔' },
    ],
    link: 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet',
    linkLabel: 'WHO Healthy Diet Fact Sheet',
  },
  {
    source: 'NIH', color: 'emerald',
    titleEn: 'Dietary Guidelines — Evidence Base', titleUr: 'غذائی رہنما اصول — شواہد',
    guidelines: [
      { en: 'Protein: 0.8g per kg of body weight per day for sedentary adults.', ur: 'پروٹین: غیر فعال بالغوں کے لیے جسمانی وزن کے فی کلوگرام ۰.۸ گرام۔' },
      { en: 'Sodium: Less than 2,300mg per day for all adults.', ur: 'سوڈیم: تمام بالغوں کے لیے روزانہ ۲۳۰۰ ملی گرام سے کم۔' },
      { en: 'Iron: 8mg/day for men; 18mg/day for women.', ur: 'آئرن: مردوں کے لیے ۸ ملی گرام/دن؛ خواتین کے لیے ۱۸ ملی گرام/دن۔' },
    ],
    link: 'https://www.niddk.nih.gov/health-information/weight-management/healthy-eating-physical-activity-for-life',
    linkLabel: 'NIH Healthy Eating Reference',
  },
  {
    source: 'WHO', color: 'purple',
    titleEn: 'Physical Activity Recommendations', titleUr: 'جسمانی سرگرمی کی سفارشات',
    guidelines: [
      { en: '18–64 year olds should do 150–300 minutes of moderate aerobic activity per week.', ur: '۱۸-۶۴ سال کی عمر کے افراد ہفتے میں ۱۵۰-۳۰۰ منٹ معتدل ایروبک ورزش کریں۔' },
      { en: 'Even 10-minute walks after meals help control blood sugar.', ur: 'کھانے کے بعد صرف ۱۰ منٹ کی چہل قدمی بھی خون میں شکر کنٹرول میں مدد کرتی ہے۔' },
    ],
    link: 'https://www.who.int/news-room/fact-sheets/detail/physical-activity',
    linkLabel: 'WHO Physical Activity Fact Sheet',
  },
]

const SOURCE_COLORS = {
  blue:    { bg: 'bg-blue-50 dark:bg-blue-900/20',     border: 'border-blue-200 dark:border-blue-800',     badge: 'bg-blue-600 text-white',    dot: 'bg-blue-500' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', badge: 'bg-emerald-600 text-white',  dot: 'bg-emerald-500' },
  purple:  { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', badge: 'bg-purple-600 text-white',   dot: 'bg-purple-500' },
}

function WHONIHSection({ isUrdu }) {
  return (
    <div className="mt-10">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
          <Globe className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="font-display font-bold text-slate-800 dark:text-white text-lg">
            WHO & NIH {isUrdu ? 'غذائی رہنما اصول' : 'Dietary Guidelines'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isUrdu
              ? 'DIETORA کے کھانے کی منصوبہ بندی میں سائنسی طور پر تصدیق شدہ غذائی معیارات'
              : 'Scientifically verified nutrition standards integrated into DIETORA\'s meal planning engine'}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {WHO_NIH_GUIDELINES.map((g, i) => {
          const c = SOURCE_COLORS[g.color]
          return (
            <div key={i} className={`rounded-2xl border-2 p-5 ${c.bg} ${c.border}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${c.badge}`}>{g.source}</span>
                <h3 className="font-display font-bold text-sm text-slate-800 dark:text-white leading-tight">
                  {isUrdu ? g.titleUr : g.titleEn}
                </h3>
              </div>
              <ul className="space-y-2 mb-4">
                {g.guidelines.map((line, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${c.dot}`} />
                    {isUrdu ? line.ur : line.en}
                  </li>
                ))}
              </ul>
              <a href={g.link} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                <ExternalLink className="w-3 h-3" /> {g.linkLabel}
              </a>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function EducationalHubPage() {
  const { isUrdu } = useUrdu()
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')

  const filtered = ARTICLES.filter(a =>
    (isUrdu ? a.titleUr : a.titleEn).toLowerCase().includes(search.toLowerCase()) ||
    (isUrdu ? a.categoryUr : a.category).toLowerCase().includes(search.toLowerCase())
  )

  if (selected) {
    const colors = colorMap[selected.color] || colorMap.emerald
    return (
      <div className="max-w-3xl mx-auto animate-fade-in" style={isUrdu ? { fontFamily: "'Noto Nastaliq Urdu', serif" } : {}}>
        <button onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 mb-6 text-sm font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> {isUrdu ? 'مضامین پر واپس' : 'Back to Articles'}
        </button>
        <div className="card">
          <div className="flex items-start gap-4 mb-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-${selected.color}-100 dark:bg-${selected.color}-900/40 text-${selected.color}-600`}>
              {(() => { const Icon = selected.icon; return <Icon className="w-8 h-8" /> })()}
            </div>
            <div>
              <span className={`badge ${colors.badge} mb-2`}>{isUrdu ? selected.categoryUr : selected.category}</span>
              <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-white">
                {isUrdu ? selected.titleUr : selected.titleEn}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                {isUrdu ? selected.summaryUr : selected.summaryEn}
              </p>
              <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> {selected.readTime} {isUrdu ? 'پڑھنے کا وقت' : 'read'}
              </p>
            </div>
          </div>
          <div className="prose max-w-none space-y-6">
            {selected.content.map((section, i) => (
              <div key={i}>
                <h2 className="font-display font-bold text-lg text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/40 rounded-md flex items-center justify-center text-xs font-bold text-emerald-600">{i + 1}</span>
                  {isUrdu ? section.headingUr : section.headingEn}
                </h2>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                  {isUrdu ? section.bodyUr : section.bodyEn}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 flex gap-3">
            <ShieldAlert className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium leading-relaxed">
              {isUrdu
                ? 'طبی دستبرداری: یہ مضمون صرف تعلیمی مقاصد کے لیے ہے۔ اہم غذائی تبدیلیاں کرنے سے پہلے ہمیشہ ڈاکٹر سے مشورہ کریں۔'
                : 'Medical Disclaimer: This article is for educational purposes only. Always consult a qualified healthcare provider before making significant dietary changes.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in" style={isUrdu ? { fontFamily: "'Noto Nastaliq Urdu', serif" } : {}}>
      <div className="page-header">
        <h1 className="page-title">{isUrdu ? 'تعلیمی مرکز' : 'Educational Hub'}</h1>
        <p className="page-subtitle">
          {isUrdu
            ? 'غذائیت، بیماری کے انتظام اور صحت مند پاکستانی کھانے کے بارے میں جانیں'
            : 'Learn about nutrition, disease management, and healthy Pakistani cooking'}
        </p>
      </div>

      <div className="mb-6 max-w-md">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={isUrdu ? 'مضامین تلاش کریں...' : 'Search articles...'}
            className="input-field pl-10" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((article) => {
          const colors = colorMap[article.color] || colorMap.emerald
          return (
            <div key={article.id} onClick={() => setSelected(article)}
              className={`card-hover cursor-pointer border-2 ${colors.border}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${article.color}-100 dark:bg-${article.color}-900/40 text-${article.color}-600`}>
                  {(() => { const Icon = article.icon; return <Icon className="w-5 h-5" /> })()}
                </div>
                <span className={`badge ${colors.badge} text-xs`}>
                  {isUrdu ? article.categoryUr : article.category}
                </span>
              </div>
              <h3 className="font-display font-bold text-slate-800 dark:text-white mb-2 leading-tight">
                {isUrdu ? article.titleUr : article.titleEn}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-3">
                {isUrdu ? article.summaryUr : article.summaryEn}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" /> {article.readTime} {isUrdu ? 'پڑھنا' : 'read'}
                </span>
                <span className="text-emerald-600 text-xs font-semibold">
                  {isUrdu ? 'مضمون پڑھیں ←' : 'Read Article →'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 card border-dashed border-2 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-base">
            {isUrdu ? `"${search}" کے لیے کوئی مضمون نہیں ملا` : `No articles found for "${search}"`}
          </p>
        </div>
      )}

      <WHONIHSection isUrdu={isUrdu} />
    </div>
  )
}
