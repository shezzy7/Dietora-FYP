import { useState } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

const RATINGS = [1, 2, 3, 4, 5]
const CATEGORIES = ['Meal Plan Quality', 'App Usability', 'Budget Accuracy', 'Disease Safety', 'General Feedback']

export default function FeedbackPage() {
  const [form, setForm] = useState({ rating: 5, category: 'General Feedback', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.message.trim()) { toast.error('Please write your feedback'); return }
    setLoading(true)
    try {
      await api.post('/feedback', {
        rating: form.rating,
        comment: form.message,
        category: form.category,
      })
      setSubmitted(true)
      toast.success('Thank you for your feedback!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto text-center py-20 animate-fade-in">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="font-display font-bold text-2xl text-slate-800 dark:text-white mb-2">Thank you!</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Your feedback helps us improve DIETORA for everyone.</p>
        <button onClick={() => { setSubmitted(false); setForm({ rating: 5, category: 'General Feedback', message: '' }) }}
          className="btn-primary py-2 px-6">Submit Another</button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Feedback</h1>
        <p className="page-subtitle">Help us improve DIETORA with your honest feedback</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div>
            <label className="label">Overall Rating</label>
            <div className="flex gap-2">
              {RATINGS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm({ ...form, rating: r })}
                  className={`w-12 h-12 rounded-xl border-2 font-bold text-lg transition-all ${
                    r <= form.rating
                      ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-500'
                      : 'border-slate-200 dark:border-slate-600 text-slate-300'
                  }`}
                >
                  ★
                </button>
              ))}
              <span className="self-center ml-2 text-sm font-semibold text-amber-600">
                {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][form.rating]}
              </span>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="label">Feedback Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setForm({ ...form, category: cat })}
                  className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                    form.category === cat
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'
                      : 'border-slate-200 dark:border-slate-600 text-slate-500 hover:border-emerald-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="label">Your Feedback</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Tell us about your experience with DIETORA — what you liked, what could be improved, and any suggestions..."
              rows={5}
              className="input-field resize-none"
            />
            <p className="text-xs text-slate-400 mt-1">{form.message.length}/500 characters</p>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </span>
            ) : '💬 Submit Feedback'}
          </button>
        </form>
      </div>

      {/* Info box */}
      <div className="card mt-4 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800">
        <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium mb-1">📬 How we use your feedback</p>
        <p className="text-xs text-emerald-600 dark:text-emerald-500 leading-relaxed">
          Your feedback is reviewed by the DIETORA development team at UAF Faisalabad. We use it to improve meal plan quality, fix bugs, and add new features. Thank you for helping us build a better product.
        </p>
      </div>
    </div>
  )
}
