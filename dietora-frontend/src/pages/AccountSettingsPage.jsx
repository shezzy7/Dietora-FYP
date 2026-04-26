// src/pages/AccountSettingsPage.jsx
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { logout, deleteAccount, resetAccount } from '../store/slices/authSlice'
import { useUrdu } from '../context/UrduContext'
import {
  User, Mail, Shield, Calendar, Edit3, LogOut,
  Trash2, RotateCcw, AlertTriangle, X, Eye, EyeOff, Loader2,
} from 'lucide-react'

function ConfirmModal({ type, user, isProcessing, onClose, onConfirm, isUrdu }) {
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const isGoogle = user?.authProvider === 'google'

  const ur = (en, ur) => isUrdu ? ur : en

  const config = {
    delete: {
      titleEn: 'Delete Account',          titleUr: 'اکاؤنٹ حذف کریں',
      subtitleEn: 'This action is permanent and irreversible', subtitleUr: 'یہ عمل مستقل اور ناقابل واپسی ہے',
      icon: Trash2, iconBg: 'bg-red-100 dark:bg-red-900/30', iconColor: 'text-red-500',
      warnBg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      warnText: 'text-red-700 dark:text-red-300',
      warningEn: 'This will permanently delete your account and ALL your data — health profile, meal plans, grocery lists, progress, and feedback.',
      warningUr: 'یہ آپ کا اکاؤنٹ اور تمام ڈیٹا مستقل طور پر حذف کر دے گا — صحت پروفائل، کھانے کے منصوبے، گروسری فہرستیں، پیش رفت اور رائے۔',
      btnLabelEn: 'Delete Permanently', btnLabelUr: 'مستقل حذف کریں',
      btnColor: 'bg-red-500 hover:bg-red-600',
    },
    reset: {
      titleEn: 'Reset Account',           titleUr: 'اکاؤنٹ ری سیٹ کریں',
      subtitleEn: 'Your account stays, all data gets erased', subtitleUr: 'اکاؤنٹ رہے گا، تمام ڈیٹا مٹ جائے گا',
      icon: RotateCcw, iconBg: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-500',
      warnBg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
      warnText: 'text-amber-700 dark:text-amber-300',
      warningEn: 'This will erase all your activity — health profile, meal plans, grocery lists, progress history, and feedback. Your login credentials will be preserved.',
      warningUr: 'یہ آپ کی تمام سرگرمی مٹا دے گا — صحت پروفائل، کھانے کے منصوبے، گروسری فہرستیں، پیش رفت اور رائے۔ آپ کی لاگ ان معلومات محفوظ رہیں گی۔',
      btnLabelEn: 'Reset My Account', btnLabelUr: 'میرا اکاؤنٹ ری سیٹ کریں',
      btnColor: 'bg-amber-500 hover:bg-amber-600',
    },
  }

  const cfg     = config[type]
  const IconComp = cfg.icon

  const handleSubmit = async () => {
    setError('')
    if (!isGoogle && !password.trim()) {
      setError(ur('Please enter your password to confirm.', 'تصدیق کے لیے اپنا پاس ورڈ درج کریں۔'))
      return
    }
    try {
      await onConfirm(isGoogle ? {} : { password })
    } catch (err) {
      setError(err || ur('Operation failed. Please try again.', 'آپریشن ناکام ہوا۔ دوبارہ کوشش کریں۔'))
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={() => !isProcessing && onClose()}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'acctModalIn 0.25s ease-out', fontFamily: isUrdu ? "'Noto Nastaliq Urdu', serif" : undefined }}>

        <div className="flex items-center gap-3 px-6 pt-6 pb-2">
          <div className={`w-10 h-10 rounded-full ${cfg.iconBg} flex items-center justify-center flex-shrink-0`}>
            <IconComp className={`w-5 h-5 ${cfg.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{isUrdu ? cfg.titleUr : cfg.titleEn}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{isUrdu ? cfg.subtitleUr : cfg.subtitleEn}</p>
          </div>
          <button onClick={onClose} disabled={isProcessing}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4">
          <div className={`${cfg.warnBg} border rounded-xl p-4 mb-4`}>
            <p className={`text-sm leading-relaxed ${cfg.warnText}`}>
              <strong>{ur('Warning:', 'انتباہ:')}</strong> {isUrdu ? cfg.warningUr : cfg.warningEn}
            </p>
          </div>

          {!isGoogle && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {ur('Enter your password to confirm', 'تصدیق کے لیے اپنا پاس ورڈ درج کریں')}
              </label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  placeholder={ur('Your current password', 'آپ کا موجودہ پاس ورڈ')}
                  disabled={isProcessing}
                  className="w-full px-4 py-2.5 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition-all disabled:opacity-50"
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {isGoogle && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {ur('Since you signed in with Google, click the button below to confirm.', 'چونکہ آپ نے گوگل سے سائن ان کیا ہے، تصدیق کے لیے نیچے بٹن دبائیں۔')}
            </p>
          )}

          {error && <p className="mt-3 text-sm text-red-500 dark:text-red-400 font-medium">{error}</p>}
        </div>

        <div className="flex items-center gap-3 px-6 pb-6">
          <button onClick={onClose} disabled={isProcessing}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50">
            {ur('Cancel', 'منسوخ')}
          </button>
          <button onClick={handleSubmit} disabled={isProcessing}
            className={`flex-1 px-4 py-2.5 text-sm font-semibold text-white ${cfg.btnColor} rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed`}>
            {isProcessing
              ? <><Loader2 className="w-4 h-4 animate-spin" /> {ur('Processing...', 'کارروائی جاری ہے...')}</>
              : <><IconComp className="w-4 h-4" /> {isUrdu ? cfg.btnLabelUr : cfg.btnLabelEn}</>
            }
          </button>
        </div>
      </div>
      <style>{`@keyframes acctModalIn { from { opacity:0; transform:scale(0.95) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  )
}

export default function AccountSettingsPage() {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const { user, deletingAccount, resettingAccount } = useSelector((s) => s.auth)
  const { isUrdu } = useUrdu()

  const [modal, setModal] = useState(null)

  const ur = (en, ur) => isUrdu ? ur : en
  const isGoogle   = user?.authProvider === 'google'
  const isProcessing = deletingAccount || resettingAccount

  const handleConfirm = async (payload) => {
    if (modal === 'delete') {
      await dispatch(deleteAccount(payload)).unwrap()
      navigate('/login', { replace: true })
    } else {
      await dispatch(resetAccount(payload)).unwrap()
      setModal(null)
    }
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login', { replace: true })
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in pb-10" style={isUrdu ? { fontFamily: "'Noto Nastaliq Urdu', serif" } : {}}>
      <div className="page-header">
        <h1 className="page-title">{ur('Manage My Account', 'میرا اکاؤنٹ')}</h1>
        <p className="page-subtitle">{ur('View your info, edit profile, or manage your account', 'اپنی معلومات دیکھیں، پروفائل ترمیم کریں یا اکاؤنٹ کا انتظام کریں')}</p>
      </div>

      {/* ── Account Info ──────────────────────────────── */}
      <div className="card mb-5">
        <h2 className="font-display font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 text-base">
          <span className="w-7 h-7 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg flex items-center justify-center">
            <User className="w-4 h-4 text-emerald-600" />
          </span>
          {ur('Account Information', 'اکاؤنٹ کی معلومات')}
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 font-bold text-xl flex-shrink-0">
              {user?.avatar
                ? <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-full object-cover" />
                : user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 dark:text-white text-lg">{user?.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-sm text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-400">{ur('Auth Provider', 'تصدیق فراہم کنندہ')}</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {isGoogle ? '🔵 Google' : `✉️ ${ur('Email / Password', 'ای میل / پاس ورڈ')}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-400">{ur('Member Since', 'رکنیت کی تاریخ')}</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                    : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit Profile ──────────────────────────────── */}
      <div className="card mb-5">
        <h2 className="font-display font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2 text-base">
          <span className="w-7 h-7 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
            <Edit3 className="w-4 h-4 text-blue-600" />
          </span>
          {ur('Health Profile', 'صحت پروفائل')}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 ml-9">
          {ur('Update your weight, height, medical conditions, allergies, and daily budget.', 'اپنا وزن، قد، طبی حالات، الرجی اور روزانہ بجٹ اپ ڈیٹ کریں۔')}
        </p>
        <div className="ml-9">
          <Link to="/profile"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-sm font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors">
            <Edit3 className="w-4 h-4" />
            {ur('Edit Health Profile', 'صحت پروفائل ترمیم کریں')}
          </Link>
        </div>
      </div>

      {/* ── Account Actions ───────────────────────────── */}
      <div className="card border-2 border-slate-200 dark:border-slate-700">
        <h2 className="font-display font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2 text-base">
          <span className="w-7 h-7 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-slate-500" />
          </span>
          {ur('Account Actions', 'اکاؤنٹ اقدامات')}
        </h2>
        <p className="text-sm text-slate-400 mb-6 ml-9">
          {ur('Sign out, reset data, or delete your account', 'سائن آؤٹ کریں، ڈیٹا ری سیٹ کریں یا اکاؤنٹ حذف کریں')}
        </p>

        <div className="space-y-3 ml-9">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group text-left">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <LogOut className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 dark:text-white text-sm">{ur('Sign Out', 'سائن آؤٹ')}</p>
              <p className="text-xs text-slate-400 mt-0.5">{ur('Log out of your account on this device', 'اس ڈیوائس پر اپنے اکاؤنٹ سے لاگ آؤٹ کریں')}</p>
            </div>
          </button>

          <button onClick={() => setModal('reset')}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-amber-100 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-900/5 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all group text-left">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <RotateCcw className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 dark:text-white text-sm">{ur('Reset Account', 'اکاؤنٹ ری سیٹ کریں')}</p>
              <p className="text-xs text-slate-400 mt-0.5">{ur('Clear all data but keep your account', 'تمام ڈیٹا صاف کریں لیکن اکاؤنٹ رکھیں')}</p>
            </div>
          </button>

          <button onClick={() => setModal('delete')}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-red-100 dark:border-red-900/40 bg-red-50/30 dark:bg-red-900/5 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group text-left">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 dark:text-white text-sm">{ur('Delete Account', 'اکاؤنٹ حذف کریں')}</p>
              <p className="text-xs text-slate-400 mt-0.5">{ur('Permanently remove your account and all data', 'اپنا اکاؤنٹ اور تمام ڈیٹا مستقل طور پر حذف کریں')}</p>
            </div>
          </button>
        </div>
      </div>

      {modal && (
        <ConfirmModal
          type={modal} user={user} isProcessing={isProcessing} isUrdu={isUrdu}
          onClose={() => !isProcessing && setModal(null)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  )
}
