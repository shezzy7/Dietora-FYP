import { useState, useEffect } from 'react'
import api from '../../services/api'

export default function RecipeModal({ isOpen, onClose, foodId, foodName }) {
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isOpen || !foodId) return
    
    setLoading(true)
    setError(null)
    setRecipe(null)

    api.get(`/meal-plans/recipe/${foodId}`)
      .then((res) => {
        setRecipe(res.data?.data || res.data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to generate recipe.')
        setLoading(false)
      })
  }, [isOpen, foodId])

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[70] backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 z-[80] shadow-2xl animate-slide-left overflow-y-auto border-l border-slate-200 dark:border-slate-800">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="font-display font-bold text-xl text-slate-800 dark:text-white">👨‍🍳 AI Recipe Generator</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tailored to your medical profile</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
              ✕
            </button>
          </div>

          {loading && (
            <div className="py-20 text-center">
              <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Generating medical-safe recipe for</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white mt-1">{foodName}...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-xl text-sm text-center">
              <span className="text-2xl mb-2 block">⚠️</span>
              {error}
            </div>
          )}

          {recipe && !loading && !error && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center pb-6 border-b border-slate-100 dark:border-slate-800">
                <h1 className="font-display font-bold text-2xl text-slate-800 dark:text-white mb-2">{recipe.title || foodName}</h1>
                <p className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-600 text-xs font-bold rounded-full">
                  ⏱️ Prep Time: {recipe.prepTime || '20 mins'}
                </p>
              </div>

              {recipe.medicalNote && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex gap-3 items-start">
                  <span className="text-blue-500 text-xl">🩺</span>
                  <div>
                    <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1">Dietitian Note</h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">{recipe.medicalNote}</p>
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                  <span>🛒</span> Ingredients
                </h3>
                <ul className="space-y-2">
                  {(recipe.ingredients || []).map((ing, i) => (
                    <li key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-300 items-start">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      <span>{ing}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                  <span>🍳</span> Instructions
                </h3>
                <div className="space-y-4">
                  {(recipe.instructions || []).map((step, i) => (
                    <div key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-300">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center font-bold text-xs">
                        {i + 1}
                      </span>
                      <p className="pt-0.5 leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
