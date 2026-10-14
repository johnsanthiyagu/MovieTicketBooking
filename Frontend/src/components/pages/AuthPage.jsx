import { useState } from 'react'
import { ArrowRight, ChevronLeft, Film, KeyRound, LoaderCircle, Mail, Star } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth'
import { api } from '../../api'

export default function AuthPage() {
  const { login, register, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState(() => location.state?.mode === 'forgot' ? 'forgot' : 'login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [roleChoice, setRoleChoice] = useState('user')
  const [adminRegistrationCode, setAdminRegistrationCode] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  if (user) return <Navigate to={user.role === 'admin' || user.role === 'theaterOwner' ? '/manage' : '/bookings'} replace />

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setLoading(true)
    try {
      if (mode === 'forgot') {
        const { data } = await api.post('/auth/forgot-password', { email: form.email })
        setNotice(data.message)
      } else {
        const account = mode === 'login'
          ? await login(form.email, form.password, roleChoice)
          : await register(form.name, form.email, form.password, roleChoice, adminRegistrationCode)
        navigate(location.state?.returnTo || (account.role === 'admin' || account.role === 'theaterOwner' ? '/manage' : '/bookings'))
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not connect to the API. Please check the server.')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setError('')
    setNotice('')
  }

  return (
    <main className="auth-layout">
      <section className="auth-art"><div className="auth-art-content"><span className="auth-art-icon"><Film size={24} /></span><p className="eyebrow">LIGHTS DOWN. WORLD OFF.</p><h1>Every seat<br />has a <em>story.</em></h1><p>Find your film. Bring your people. We’ll save you a seat.</p><div className="auth-art-bottom"><span><Star size={13} fill="currentColor" /> A little more cinema, a little less ordinary.</span></div></div></section>
      <section className="auth-form-wrap">
        <div className="auth-form-card"><Link className="back-link" to="/"><ChevronLeft size={15} /> Back to exploring</Link><p className="eyebrow">{mode === 'login' ? 'GOOD TO SEE YOU AGAIN' : mode === 'register' ? 'YOUR NEXT CHAPTER' : 'ACCOUNT RECOVERY'}</p><h2>{mode === 'login' ? 'Welcome back.' : mode === 'register' ? 'Join the club.' : 'Forgot your password?'}</h2><p className="auth-subtitle">{mode === 'login' ? 'Your next movie night is just around the corner.' : mode === 'register' ? 'Create an account and let the good stories find you.' : 'Enter your account email and we’ll send a secure reset link if it matches an account.'}</p>
          {mode === 'login' && <p className="auth-role-note"><KeyRound size={14} /> Choose the account type assigned to your email. Manager accounts open the studio desk.</p>}
          <form onSubmit={submit}>
            {mode !== 'forgot' && <fieldset className="account-role-picker"><legend>Account type</legend><div>{[['user', 'User'], ['theaterOwner', 'Theatre owner'], ['admin', 'Admin']].map(([value, label]) => <label className={roleChoice === value ? 'account-role-selected' : ''} key={value}><input type="radio" name="accountRole" value={value} checked={roleChoice === value} onChange={() => setRoleChoice(value)} /><span>{label}</span></label>)}</div></fieldset>}
            {mode === 'register' && <label className="form-label">Your name<input required autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="First and last name" /></label>}
            {mode === 'register' && roleChoice === 'admin' && <label className="form-label">Admin invitation code<input required autoComplete="off" value={adminRegistrationCode} onChange={(event) => setAdminRegistrationCode(event.target.value)} /></label>}
            <label className="form-label">{mode === 'forgot' ? 'Account email address' : 'Email address'}<input required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></label>
            {mode !== 'forgot' && <label className="form-label">Password<input required minLength={mode === 'register' ? 8 : 1} type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'} /></label>}
            {error && <p className="form-error">{error}</p>}
            {notice && <p className="auth-reset-notice" role="status"><Mail size={15} />{notice}</p>}
            <button className="button button-gold auth-submit" disabled={loading}>{loading ? <><LoaderCircle className="spin" size={16} /> One moment...</> : <>{mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : 'Send reset link'} <ArrowRight size={16} /></>}</button>
          </form>
          {mode === 'login' && <p className="auth-forgot"><button onClick={() => switchMode('forgot')}>Forgot password?</button></p>}
          {mode !== 'forgot' && <p className="auth-switch">{mode === 'login' ? 'New to Lumière?' : 'Already have an account?'} <button onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p>}
          {mode === 'forgot' && <p className="auth-switch">Remembered it? <button onClick={() => switchMode('login')}>Back to sign in</button></p>}
          <p className="auth-terms">By continuing, you agree to our Terms of Service and Privacy Policy.</p>
        </div>
      </section>
    </main>
  )
}
