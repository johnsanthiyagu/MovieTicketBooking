import { useState } from 'react'
import { Film, LogIn, LogOut, Menu, Sparkles, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth'

export default function Navigation() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const accountType = user?.role === 'admin' ? 'Admin' : user?.role === 'theaterOwner' ? 'Theatre owner' : 'User'

  return (
    <header className="site-header">
      <div className="topline"><Sparkles size={13} /> A better night out starts here <span>·</span> Book in a few taps</div>
      <nav className="nav container">
        <Link className="brand" to="/" onClick={close} aria-label="Lumière home">
          <span className="brand-mark"><Film size={20} strokeWidth={1.8} /></span>
          <span className="brand-name">lumière<span>.</span><small>THE MOVIE CLUB</small></span>
        </Link>
        <button className="mobile-menu icon-button" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
        <div className={`nav-links ${open ? 'nav-open' : ''}`}>
          <Link to="/" onClick={close}>Explore</Link>
          <Link to="/theaters" onClick={close}>Theatres</Link>
          {user && user.role !== 'admin' && user.role !== 'theaterOwner' && <Link to="/bookings" onClick={close}>My tickets</Link>}
          {(user?.role === 'admin' || user?.role === 'theaterOwner') && <Link to="/manage" onClick={close}>Manage</Link>}
          {user ? (
            <>
              <div className="nav-user" aria-label={`Signed in as ${user.name}, ${user.email}, ${accountType}`}>
                <strong>{user.name}</strong>
                <span>{user.email}</span>
                <small>{accountType} account</small>
              </div>
              <button className="nav-account" onClick={() => { logout(); close() }}><LogOut size={15} /> Sign out</button>
            </>
          ) : (
            <Link className="nav-signin" to="/login" onClick={close}><LogIn size={15} /> Sign in</Link>
          )}
        </div>
      </nav>
    </header>
  )
}
