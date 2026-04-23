import { useState } from 'react'
import { Droplets, Heart, Activity, Microscope, Dumbbell, Scale, BookOpen, Search, ArrowLeft, ShieldAlert } from 'lucide-react'

const ARTICLES = [
  {
    id: 1,
    title: 'Managing Diabetes Through Pakistani Diet',
    category: 'Diabetes',
    icon: Droplets,
    readTime: '5 min',
    color: 'blue',
    summary: 'Diabetes is one of the most common chronic conditions in Pakistan, affecting millions. Diet plays a critical role in blood sugar management.',
    content: [
      { heading: 'Understanding Glycemic Index', body: 'The glycemic index (GI) measures how quickly a food raises blood sugar. Low-GI foods (below 55) are ideal for diabetics. In Pakistani cuisine, whole wheat roti has a lower GI than white bread, and brown rice is better than polished white rice.' },
      { heading: 'Best Pakistani Foods for Diabetics', body: 'Karela (bitter gourd) is a traditional remedy known to lower blood sugar. Methi (fenugreek) seeds help improve insulin sensitivity. Dal (lentils) are high in fiber and protein with a low glycemic index. Palak (spinach) and other leafy vegetables are excellent for diabetics.' },
      { heading: 'Foods to Avoid', body: 'White sugar, sugary drinks, refined flour (maida), biryani with excessive rice, mithai (sweets), and deep-fried foods like samosas should be limited or avoided.' },
      { heading: 'Meal Timing Tips', body: 'Eat smaller, more frequent meals to maintain stable blood sugar. Never skip breakfast. Avoid eating large amounts of carbohydrates at one sitting. Drink water before meals to reduce portion size.' },
      { heading: 'Sample Diabetic-Friendly Pakistani Menu', body: 'Breakfast: Anda (egg) with 1-2 whole wheat rotis + chai without sugar. Lunch: Masoor dal + 2 chapati + salad. Dinner: Grilled chicken or fish + sabzi (vegetable) + 1 chapati. Snack: Handful of nuts or a small fruit.' },
    ],
  },
  {
    id: 2,
    title: 'Hypertension Diet Guide for Pakistanis',
    category: 'Hypertension',
    icon: Heart,
    readTime: '6 min',
    color: 'red',
    summary: 'High blood pressure (BP) affects 1 in 3 Pakistani adults. The right diet can reduce systolic BP by 8-14 mmHg without medication.',
    content: [
      { heading: 'The DASH Diet for Hypertension', body: 'The DASH (Dietary Approaches to Stop Hypertension) diet is proven to lower blood pressure. It emphasizes fruits, vegetables, whole grains, and low-fat dairy while reducing sodium and saturated fats.' },
      { heading: 'Sodium Reduction in Pakistani Cooking', body: 'Pakistani cuisine is traditionally high in salt. To reduce sodium: use less salt when cooking, avoid achaar (pickles), soy sauce, and processed meats. Use spices like zeera (cumin), haldi (turmeric), and fresh herbs for flavor instead of extra salt.' },
      { heading: 'Potassium-Rich Pakistani Foods', body: 'Potassium helps counteract sodium and lowers BP. Great sources: Palak (spinach), tomatoes, daal, bananas, potatoes (without salt), and coconut water.' },
      { heading: 'Foods to Avoid with High BP', body: 'High-sodium foods: chips, papadum, salty crackers. Processed meats: sausages. Pickles and chutneys. Biryani with heavy masala. Excessive red meat. Alcohol and caffeine in excess.' },
      { heading: 'Lifestyle + Diet Combination', body: 'Exercise for 30 minutes daily (even walking). Maintain a healthy weight — every kg lost can lower BP by 1 mmHg. Quit smoking. Reduce stress through meditation or light yoga.' },
    ],
  },
  {
    id: 3,
    title: 'Heart-Healthy Eating in Pakistan',
    category: 'Cardiac Health',
    icon: Activity,
    readTime: '7 min',
    color: 'purple',
    summary: 'Cardiovascular disease is the leading cause of death in Pakistan. A heart-healthy diet can reduce your risk by up to 80%.',
    content: [
      { heading: 'Unhealthy Fats vs. Healthy Fats', body: 'Saturated fats (found in ghee, red meat, cream) raise LDL cholesterol. Trans fats (in fried foods, vanaspati ghee) are most dangerous. Replace with unsaturated fats from olive oil, canola oil, nuts, and fish.' },
      { heading: 'Best Heart Foods in Pakistani Cuisine', body: 'Fish (machli) — especially fatty fish like rohu or trout — is rich in omega-3 fatty acids. Walnuts and almonds help reduce bad cholesterol. Whole oats for breakfast lower LDL by 5-10%. Fruits and vegetables high in antioxidants.' },
      { heading: 'Cooking Methods Matter', body: 'Instead of deep frying (tala hua), choose: grilling (baked chicken instead of fried), steaming (steam vegetables), sautéing with minimal oil, or boiling (daal, legumes). These methods reduce fat content by 50-70%.' },
      { heading: 'Fiber for Heart Health', body: 'Soluble fiber binds to cholesterol and removes it from the body. Eat more: whole wheat roti, oats, all types of daal, sabzi (vegetables), and fruits like guava, apple, and pear.' },
      { heading: 'Sample Cardiac-Safe Pakistani Day', body: 'Breakfast: Oats porridge + 1 boiled egg + tea with low-fat milk. Lunch: Grilled fish + brown rice + salad. Dinner: Daal + 2 whole wheat rotis + yogurt. Snacks: Fruit + small handful of nuts.' },
    ],
  },
  {
    id: 4,
    title: 'Understanding BMR and TDEE',
    category: 'Nutrition Science',
    icon: Microscope,
    readTime: '4 min',
    color: 'emerald',
    summary: 'BMR and TDEE are the foundation of all calorie-based nutrition planning. Understanding them helps you eat the right amount.',
    content: [
      { heading: 'What is BMR?', body: 'Basal Metabolic Rate (BMR) is the number of calories your body burns at complete rest to maintain basic functions like breathing, circulation, and cell repair. Even if you stayed in bed all day, your body needs this energy.' },
      { heading: 'Mifflin-St Jeor Formula', body: 'For Men: BMR = 10 × weight(kg) + 6.25 × height(cm) − 5 × age + 5. For Women: BMR = 10 × weight(kg) + 6.25 × height(cm) − 5 × age − 161. DIETORA uses this formula — the most accurate currently available.' },
      { heading: 'What is TDEE?', body: 'Total Daily Energy Expenditure (TDEE) = BMR × Activity Multiplier. Activity levels: Sedentary (1.2x), Lightly active (1.375x), Moderately active (1.55x), Very active (1.725x), Extra active (1.9x). This is how many calories you actually need per day.' },
      { heading: 'Using TDEE for Goals', body: 'To lose weight: eat 300-500 calories below TDEE. To gain muscle: eat 200-300 calories above TDEE. To maintain weight: eat at your TDEE. DIETORA generates meal plans matching your TDEE automatically.' },
    ],
  },
  {
    id: 5,
    title: 'Protein Sources in Pakistani Diet',
    category: 'Macronutrients',
    icon: Dumbbell,
    readTime: '5 min',
    color: 'amber',
    summary: 'Protein is essential for muscle building, immune function, and satiety. Here are the best affordable protein sources in Pakistan.',
    content: [
      { heading: 'Why Protein Matters', body: 'Protein builds and repairs muscles, produces enzymes and hormones, and keeps you full longer. Most Pakistanis consume too little protein — aim for 0.8-1.2g per kg of body weight.' },
      { heading: 'Animal Protein Sources', body: 'Chicken (murgi): 100g gives 31g protein at ~₨80-120. Eggs (anda): 1 egg gives 6g protein at ~₨15-20. Fish (machli): 100g gives 22g protein, heart-healthy. Beef/mutton: high protein but also high in saturated fat — limit to 2-3x/week.' },
      { heading: 'Plant Protein Sources', body: 'Masoor Dal: 1 cup cooked = 18g protein, costs ~₨30. Chana (chickpeas): 1 cup = 15g protein, very affordable. Mung beans (moong): 1 cup = 14g protein. Paneer: 100g = 11g protein, good for vegetarians.' },
      { heading: 'Budget Protein Strategy', body: 'For maximum protein at minimum cost: Use dal as daily base protein. Add 1-2 eggs per day for quality amino acids. Use chicken 3-4x per week. Save red meat for 1-2x per week maximum. This approach costs ₨150-200/day.' },
    ],
  },
  {
    id: 6,
    title: 'Healthy Weight Management for Pakistanis',
    category: 'Weight Management',
    icon: Scale,
    readTime: '6 min',
    color: 'teal',
    summary: 'Obesity rates in Pakistan have doubled in 20 years. Sustainable weight management requires a balanced approach to diet and lifestyle.',
    content: [
      { heading: 'Why Crash Diets Fail', body: 'Extreme calorie restriction (below 1200 kcal) causes muscle loss, slows metabolism, and leads to rebound weight gain. The body enters "starvation mode" and becomes more efficient at storing fat. Aim for a gradual 0.5-1 kg per week loss.' },
      { heading: 'Pakistani Foods That Help Weight Loss', body: 'Sabzi (vegetables): Low calorie, high fiber, very filling. Dal: High protein and fiber — promotes satiety. Dahi (yogurt): Probiotics and protein. Chai without sugar: Almost zero calories. Lassi (without sugar): Provides protein from milk.' },
      { heading: 'Portion Control Pakistani Style', body: 'Use a smaller plate to naturally reduce portions. Eat roti instead of naan (naan has 3x the calories). Have dal + 2 rotis instead of biryani for lunch. Limit cooking oil — 1 tsp per person per meal is enough.' },
      { heading: 'Exercise Recommendations', body: 'Walk 30 minutes daily — even in your neighborhood. Avoid lift/escalators when possible. Do simple home exercises: squats, push-ups, planks. Pakistani women can do these at home without gym membership.' },
    ],
  },
]

