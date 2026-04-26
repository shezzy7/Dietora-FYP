// src/components/location/LocationPermissionModal.jsx
// Compact modal — fits screen without scrolling

import { useState } from 'react'
import { useLocation, PAKISTANI_CITIES } from '../../hooks/useLocation'

export default function LocationPermissionModal() {
  const { showLocationModal, loading, requestGPS, dismissPrompt, selectCity } = useLocation()

  const [step, setStep] = useState('ask')
  const [selectedCity, setSelectedCity] = useState('')

  if (!showLocationModal) return null

  const handleAllowGPS = async () => {
    try { await requestGPS() }
    catch { setStep('city') }
  }

  const handleCitySubmit = () => {
    if (!selectedCity) return
    selectCity(selectedCity)
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

        {step === 'ask' ? (
          <>
            {/* Compact header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4 text-center">
              <div className="text-3xl mb-1">📍</div>
              <h2 className="text-white text-base font-bold">Enable Location Access</h2>
              <p className="text-emerald-100 text-xs mt-0.5">Find grocery stores near you</p>
            </div>

            <div className="px-5 py-4">
              {/* Compact benefits list */}
              <div className="space-y-2 mb-4">
                {[
                  { icon: '🛒', text: 'Find nearby grocery stores' },
                  { icon: '🥩', text: '"Where to buy?" — instant answer' },
                  { icon: '💰', text: 'Compare prices near you' },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                    <span className="text-base">{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-slate-400 dark:text-slate-500 text-center mb-4">
                🔒 Your location is never shared with third parties.
              </p>

              <div className="space-y-2">
                <button onClick={handleAllowGPS} disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
                  {loading ? 'Getting location...' : '📍 Allow Location Access'}
                </button>
                <button onClick={() => setStep('city')}
                  className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium py-2.5 rounded-xl transition-colors text-sm">
                  🏙️ Select My City Instead
                </button>
                <button onClick={dismissPrompt}
                  className="w-full text-slate-400 hover:text-slate-600 text-xs py-1.5 transition-colors">
                  Not now
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4 text-center">
              <div className="text-3xl mb-1">🏙️</div>
              <h2 className="text-white text-base font-bold">Select Your City</h2>
              <p className="text-emerald-100 text-xs mt-0.5">We'll show stores in your city</p>
            </div>

            <div className="px-5 py-4">
              <div className="grid grid-cols-2 gap-1.5 mb-4 max-h-48 overflow-y-auto pr-1">
                {PAKISTANI_CITIES.map((city) => (
                  <button key={city} onClick={() => setSelectedCity(city)}
                    className={`py-2 px-2.5 rounded-lg text-xs font-medium border-2 transition-all ${
                      selectedCity === city
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300'
                    }`}>
                    {city}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <button onClick={handleCitySubmit} disabled={!selectedCity || loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
                  {loading ? 'Saving...' : selectedCity ? `Confirm — ${selectedCity}` : 'Select a city'}
                </button>
                <button onClick={() => setStep('ask')}
                  className="w-full text-slate-400 hover:text-slate-600 text-xs py-1.5 transition-colors">
                  ← Back
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
