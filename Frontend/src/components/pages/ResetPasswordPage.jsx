import { useState } from 'react'
import { ArrowRight, Check, ChevronLeft, KeyRound, LoaderCircle } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../../api'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    if (password !== confirmPassword) {
      setError('Those passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post('/auth/reset-password', { token, password })
      setSuccess(data.message)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not reset your password. Please request a new link.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-art"><div className="auth-art-content"><span className="auth-art-icon"><KeyRound size={24} /></span><p className="eyebrow">A FRESH START</p><h1>Back to<br /><em>your story.</em></h1><p>Choose a new password to get back to your movie nights.</p></div></section>
      <section className="auth-form-wrap"><div className="auth-form-card">
        <Link className="back-link" to="/login"><ChevronLeft size={15} /> Back to sign in</Link>
        <p className="eyebrow">ACCOUNT RECOVERY</p><h2>Set a new password.</h2>
        <p className="auth-subtitle">Choose a password with at least 8 characters.</p>
        {success ? <><p className="auth-reset-notice" role="status"><Check size={15} />{success}</p><button className="button button-gold auth-submit" onClick={() => navigate('/login')}>Sign in <ArrowRight size={16} /></button></>
          : <form onSubmit={submit}>
            <label className="form-label">New password<input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /></label>
            <label className="form-label">Confirm new password<input required minLength={8} type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Enter the password again" /></label>
            {error && <p className="form-error">{error}</p>}
            <button className="button button-gold auth-submit" disabled={loading || !token}>{loading ? <><LoaderCircle className="spin" size={16} /> Updating...</> : <>Reset password <ArrowRight size={16} /></>}</button>
          </form>}
        {!token && <p className="form-error">This reset link is missing its token. Request a new link to continue.</p>}
      </div></section>
    </main>
  )
}
