import { useEffect, useState } from 'react'
import { ArrowRight, CalendarDays, Check, MailCheck, MailWarning, MapPin, Printer, Sparkles, TicketCheck, X } from 'lucide-react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth'
import { api } from '../../api'
import { currency, displayDate, displayTime, paymentMethodLabel } from '../../utils'
import PageLoader from '../PageLoader'

export default function BookingHistory() {
  const { user } = useAuth()
  const location = useLocation()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState(location.state?.booking ? '' : location.state?.message || '')
  const newBooking = location.state?.booking
  const emailSent = location.state?.emailSent === true
  const [cancelling, setCancelling] = useState('')

  useEffect(() => {
    if (!user || user.role === 'admin' || user.role === 'theaterOwner') return
    api.get('/bookings/mine')
      .then(({ data }) => setTransactions(data.transactions || []))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Could not load your tickets.'))
      .finally(() => setLoading(false))
  }, [user])

  const cancel = async (id) => {
    setCancelling(id)
    setError('')
    try {
      const { data } = await api.patch(`/bookings/${id}/cancel`)
      setMessage(data.message)
      setTransactions((current) => current.map((item) => item._id === id ? { ...item, status: 'cancelled', paymentStatus: 'refunded' } : item))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not cancel this booking.')
    } finally {
      setCancelling('')
    }
  }

  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin' || user.role === 'theaterOwner') return <Navigate to="/manage" replace />

  return (
    <main className="page-shell container">
      <div className="page-intro booking-intro"><p className="eyebrow">YOUR LITTLE STACK OF MEMORIES</p><h1>My <em>tickets.</em></h1><p>Every great movie night, all in one place.</p><span className="welcome-chip">Good to have you, {user.name.split(' ')[0]} <Sparkles size={14} /></span></div>
      {newBooking && <section className={`booking-confirmation ${emailSent ? 'confirmation-email-sent' : 'confirmation-email-pending'}`} aria-live="polite">
        <div className="confirmation-icon">{emailSent ? <MailCheck size={23} /> : <MailWarning size={23} />}</div>
        <div className="confirmation-copy">
          <p className="eyebrow">{emailSent ? 'TICKET EMAIL SENT' : 'BOOKING CONFIRMED'}</p>
          <h2>{emailSent ? 'Check your inbox.' : 'Your seats are saved.'}</h2>
          <p>{emailSent
            ? <>We sent your ticket confirmation to <strong>{user.email}</strong>. Your booking is ready below, too.</>
            : <>Your booking is confirmed, but we couldn’t send the email. Your tickets are saved below.</>}</p>
          <span className="confirmation-code">TEST PAYMENT · {paymentMethodLabel(newBooking.paymentMethod)}{newBooking.bookingCode && <> · BOOKING CODE <strong>{newBooking.bookingCode}</strong></>}</span>
        </div>
        <a className="button button-quiet confirmation-action" href="#your-tickets">View your tickets <ArrowRight size={15} /></a>
      </section>}
      {message && <div className="inline-success"><Check size={16} />{message}<button className="icon-button" onClick={() => setMessage('')} aria-label="Dismiss"><X size={15} /></button></div>}
      {error && <div className="inline-error">{error}</div>}
      {loading ? <PageLoader message="Gathering your tickets..." />
        : transactions.length ? <div className="booking-list" id="your-tickets">{transactions.map((booking) => <article className={`booking-card ${booking.status === 'cancelled' ? 'booking-cancelled' : ''}`} key={booking._id}>
          <div className="booking-poster">{booking.movie?.poster && <img src={booking.movie.poster} alt="" />}</div>
          <div className="booking-info"><div className="booking-status">{booking.status === 'confirmed' ? <><span className="status-dot" /> CONFIRMED</> : <><span className="status-dot cancelled-dot" /> CANCELLED</>}</div><h2>{booking.movie?.title || 'Movie ticket'}</h2><p><MapPin size={14} /> {booking.theater?.name} · {booking.theater?.city}</p><p><CalendarDays size={14} /> {booking.showtime?.startsAt ? `${displayDate(booking.showtime.startsAt)} · ${displayTime(booking.showtime.startsAt)}` : 'Showtime details unavailable'}</p></div>
          <div className="booking-ticket-detail"><span>SEATS</span><strong>{booking.seats.join(' · ')}</strong><span className="booking-code">{booking.bookingCode}</span></div>
          <div className="booking-price"><strong>{currency(booking.amount)}</strong><span>PAYMENT · {paymentMethodLabel(booking.paymentMethod)}</span><button className="ticket-print" onClick={() => window.print()}><Printer size={14} /> Print ticket</button>{booking.status === 'confirmed' && <button className="cancel-ticket" disabled={cancelling === booking._id} onClick={() => cancel(booking._id)}>{cancelling === booking._id ? 'Cancelling...' : 'Cancel booking'}</button>}</div>
        </article>)}</div>
          : <div className="empty-state empty-large"><TicketCheck size={28} /><h3>No tickets just yet</h3><p>Your next favourite film is waiting to be discovered.</p><Link className="button button-gold" to="/">Explore films <ArrowRight size={15} /></Link></div>}
    </main>
  )
}
