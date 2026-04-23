import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchGroceryList, toggleItem, clearChecked } from '../store/slices/grocerySlice'
import { Link } from 'react-router-dom'
import { ShoppingCart, Printer, RotateCcw, CheckCircle2, Wheat, Beef, Carrot, Milk, Utensils, Check } from 'lucide-react'

export default function GroceryListPage() {
  const dispatch = useDispatch()
  const { items, totalCost, loading, checkedItems } = useSelector((s) => s.grocery)
  const { list: mealPlans } = useSelector((s) => s.mealPlan)

  useEffect(() => {
    const latestId = mealPlans?.[0]?._id
    dispatch(fetchGroceryList(latestId))
  }, [dispatch, mealPlans])

  const checkedCount = Object.values(checkedItems).filter(Boolean).length
  const totalItems = items.length

  const groupedItems = items.reduce((acc, item) => {
    const cat = item.category || 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  if (!mealPlans?.length) {
    return (
      <div className="max-w-md mx-auto text-center py-20 card border-dashed border-2 bg-slate-50/50 dark:bg-slate-800/50">
        <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingCart className="w-10 h-10 text-amber-600" />
        </div>
        <h2 className="font-display font-bold text-2xl text-slate-800 dark:text-white mb-2">No grocery list yet</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6 text-base">Generate a meal plan first to get your grocery list.</p>
        <Link to="/meal-plan" className="btn-primary py-3 px-8 inline-flex">Generate Meal Plan →</Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="page-title">Grocery List</h1>
          <p className="page-subtitle">Based on your latest 7-day meal plan</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="btn-amber py-2 px-5 text-sm font-bold flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print / Export PDF
          </button>
          <button onClick={() => dispatch(clearChecked())} className="btn-secondary py-2 px-5 text-sm">
            <RotateCcw className="w-4 h-4" /> Reset Checks
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-2xl font-bold font-display text-emerald-600">{totalItems}</p>
          <p className="text-xs text-slate-400">Total Items</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold font-display text-blue-600">{checkedCount}</p>
          <p className="text-xs text-slate-400">Purchased</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold font-display text-amber-600">₨{totalCost}</p>
          <p className="text-xs text-slate-400">Total Cost</p>
        </div>
      </div>

      {/* Progress Bar */}
      {totalItems > 0 && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Shopping Progress</span>
            <span className="text-sm font-bold text-emerald-600">{checkedCount}/{totalItems}</span>
          </div>
          <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${totalItems ? (checkedCount / totalItems) * 100 : 0}%` }}
            />
          </div>
          {checkedCount === totalItems && totalItems > 0 && (
            <p className="text-emerald-600 font-semibold text-sm mt-3 text-center flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> All items purchased!
            </p>
          )}
        </div>
      )}

      {loading ? (
        <div className="card text-center py-12">
          <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 mt-3 text-sm">Loading grocery list...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center py-16 border-dashed border-2 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-base">Your grocery list is empty</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedItems).map(([category, catItems]) => (
            <div key={category} className="card">
              <h3 className="font-display font-bold text-sm text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2 capitalize">
                <span className="w-7 h-7 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-lg flex items-center justify-center text-xs">
                  {category === 'grain' ? <Wheat className="w-4 h-4"/> : 
                   category === 'protein' ? <Beef className="w-4 h-4"/> : 
                   category === 'vegetable' ? <Carrot className="w-4 h-4"/> : 
                   category === 'dairy' ? <Milk className="w-4 h-4"/> : <Utensils className="w-4 h-4"/>}
                </span>
                {category}
              </h3>
              <div className="space-y-2">
                {catItems.map((item, idx) => {
                  const id = item._id || `${category}-${idx}`
                  const checked = !!checkedItems[id]
                  return (
                    <div
                      key={id}
                      onClick={() => dispatch(toggleItem(id))}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-150 ${
                        checked
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 opacity-60'
                          : 'bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          checked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-500 group-hover:border-emerald-400'
                        }`}>
                          {checked && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className={`text-sm font-medium ${checked ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        {item.quantity && <span className="text-slate-400">{item.quantity}</span>}
                        {item.price && <span className="font-semibold text-amber-600">₨{item.price}</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Cost Summary */}
          <div className="card bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-100 dark:border-amber-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display font-bold text-slate-800 dark:text-white">Total Weekly Cost</p>
                <p className="text-xs text-slate-500 mt-0.5">For your 7-day meal plan</p>
              </div>
              <p className="font-display text-3xl font-bold text-amber-600">₨{totalCost}</p>
            </div>
            <div className="mt-3 pt-3 border-t border-amber-100 dark:border-amber-800 flex justify-between text-sm">
              <span className="text-slate-500">Daily average</span>
              <span className="font-semibold text-amber-600">₨{Math.round(totalCost / 7)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
