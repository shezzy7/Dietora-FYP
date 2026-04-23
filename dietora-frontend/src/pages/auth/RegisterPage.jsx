// src/pages/auth/RegisterPage.jsx

import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { registerUser } from '../../store/slices/authSlice'
import GoogleAuthButton from '../../components/auth/GoogleAuthButton'
import { Target, Banknote, Salad, BarChart3, Loader2 } from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// Field is defined OUTSIDE RegisterPage so React never remounts
// it mid-render (which would cause the input to lose focus).
// ─────────────────────────────────────────────────────────────
const Field = ({ label, name, type = 'text', placeholder, value, onChange, error }) => (
  <div>
    <label className="label">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete={
        name === 'password' ? 'new-password'
        : name === 'confirmPassword' ? 'new-password'
        : name === 'email' ? 'email'
        : 'on'
      }
      className={`input-field ${error ? 'border-red-400 focus:ring-red-400' : ''}`}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
)

export default function RegisterPage() {
  const dispatch = useDispatch()
  const { loading, token } = useSelector((s) => s.auth)
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})

  // Already logged in → go to dashboard
  if (token) return <Navigate to="/dashboard" replace />

  // ── Validation ────────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (!form.name.trim())              e.name = 'Name is required'
    else if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters'

    if (!form.email)                    e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email address'

    if (!form.password)                 e.password = 'Password is required'
    else if (form.password.length < 6)  e.password = 'Min 6 characters'

    if (!form.confirmPassword)          e.confirmPassword = 'Please confirm your password'
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'

    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Handlers ─────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) {
      dispatch(registerUser({ name: form.name.trim(), email: form.email, password: form.password }))
    }
  }

  const handleChange = (name) => (e) => setForm((prev) => ({ ...prev, [name]: e.target.value }))

  // ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex">

      {/* ── Left decorative panel ─────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-600 to-emerald-700 p-12 flex-col justify-between">
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
            Start eating<br />smarter with<br />AI nutrition.
          </h2>
          <p className="text-emerald-100 mt-4 leading-relaxed">
            Create your free account and get your first AI-generated meal plan in under 2 minutes.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { icon: Target, text: 'Disease-aware' },
              { icon: Banknote, text: 'Budget-friendly' },
              { icon: Salad, text: 'Pakistani foods' },
              { icon: BarChart3, text: 'Track progress' },
            ].map((item) => (
              <div key={item.text} className="bg-white/10 rounded-xl p-3 flex items-center gap-2">
                <span className="text-white"><item.icon className="w-5 h-5" /></span>
                <span className="text-white text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-emerald-200 text-xs space-y-0.5">
          <p>© 2025 DIETORA — FYP Project</p>
          <p>Government College University Faisalabad — CS Batch 2022–2026</p>
          <p>Team: Shahzad Hussain · Zainab Saleem · Hanzla Faiz</p>
        </div>
      </div>

      {/* ── Right: Registration form ───────────────────── */}
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

          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Create account</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 mb-6">Join DIETORA — it's completely free</p>

          {/* ── Google Sign-Up ────────────────────────────── */}
          {/*
            GoogleAuthButton works identically for sign-up and sign-in.
            When a new Google user hits POST /api/v1/auth/google the backend
            detects they don't exist in MongoDB, creates them, and returns
            the welcome message "Welcome to DIETORA, <name>! 🎉".
          */}
          <GoogleAuthButton label="Sign up with Google" />

          {/* ── Divider ──────────────────────────────────── */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              or create account with email
            </span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          </div>

          {/* ── Email / Password form ─────────────────────── */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Field
              label="Full Name"
              name="name"
              placeholder="Muhammad Ali"
              value={form.name}
              onChange={handleChange('name')}
              error={errors.name}
            />
            <Field
              label="Email Address"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange('email')}
              error={errors.email}
            />
            <Field
              label="Password"
              name="password"
              type="password"
              placeholder="Min 6 characters"
              value={form.password}
              onChange={handleChange('password')}
              error={errors.password}
            />
            <Field
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              placeholder="Repeat password"
              value={form.confirmPassword}
              onChange={handleChange('confirmPassword')}
              error={errors.confirmPassword}
            />

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </span>
              ) : 'Create Free Account'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-4">
            By registering you agree to our terms. No spam, ever.
          </p>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
