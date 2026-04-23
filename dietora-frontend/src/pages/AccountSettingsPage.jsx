// src/pages/AccountSettingsPage.jsx
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { deleteAccount, logout } from '../store/slices/authSlice'
import toast from 'react-hot-toast'

// ─── Confirmation Modal ───────────────────────────────────
function DeleteAccountModal({ user, onClose, onConfirm, isDeleting }) {
  const isGoogle = user?.authProvider === 'google'
  const [password, setPassword] = useState('')
  const [typed, setTyped]       = useState('')
  const CONFIRM_PHRASE = 'delete my account'

  const ready = isGoogle
    ? typed === CONFIRM_PHRASE
    : typed === CONFIRM_PHRASE && password.length >= 6

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!ready) return
    onConfirm(isGoogle ? {} : { password })
  }

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-red-100 dark:border-red-900/40 overflow-hidden">

        {/* Header */}
        <div className="bg-red-50 dark:bg-red-900/20 px-6 py-5 border-b border-red-100 dark:border-red-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center text-xl flex-shrink-0">
              ⚠️
            </div>
            <div>
              <h2 className="font-display font-bold text-red-700 dark:text-red-400 text-lg leading-tight">
                Delete Account
              </h2>
              <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">This action is permanent and irreversible</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* What gets deleted */}
          <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-sm text-slate-600 dark:text-slate-300 space-y-1.5">
            <p className="font-semibold text-slate-700 dark:text-slate-200 mb-2">The following will be permanently erased:</p>
            {[
              '👤 Your account and personal information',
              '🏥 Health profile & medical data',
              '🍽️ All meal plans',
              '🛒 Grocery lists',
              '📊 Progress & history',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <span className="text-red-400 font-bold text-xs">✗</span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* Password field — local users only */}
          {!isGoogle && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Enter your password to confirm
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your current password"
                className="w-full border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-red-400 transition-colors"
                autoComplete="current-password"
              />
            </div>
          )}

          {/* Type-to-confirm */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Type <span className="font-mono text-red-500 bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded text-xs">{CONFIRM_PHRASE}</span> to confirm
            </label>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={CONFIRM_PHRASE}
              className="w-full border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-red-400 transition-colors"
              autoComplete="off"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!ready || isDeleting}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-900/40 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                '🗑️ Delete My Account'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────
export default function AccountSettingsPage() {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const { user, deletingAccount } = useSelector((s) => s.auth)

  const [showModal, setShowModal] = useState(false)

  const handleDeleteConfirm = async (payload) => {
    const result = await dispatch(deleteAccount(payload))
    if (deleteAccount.fulfilled.match(result)) {
      // State is already cleared by the slice; redirect to landing
      navigate('/', { replace: true })
    }
    // On failure the slice sets toast + error — modal stays open
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login', { replace: true })
  }

  const isGoogle = user?.authProvider === 'google'

  return (
    <div className="max-w-2xl mx-auto animate-fade-in pb-10">
      <div className="page-header">
        <h1 className="page-title">Account Settings</h1>
        <p className="page-subtitle">Manage your account preferences and security</p>
      </div>

      {/* ── Account Info ─────────────────────────────── */}
      <div className="card mb-5">
        <h2 className="font-display font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 text-base">
          <span className="w-7 h-7 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg flex items-center justify-center text-sm">👤</span>
          Account Information
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 font-bold text-xl flex-shrink-0">
              {user?.avatar
                ? <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-full object-cover" />
                : user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-semibold text-slate-800 dark:text-white">{user?.name}</p>
              <p className="text-sm text-slate-400">{user?.email}</p>
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${
                isGoogle
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                  : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'
              }`}>
                {isGoogle ? '🔵 Google Account' : '✉️ Email Account'}
              </span>
            </div>
          </div>
          <div className="text-xs text-slate-400 border-t border-slate-100 dark:border-slate-700 pt-3">
            Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
          </div>
        </div>
      </div>

      {/* ── Session ──────────────────────────────────── */}
      <div className="card mb-5">
        <h2 className="font-display font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 text-base">
          <span className="w-7 h-7 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center text-sm">🔐</span>
          Session
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Sign out of your account on this device. Your data will remain intact.
        </p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          🚪 Sign Out
        </button>
      </div>

      {/* ── Danger Zone ──────────────────────────────── */}
      <div className="card border-2 border-red-100 dark:border-red-900/40">
        <h2 className="font-display font-bold text-red-600 dark:text-red-400 mb-1 flex items-center gap-2 text-base">
          <span className="w-7 h-7 bg-red-100 dark:bg-red-900/40 rounded-lg flex items-center justify-center text-sm">⚠️</span>
          Danger Zone
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
          Once you delete your account, there is no going back. All your data —
          health profile, meal plans, grocery lists, and progress — will be
          permanently erased. This action <strong className="text-slate-700 dark:text-slate-200">cannot be undone</strong>.
        </p>

        {isGoogle && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl text-xs text-blue-700 dark:text-blue-400">
            <strong>Google account:</strong> Your DIETORA account will be deleted, but your Google account itself is unaffected. You can always create a new DIETORA account later.
          </div>
        )}

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
        >
          🗑️ Delete My Account
        </button>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <DeleteAccountModal
          user={user}
          isDeleting={deletingAccount}
          onClose={() => setShowModal(false)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  )
}
