import { useEffect, useState } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function AdminPage() {
  const [tab, setTab] = useState('foods')
  const [foods, setFoods] = useState([])
  const [users, setUsers] = useState([])
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(false)
  const [showFoodForm, setShowFoodForm] = useState(false)
  const [editFood, setEditFood] = useState(null)
  const [foodForm, setFoodForm] = useState({
    name: '', calories: '', price: '', protein: '', carbs: '', fat: '', category: 'grain',
    is_diabetic_safe: false, is_hypertension_safe: false, is_cardiac_safe: false,
  })

  useEffect(() => {
    if (tab === 'foods') fetchFoods()
    if (tab === 'users') fetchUsers()
    if (tab === 'feedback') fetchFeedbacks()
  }, [tab])

  const fetchFoods = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/foods')
      setFoods(data.foods || data)
    } catch { toast.error('Failed to load foods') }
    finally { setLoading(false) }
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/users')
      setUsers(data.users || data)
    } catch { toast.error('Failed to load users') }
    finally { setLoading(false) }
  }

  const fetchFeedbacks = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/feedback')
      setFeedbacks(data.data || data.feedback || [])
    } catch { toast.error('Failed to load feedback') }
    finally { setLoading(false) }
  }

  const handleFoodSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editFood) {
        await api.put(`/admin/foods/${editFood._id}`, foodForm)
        toast.success('Food updated!')
      } else {
        await api.post('/admin/foods', foodForm)
        toast.success('Food added!')
      }
      setShowFoodForm(false); setEditFood(null)
      fetchFoods()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const deleteFood = async (id) => {
    if (!window.confirm('Delete this food item?')) return
    try {
      await api.delete(`/admin/foods/${id}`)
      toast.success('Food deleted')
      fetchFoods()
    } catch { toast.error('Failed to delete') }
  }

  const openEditFood = (food) => {
    setEditFood(food)
    setFoodForm({ ...food })
    setShowFoodForm(true)
  }

  const resetFoodForm = () => {
    setFoodForm({ name: '', calories: '', price: '', protein: '', carbs: '', fat: '', category: 'grain', is_diabetic_safe: false, is_hypertension_safe: false, is_cardiac_safe: false })
    setEditFood(null)
    setShowFoodForm(true)
  }

  const resolveFeedback = async (id) => {
    try {
      await api.patch(`/feedback/${id}/resolve`, { adminResponse: 'Reviewed by admin.' })
      toast.success('Feedback marked as resolved')
      fetchFeedbacks()
    } catch { toast.error('Failed to resolve feedback') }
  }

  const deleteFeedback = async (id) => {
    if (!window.confirm('Delete this feedback permanently?')) return
    try {
      await api.delete(`/feedback/${id}`)
      toast.success('Feedback deleted')
      fetchFeedbacks()
    } catch { toast.error('Failed to delete feedback') }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Admin Panel</h1>
        <p className="page-subtitle">Manage food items, users, and feedback</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[{ key: 'foods', label: '🥘 Food Items' }, { key: 'users', label: '👥 Users' }, { key: 'feedback', label: '💬 Feedback' }].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-xl font-semibold text-sm transition-all ${tab === t.key ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Food Items Tab */}
      {tab === 'foods' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">{foods.length} food items in database</p>
            <button onClick={resetFoodForm} className="btn-primary py-2 px-4 text-sm">+ Add Food</button>
          </div>

          {/* Food Form Modal */}
          {showFoodForm && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
                <h3 className="font-display font-bold text-xl text-slate-800 dark:text-white mb-5">{editFood ? 'Edit Food' : 'Add New Food'}</h3>
                <form onSubmit={handleFoodSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="label">Food Name (Urdu/English)</label>
                      <input value={foodForm.name} onChange={e => setFoodForm({...foodForm, name: e.target.value})} placeholder="e.g., Dal Mash" required className="input-field" />
                    </div>
                    {[{k:'calories',l:'Calories (kcal)'},{k:'price',l:'Price (PKR)'},{k:'protein',l:'Protein (g)'},{k:'carbs',l:'Carbs (g)'},{k:'fat',l:'Fat (g)'}].map(f => (
                      <div key={f.k}>
                        <label className="label">{f.l}</label>
                        <input type="number" min="0" value={foodForm[f.k]} onChange={e => setFoodForm({...foodForm, [f.k]: e.target.value})} required className="input-field" />
                      </div>
                    ))}
                    <div>
                      <label className="label">Category</label>
                      <select value={foodForm.category} onChange={e => setFoodForm({...foodForm, category: e.target.value})} className="input-field">
                        {['grain', 'protein', 'vegetable', 'dairy', 'fruit', 'beverage', 'snack', 'legume'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="label">Safety Flags</label>
                    {[
                      { key: 'is_diabetic_safe', label: '🩸 Diabetic Safe' },
                      { key: 'is_hypertension_safe', label: '❤️ Hypertension Safe' },
                      { key: 'is_cardiac_safe', label: '🫀 Cardiac Safe' },
                    ].map(f => (
                      <label key={f.key} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={foodForm[f.key]}
                          onChange={e => setFoodForm({...foodForm, [f.key]: e.target.checked})}
                          className="w-4 h-4 rounded text-emerald-600" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{f.label}</span>
                      </label>
                    ))}
                  </div>

                  <div className="flex gap-3 mt-2">
                    <button type="button" onClick={() => setShowFoodForm(false)} className="btn-secondary flex-1">Cancel</button>
                    <button type="submit" className="btn-primary flex-1">{editFood ? 'Update' : 'Add Food'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Foods Table */}
          {loading ? (
            <div className="card text-center py-12"><div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto" /></div>
          ) : (
            <div className="card overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    {['Name', 'Category', 'Calories', 'Price (₨)', 'Protein', 'Safety Flags', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                  {foods.map((food) => (
                    <tr key={food._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{food.name}</td>
                      <td className="px-4 py-3"><span className="badge-emerald capitalize">{food.category}</span></td>
                      <td className="px-4 py-3 text-emerald-600 font-semibold">{food.calories}</td>
                      <td className="px-4 py-3 text-amber-600 font-semibold">₨{food.price}</td>
                      <td className="px-4 py-3 text-blue-600">{food.protein}g</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {food.is_diabetic_safe && <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-600 px-1.5 py-0.5 rounded">D</span>}
                          {food.is_hypertension_safe && <span className="text-xs bg-red-100 dark:bg-red-900/20 text-red-600 px-1.5 py-0.5 rounded">H</span>}
                          {food.is_cardiac_safe && <span className="text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-600 px-1.5 py-0.5 rounded">C</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => openEditFood(food)} className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold">Edit</button>
                          <button onClick={() => deleteFood(food._id)} className="text-xs text-red-500 hover:text-red-700 font-semibold">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {foods.length === 0 && (
                <div className="text-center py-12 text-slate-400">No food items found</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div>
          <p className="text-sm text-slate-500 mb-4">{users.length} registered users</p>
          {loading ? (
            <div className="card text-center py-12"><div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto" /></div>
          ) : (
            <div className="card overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    {['Name', 'Email', 'Role', 'Joined', 'Profile'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold">{u.name?.[0]}</div>
                          <span className="font-medium text-slate-800 dark:text-white">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={u.role === 'admin' ? 'badge bg-purple-100 dark:bg-purple-900/20 text-purple-600' : 'badge-emerald'}>
                          {u.role || 'user'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${u.healthProfile ? 'badge-emerald' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                          {u.healthProfile ? '✓ Complete' : '✗ Missing'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="text-center py-12 text-slate-400">No users found</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Feedback Tab */}
      {tab === 'feedback' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">{feedbacks.length} feedback entries</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                All feedback is publicly visible on the landing page
              </span>
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            </div>
          </div>

          {loading ? (
            <div className="card text-center py-12"><div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto" /></div>
          ) : feedbacks.length === 0 ? (
            <div className="card text-center py-16">
              <div className="text-5xl mb-4">💬</div>
              <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white mb-2">No feedback yet</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">User feedback will appear here once submitted.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((fb) => (
                <div key={fb._id} className="card hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    {/* User info + review content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {fb.user?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-white text-sm">
                            {fb.user?.name || 'Unknown User'}
                          </p>
                          <p className="text-xs text-slate-400">{fb.user?.email}</p>
                        </div>
                      </div>

                      {/* Star Rating */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <span key={i} className={`text-sm ${i <= fb.rating ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}>★</span>
                          ))}
                        </div>
                        <span className="text-xs font-semibold text-amber-600">{fb.rating}/5</span>
                        {fb.category && (
                          <span className="text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 px-2 py-0.5 rounded-full font-medium">
                            {fb.category}
                          </span>
                        )}
                      </div>

                      {/* Comment */}
                      {fb.comment && (
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-700/30 rounded-xl p-3 italic">
                          "{fb.comment}"
                        </p>
                      )}

                      {/* Admin response if resolved */}
                      {fb.isResolved && fb.adminResponse && (
                        <div className="mt-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border-l-3 border-emerald-500">
                          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">Admin Response:</p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-500">{fb.adminResponse}</p>
                        </div>
                      )}
                    </div>

                    {/* Meta + Actions */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {new Date(fb.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>

                      {/* Status badges */}
                      <div className="flex gap-1.5">
                        {fb.isResolved ? (
                          <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                            ✓ Resolved
                          </span>
                        ) : (
                          <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                            Pending
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 mt-1">
                        {!fb.isResolved && (
                          <button
                            onClick={() => resolveFeedback(fb._id)}
                            className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
                          >
                            ✓ Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