const colorMap = {
  blue: { badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
  red: { badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
  purple: { badge: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
  emerald: { badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
  amber: { badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
  teal: { badge: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-800' },
}

export default function EducationalHubPage() {
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')

  const filtered = ARTICLES.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase())
  )

  if (selected) {
    const colors = colorMap[selected.color] || colorMap.emerald
    return (
      <div className="max-w-3xl mx-auto animate-fade-in">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 mb-6 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Articles
        </button>

        <div className="card">
          <div className="flex items-start gap-4 mb-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-${selected.color}-100 dark:bg-${selected.color}-900/40 text-${selected.color}-600`}>
              {(() => { const Icon = selected.icon; return <Icon className="w-8 h-8" /> })()}
            </div>
            <div>
              <span className={`badge ${colors.badge} mb-2`}>{selected.category}</span>
              <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-white">{selected.title}</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">{selected.summary}</p>
              <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> {selected.readTime} read</p>
            </div>
          </div>

          <div className="prose max-w-none space-y-6">
            {selected.content.map((section, i) => (
              <div key={i}>
                <h2 className="font-display font-bold text-lg text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/40 rounded-md flex items-center justify-center text-xs font-bold text-emerald-600">{i + 1}</span>
                  {section.heading}
                </h2>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{section.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 flex gap-3">
            <ShieldAlert className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium leading-relaxed">
              <strong>Medical Disclaimer:</strong> This article is for educational purposes only. Always consult a qualified healthcare provider before making significant dietary changes, especially if you have a medical condition.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Educational Hub</h1>
        <p className="page-subtitle">Learn about nutrition, disease management, and healthy Pakistani cooking</p>
      </div>

      {/* Search */}
      <div className="mb-6 max-w-md">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles..."
            className="input-field pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((article) => {
          const colors = colorMap[article.color] || colorMap.emerald
          return (
            <div
              key={article.id}
              onClick={() => setSelected(article)}
              className={`card-hover cursor-pointer border-2 ${colors.border}`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${article.color}-100 dark:bg-${article.color}-900/40 text-${article.color}-600`}>
                  {(() => { const Icon = article.icon; return <Icon className="w-5 h-5" /> })()}
                </div>
                <span className={`badge ${colors.badge} text-xs`}>{article.category}</span>
              </div>
              <h3 className="font-display font-bold text-slate-800 dark:text-white mb-2 leading-tight">{article.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-3">{article.summary}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {article.readTime} read</span>
                <span className="text-emerald-600 text-xs font-semibold">Read Article →</span>
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
          <p className="text-slate-500 dark:text-slate-400 text-base">No articles found for "{search}"</p>
        </div>
      )}
    </div>
  )
}
