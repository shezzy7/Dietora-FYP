// src/pages/auth/LoginPage.jsx

import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { loginUser } from '../../store/slices/authSlice'
import GoogleAuthButton from '../../components/auth/GoogleAuthButton'
import { Check, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const dispatch = useDispatch()
  const { loading, token } = useSelector((s) => s.auth)
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})

  if (token) return <Navigate to="/dashboard" replace />

  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'Min 6 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) dispatch(loginUser(form))
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left decorative panel ─────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 to-teal-700 p-12 flex-col justify-between">
        <div>
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-2xl text-white">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-white font-black">D</span>
            </div>
            DIETORA
          </Link>
        </div>
        <div>
          <h2 className="font-display text-4xl font-bold text-white leading-tight">
            Your personal<br />nutrition guide<br />awaits you.
          </h2>
          <p className="text-emerald-100 mt-4 leading-relaxed">
            Log in to access your AI-generated meal plans, grocery lists, and health progress —
            all tailored for Pakistani dietary needs.
          </p>
          <div className="mt-8 space-y-3">
            {['Personalized 7-day meal plans', 'Disease-safe food filtering', 'Budget optimization in PKR'].map((item) => (
              <div key={item} className="flex items-center gap-2 text-white">
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs">
                  <Check className="w-3 h-3" />
                </div>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-emerald-200 text-xs">© 2025 DIETORA — FYP Project</p>
      </div>

      {/* ── Right: Login form ─────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-slate-900">
        <div className="w-full max-w-md animate-slide-up">

          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl text-emerald-600">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-black">D</span>
              </div>
              DIETORA
            </Link>
          </div>

          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Welcome back</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 mb-8">Sign in to your account</p>

          {/* ── Google Sign-In ─────────────────────────── */}
          <GoogleAuthButton label="Continue with Google" />

          {/* ── Divider ──────────────────────────────────── */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">or sign in with email</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          </div>

          {/* ── Email / Password form ─────────────────────── */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className={`input-field ${errors.email ? 'border-red-400 focus:ring-red-400' : ''}`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className={`input-field ${errors.password ? 'border-red-400 focus:ring-red-400' : ''}`}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-emerald-600 hover:text-emerald-700 font-semibold">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
