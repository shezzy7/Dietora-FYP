// src/pages/StoreFinderPage.jsx
// Real-time store finder using Google Places API

import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, PAKISTANI_CITIES } from '../hooks/useLocation'
import api from '../services/api'
import { MapPin, Star, CheckCircle, XCircle, Map, Pin, ShoppingCart, Salad, Building2, Loader2, RefreshCw, Radio, Search, MapPinned, X } from 'lucide-react'

// ─── Store Card ───────────────────────────────────────────
function StoreCard({ store }) {
  const priceDots = store.priceLevel != null ? '₨'.repeat(store.priceLevel + 1) : null

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-800 dark:text-slate-100 leading-snug">{store.name}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">{store.address}</p>
        </div>
        {store.distanceText && (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {store.distanceText}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {store.rating && (
          <span className="text-xs flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full">
            <Star className="w-3 h-3 fill-current" /> {store.rating.toFixed(1)}
            <span className="text-slate-400 font-normal">({store.totalRatings?.toLocaleString()})</span>
          </span>
        )}
        {store.isOpenNow === true && (
          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Open now</span>
        )}
        {store.isOpenNow === false && (
          <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded-full font-medium flex items-center gap-1"><XCircle className="w-3 h-3" /> Closed</span>
        )}
        {priceDots && (
          <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full font-medium">{priceDots}</span>
        )}
      </div>

      <div className="flex gap-2">
        <a
          href={store.directionsLink}
          target="_blank" rel="noopener noreferrer"
          className="flex-1 flex justify-center items-center gap-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl transition-colors font-medium"
        >
          <Map className="w-4 h-4" /> Directions
        </a>
        <a
          href={store.mapsLink}
          target="_blank" rel="noopener noreferrer"
          className="flex-1 flex justify-center items-center gap-1.5 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 py-2 rounded-xl transition-colors font-medium"
        >
          <MapPinned className="w-4 h-4" /> Maps
        </a>
      </div>
    </div>
  )
}

// ─── Skeleton loader ──────────────────────────────────────
function StoreCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 animate-pulse">
      <div className="flex justify-between gap-3 mb-3">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
        </div>
        <div className="h-7 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
      </div>
      <div className="flex gap-2 mb-3">
        <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
        <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
      </div>
      <div className="flex gap-2">
        <div className="flex-1 h-9 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        <div className="flex-1 h-9 bg-slate-200 dark:bg-slate-700 rounded-xl" />
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────
export default function StoreFinderPage() {
  const {
    hasConsent, hasLocation, effectiveCity, resolvedArea, resolvedCity,
    loading: locationLoading, promptForLocation, requestGPS, selectCity, revoke,
  } = useLocation()

  const [stores, setStores] = useState([])
  const [fetching, setFetching] = useState(false)
  const [foodQuery, setFoodQuery] = useState('')
  const [activeTab, setActiveTab] = useState('nearby')
  const [chatMessage, setChatMessage] = useState('')
  const [radius, setRadius] = useState(3000)
  const [selectedCity, setSelectedCity] = useState('')

  // Auto-load nearby stores when GPS consent is available
  useEffect(() => {
    if (hasConsent && activeTab === 'nearby') {
      loadNearbyStores()
    }
  }, [hasConsent])

  const loadNearbyStores = async (r = radius) => {
    setFetching(true)
    setChatMessage('')
    try {
      const res = await api.get(`/location/stores/nearby?radius=${r}`)
      setStores(res.data.data?.stores || [])
    } catch (err) {
      setChatMessage(err.response?.data?.message || 'Failed to load stores.')
    } finally {
      setFetching(false)
    }
  }

  const searchForFood = async (food) => {
    if (!food?.trim()) return
    if (!hasConsent) { promptForLocation(); return }
    setFetching(true)
    setChatMessage('')
    try {
      const res = await api.get(`/location/stores/for-food/${encodeURIComponent(food.trim())}?radius=${radius}`)
      setStores(res.data.data?.stores || [])
      setChatMessage(res.data.data?.chatMessage || '')
      setActiveTab('food')
    } catch (err) {
      setChatMessage(err.response?.data?.message || 'No stores found.')
      setStores([])
    } finally {
      setFetching(false)
    }
  }

  const handleFoodSubmit = (e) => {
    e.preventDefault()
    searchForFood(foodQuery)
  }

  const POPULAR_SEARCHES = ['Chicken', 'Dal Masoor', 'Dahi', 'Saag', 'Basmati Chawal', 'Atta', 'Sabzi', 'Fish']

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><ShoppingCart className="w-6 h-6" /> Store Finder</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time nearby stores powered by Google Maps
          </p>
        </div>

        {/* Location badge */}
        {hasConsent ? (
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <div>
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">GPS Active</p>
              {(resolvedArea || resolvedCity) && (
                <p className="text-xs text-emerald-600 dark:text-emerald-500">{resolvedArea || resolvedCity}</p>
              )}
            </div>
            <button onClick={revoke} className="text-red-400 hover:text-red-600 ml-1 transition-colors" title="Revoke"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <button
            onClick={promptForLocation}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm flex items-center gap-2"
          >
            <MapPin className="w-4 h-4" /> Enable GPS
          </button>
        )}
      </div>

      {/* "Where can I buy?" Hero Search */}
      <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20">
        <h2 className="font-bold text-lg mb-1">Where can I buy...?</h2>
        <p className="text-emerald-100 text-sm mb-4">
          Real stores from Google Maps — not fake data. Type any Pakistani food item!
        </p>

        <form onSubmit={handleFoodSubmit} className="flex gap-2 mb-4">
          <input
            value={foodQuery}
            onChange={(e) => setFoodQuery(e.target.value)}
            placeholder='e.g. "chicken", "dal masoor", "dahi", "atta"'
            className="flex-1 bg-white/20 backdrop-blur placeholder-emerald-200 text-white border border-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/60 focus:bg-white/25 transition-all"
          />
          <button
            type="submit"
            disabled={!foodQuery.trim() || fetching}
            className="bg-white text-emerald-700 font-bold px-5 py-3 rounded-xl hover:bg-emerald-50 disabled:opacity-60 transition-colors text-sm shadow-md"
          >
            {fetching ? '...' : 'Find'}
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          <span className="text-emerald-200 text-xs self-center">Quick:</span>
          {POPULAR_SEARCHES.map((f) => (
            <button
              key={f}
              onClick={() => { setFoodQuery(f); searchForFood(f) }}
              className="text-xs bg-white/20 hover:bg-white/35 text-white px-3 py-1.5 rounded-full transition-colors border border-white/20 font-medium"
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Chat message banner */}
      {chatMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3.5 text-sm text-emerald-800 dark:text-emerald-300 font-medium">
          {chatMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
        {[
          { id: 'nearby', label: 'Near Me', icon: MapPin },
          { id: 'food', label: 'Food Search', icon: Salad },
          { id: 'city', label: 'Browse by City', icon: Building2 },
        ].map((tab) => {
          const TabIcon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <TabIcon className="w-4 h-4" /> {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab: Near Me */}
      {activeTab === 'nearby' && (
        <div className="space-y-4">
          {!hasConsent ? (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-10 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200 mb-2">GPS Required</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-xs mx-auto">
                Enable GPS so we can find grocery stores, supermarkets, and kiryana shops near your exact location using Google Maps.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={requestGPS}
                  disabled={locationLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm shadow-sm flex items-center gap-2"
                >
                  {locationLoading ? <><Loader2 className="w-4 h-4 animate-spin"/> Getting GPS...</> : <><MapPin className="w-4 h-4"/> Use My GPS</>}
                </button>
                <button
                  onClick={promptForLocation}
                  className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium px-6 py-3 rounded-xl transition-colors text-sm flex items-center gap-2"
                >
                  <Building2 className="w-4 h-4" /> Select City
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Controls */}
              <div className="flex items-center gap-3 flex-wrap">
                <select
                  value={radius}
                  onChange={(e) => { setRadius(Number(e.target.value)); loadNearbyStores(Number(e.target.value)) }}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <option value={1000}>Within 1 km</option>
                  <option value={2000}>Within 2 km</option>
                  <option value={3000}>Within 3 km</option>
                  <option value={5000}>Within 5 km</option>
                  <option value={10000}>Within 10 km</option>
                </select>
                <button
                  onClick={() => loadNearbyStores(radius)}
                  disabled={fetching}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  {fetching ? <Loader2 className="w-4 h-4 animate-spin"/> : <><RefreshCw className="w-4 h-4"/> Refresh</>}
                </button>
                <p className="text-xs text-slate-400 ml-auto flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5" /> Live data from Google Maps
                </p>
              </div>

              {/* Results */}
              {fetching ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => <StoreCardSkeleton key={i} />)}
                </div>
              ) : stores.length > 0 ? (
                <>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Found <span className="font-semibold text-emerald-600">{stores.length}</span> stores near {resolvedArea || resolvedCity || 'you'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {stores.map((store, i) => <StoreCard key={store.placeId || i} store={store} />)}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Search className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No stores found in this radius. Try increasing the range.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab: Food Search */}
      {activeTab === 'food' && (
        <div className="space-y-4">
          {fetching ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => <StoreCardSkeleton key={i} />)}
            </div>
          ) : stores.length > 0 ? (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Found <span className="font-semibold text-emerald-600">{stores.length}</span> stores for <strong>"{foodQuery}"</strong>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stores.map((store, i) => <StoreCard key={store.placeId || i} store={store} />)}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Search className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Search for a food item above to find nearby stores.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: By City — note: city browsing requires GPS, we show manual search */}
      {activeTab === 'city' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Pin className="w-3.5 h-3.5" /> City-based search uses Google Maps text search. Select your city to find major stores.
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {PAKISTANI_CITIES.map((city) => (
              <button
                key={city}
                onClick={async () => {
                  setSelectedCity(city)
                  setFetching(true)
                  setStores([])
                  try {
                    const res = await api.get(`/location/stores/nearby?keyword=grocery+supermarket+kiryana+${city}`)
                    setStores(res.data.data?.stores || [])
                  } catch {
                    setChatMessage('Could not load stores for this city.')
                  } finally {
                    setFetching(false)
                  }
                }}
                className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                  selectedCity === city
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300 bg-white dark:bg-slate-800'
                }`}
              >
                {city}
              </button>
            ))}
          </div>

          {fetching ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => <StoreCardSkeleton key={i} />)}
            </div>
          ) : stores.length > 0 && selectedCity && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stores.map((store, i) => <StoreCard key={store.placeId || i} store={store} />)}
            </div>
          )}
        </div>
      )}

      {/* Powered by */}
      <div className="text-center py-2">
        <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <Map className="w-3.5 h-3.5" /> Powered by Google Maps Platform • Real-time data • No fake stores
        </p>
      </div>
    </div>
  )
}
