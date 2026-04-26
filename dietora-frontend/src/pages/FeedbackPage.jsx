import { useState } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { PartyPopper, Star, MessageSquare, Mailbox, Loader2 } from 'lucide-react'
import { useUrdu } from '../context/UrduContext'

const CATEGORIES_EN = ['Meal Plan Quality', 'App Usability', 'Budget Accuracy', 'Disease Safety', 'General Feedback']
const CATEGORIES_UR = ['کھانے کے منصوبے کا معیار', 'ایپ کا استعمال', 'بجٹ کی درستگی', 'بیماری کی حفاظت', 'عمومی رائے']
const RATINGS = [1, 2, 3, 4, 5]

export default function FeedbackPage() {
  const [form, setForm] = useState({ rating: 5, category: 'General Feedback', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const { isUrdu } = useUrdu()

  const ur = (en, urdu) => isUrdu ? urdu : en
  const CATEGORIES = isUrdu ? CATEGORIES_UR : CATEGORIES_EN
  const RATING_LABELS = ['', ur('Poor', 'کمزور'), ur('Fair', 'ٹھیک'), ur('Good', 'اچھا'), ur('Great', 'بہت اچھا'), ur('Excellent', 'شاندار')]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.message.trim()) { toast.error(ur('Please write your feedback', 'براہ کرم اپنی رائے لکھیں')); return }
    setLoading(true)
    try {
      await api.post('/feedback', { rating: form.rating, comment: form.message, category: form.category })
      setSubmitted(true)
      toast.success(ur('Thank you for your feedback!', 'آپ کی رائے کا شکریہ!'))
    } catch (err) {
      toast.error(err.response?.data?.message || ur('Failed to submit feedback', 'رائے جمع کرنے میں ناکامی'))
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto text-center py-20 animate-fade-in card border-dashed border-2 bg-slate-50/50 dark:bg-slate-800/50" style={isUrdu ? { fontFamily: "'Noto Nastaliq Urdu', serif" } : {}}>
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
          <PartyPopper className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="font-display font-bold text-2xl text-slate-800 dark:text-white mb-2">{ur('Thank you!', 'شکریہ!')}</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6 text-base">{ur('Your feedback helps us improve DIETORA for everyone.', 'آپ کی رائے ہمیں DIETORA کو بہتر بنانے میں مدد کرتی ہے۔')}</p>
        <button onClick={() => { setSubmitted(false); setForm({ rating: 5, category: 'General Feedback', message: '' }) }} className="btn-primary py-3 px-8 inline-flex text-base">
          {ur('Submit Another', 'دوبارہ جمع کریں')}
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in" style={isUrdu ? { fontFamily: "'Noto Nastaliq Urdu', serif" } : {}}>
      <div className="page-header">
        <h1 className="page-title">{ur('Feedback', 'رائے')}</h1>
        <p className="page-subtitle">{ur('Help us improve DIETORA with your honest feedback', 'اپنی ایماندارانہ رائے سے DIETORA کو بہتر بنانے میں مدد کریں')}</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div>
            <label className="label">{ur('Overall Rating', 'مجموعی درجہ بندی')}</label>
            <div className="flex gap-2">
              {RATINGS.map((r) => (
                <button key={r} type="button" onClick={() => setForm({ ...form, rating: r })}
                  className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all duration-200 ${r <= form.rating ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-500 shadow-sm' : 'border-slate-200 dark:border-slate-600 text-slate-300 hover:border-amber-300'}`}>
                  <Star className={`w-6 h-6 ${r <= form.rating ? 'fill-current' : ''}`} />
                </button>
              ))}
              <span className="self-center ml-3 text-sm font-bold text-amber-600 uppercase tracking-wide">{RATING_LABELS[form.rating]}</span>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="label">{ur('Feedback Category', 'رائے کی قسم')}</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat, i) => (
                <button key={cat} type="button" onClick={() => setForm({ ...form, category: CATEGORIES_EN[i] })}
                  className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${form.category === CATEGORIES_EN[i] ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'border-slate-200 dark:border-slate-600 text-slate-500 hover:border-emerald-300'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="label">{ur('Your Feedback', 'آپ کی رائے')}</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder={ur('Tell us about your experience with DIETORA — what you liked, what could be improved...', 'DIETORA کے ساتھ اپنے تجربے کے بارے میں بتائیں — کیا پسند آیا، کیا بہتر ہو سکتا ہے...')}
              rows={5}
              className="input-field resize-none"
            />
            <p className="text-xs text-slate-400 mt-1">{form.message.length}/500 {ur('characters', 'حروف')}</p>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base font-bold">
            {loading ? (
              <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> {ur('Submitting...', 'جمع ہو رہی ہے...')}</span>
            ) : (
              <span className="flex items-center justify-center gap-2"><MessageSquare className="w-5 h-5" /> {ur('Submit Feedback', 'رائے جمع کریں')}</span>
            )}
          </button>
        </form>
      </div>

      <div className="card mt-6 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800">
        <p className="text-sm text-emerald-700 dark:text-emerald-400 font-bold mb-1 flex items-center gap-2">
          <Mailbox className="w-4 h-4" /> {ur('How we use your feedback', 'ہم آپ کی رائے کیسے استعمال کرتے ہیں')}
        </p>
        <p className="text-xs text-emerald-600 dark:text-emerald-500 leading-relaxed">
          {ur('Your feedback is reviewed by the DIETORA development team at UAF Faisalabad. We use it to improve meal plan quality, fix bugs, and add new features.',
             'آپ کی رائے UAF فیصل آباد میں DIETORA ٹیم جائزہ لیتی ہے۔ ہم اسے کھانے کے منصوبے کا معیار بہتر بنانے، مسائل حل کرنے اور نئی خصوصیات شامل کرنے کے لیے استعمال کرتے ہیں۔')}
        </p>
      </div>
    </div>
  )
}
