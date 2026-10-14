import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CalendarDays, ChevronLeft, CreditCard, LoaderCircle, MapPin, ShieldCheck } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth'
import { api } from '../../api'
import { currency, displayDate, displayTime, loadRazorpayCheckout } from '../../utils'
import PageLoader from '../PageLoader'

export default function SeatPage() {
  const { showtimeId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showtime, setShowtime] = useState(null)
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const isStaff = user?.role === 'admin' || user?.role === 'theaterOwner'

  useEffect(() => {
    if (isStaff) return
    let active = true
    api.get(`/theaters/showtimes/${showtimeId}`)
      .then(({ data }) => { if (active) setShowtime(data.showtime) })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'Could not load this seat map.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [showtimeId, isStaff])

  const seatRows = useMemo(() => {
    if (!showtime) return []
    return Object.groupBy
      ? Object.values(Object.groupBy(showtime.seats, (seat) => seat.row))
      : showtime.seats.reduce((rows, seat) => {
        const existing = rows.find((row) => row[0]?.row === seat.row)
        if (existing) existing.push(seat)
        else rows.push([seat])
        return rows
      }, [])
  }, [showtime])
  const selectedSeats = showtime?.seats.filter((seat) => selected.includes(seat.label)) || []
  const total = selectedSeats.reduce((sum, seat) => sum + seat.price, 0)
  const toggleSeat = (seat) => {
    if (seat.status !== 'available') return
    setSelected((current) => current.includes(seat.label)
      ? current.filter((label) => label !== seat.label)
      : current.length < 10 ? [...current, seat.label] : current)
  }

  const bookSeats = async () => {
    if (!user) return navigate('/login', { state: { returnTo: `/seats/${showtimeId}` } })
    if (!selected.length) return setError('Please choose at least one available seat.')
    setSubmitting(true)
    setError('')
    try {
      const { data: orderData } = await api.post('/bookings/razorpay/order', { showtimeId, seats: selected })
      if (!await loadRazorpayCheckout()) throw new Error('Razorpay Checkout could not be loaded. Check your connection and try again.')
      const checkout = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'Lumière',
        description: `${selected.length} ticket${selected.length === 1 ? '' : 's'} · ${showtime.movie.title}`,
        order_id: orderData.order.id,
        prefill: { name: user.name, email: user.email },
        theme: { color: '#d6b879' },
        handler: async (paymentResponse) => {
          try {
            const { data } = await api.post('/bookings/razorpay/verify', paymentResponse)
            navigate('/bookings', { state: { booking: data.transaction, emailSent: data.emailSent, message: data.message } })
          } catch (requestError) {
            setError(requestError.response?.data?.message || 'Payment verification failed. Contact support with your Razorpay payment ID.')
            setSubmitting(false)
          }
        },
        modal: { ondismiss: () => setSubmitting(false) },
      })
      checkout.on('payment.failed', (event) => {
        setError(event.error?.description || 'Razorpay payment failed. Your seats will be released shortly.')
        setSubmitting(false)
      })
      checkout.open()
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Booking could not be completed. Please try again.')
      setSubmitting(false)
      if (requestError.response?.status === 409) {
        const { data } = await api.get(`/theaters/showtimes/${showtimeId}`)
        setShowtime(data.showtime)
        setSelected([])
      }
    }
  }

  if (isStaff) return <Navigate to="/manage" replace />
  if (loading) return <main className="page-shell container"><PageLoader message="Preparing the seating plan..." /></main>
  if (!showtime) return <main className="page-shell container"><div className="inline-error">{error || 'This showtime is no longer available.'}</div></main>

  return (
    <main className="page-shell container seat-page">
      <Link className="back-link" to={`/showtimes/${showtime.movie._id}`}><ChevronLeft size={16} /> Back to showtimes</Link>
      <div className="seat-page-title"><div><p className="eyebrow">YOUR EVENING, YOUR SEAT</p><h1>Pick your <em>perfect spot.</em></h1><p>{showtime.movie.title} <span>·</span> {showtime.theater.name} <span>·</span> {displayDate(showtime.startsAt)}, {displayTime(showtime.startsAt)}</p></div><span className="format-pill">{showtime.format} · {showtime.seats.length} SEATS</span></div>
      <div className="seat-layout">
        <section className="seat-map-panel">
          <div className="screen-area"><span className="screen-glow" /><span className="screen-label">ALL EYES THIS WAY</span><div className="screen-curve" /></div>
          <div className="seat-legend"><span><i className="legend-seat available" /> Available</span><span><i className="legend-seat selected" /> Selected</span><span><i className="legend-seat booked" /> Unavailable</span><span><i className="legend-seat premium" /> Premium</span></div>
          <div className="seat-map" aria-label="Select seats">
            {seatRows.map((row) => <div className="seat-row" key={row[0]?.row}><span className="row-label">{row[0]?.row}</span><div className="seat-row-chairs">
              {row.map((seat, index) => <span className={index === 9 ? 'seat-aisle-wrap' : ''} key={seat.label}>
                <button
                  className={`seat ${seat.status !== 'available' ? 'seat-booked' : ''} ${seat.type === 'premium' ? 'seat-premium' : ''} ${selected.includes(seat.label) ? 'seat-selected' : ''}`}
                  disabled={seat.status !== 'available'}
                  title={`${seat.label} · ${seat.type} · ${currency(seat.price)}${seat.status !== 'available' ? ' · Unavailable' : ''}`}
                  aria-label={`Seat ${seat.label}, ${seat.status}, ${currency(seat.price)}`}
                  onClick={() => toggleSeat(seat)}
                >{seat.number}</button>
              </span>)}
            </div><span className="row-label">{row[0]?.row}</span></div>)}
          </div>
          <div className="row-exit"><span>EXIT</span><i /><span>EXIT</span></div>
          <p className="seat-hint">Seats are held for 10 minutes during Razorpay test checkout. Maximum 10 seats per order.</p>
        </section>
        <aside className="order-summary">
          <p className="eyebrow">YOUR EVENING</p>
          <h2>Ticket summary</h2>
          <div className="summary-film"><div className="summary-poster">{showtime.movie.poster && <img src={showtime.movie.poster} alt="" />}</div><div><strong>{showtime.movie.title}</strong><span>{showtime.movie.genre?.[0] || 'Cinema'} · {showtime.format}</span></div></div>
          <div className="summary-line"><span><CalendarDays size={14} /> {displayDate(showtime.startsAt)}</span><strong>{displayTime(showtime.startsAt)}</strong></div>
          <div className="summary-line"><span><MapPin size={14} /> {showtime.theater.name}</span></div>
          <div className="summary-seats"><span>YOUR SEATS</span><div>{selected.length ? selected.map((label) => <i key={label}>{label}</i>) : <small>No seats selected yet</small>}</div></div>
          <div className="summary-total"><span>{selected.length} {selected.length === 1 ? 'ticket' : 'tickets'}</span><strong>{currency(total)}</strong></div>
          <div className="demo-payment"><ShieldCheck size={15} /><span><b>Razorpay test checkout</b><br />Test credentials only. No live funds are collected.</span></div>
          {error && <p className="form-error">{error}</p>}
          <button className="button button-gold confirm-booking" disabled={submitting || selected.length === 0} onClick={bookSeats}>{submitting ? <><LoaderCircle className="spin" size={16} /> Opening secure checkout...</> : <><CreditCard size={16} /> Pay with Razorpay · {currency(total)} <ArrowRight size={16} /></>}</button>
          <p className="summary-disclaimer">Seats are held for 10 minutes while you complete test checkout.</p>
        </aside>
      </div>
    </main>
  )
}
