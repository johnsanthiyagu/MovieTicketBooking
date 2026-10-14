import { useEffect, useState } from 'react'
import { ArrowRight, BarChart3, CalendarDays, Check, Film, Plus, Search, X } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../auth'
import { api } from '../../api'
import { currency, dateInputValue, dateTimeInputValue, displayDate, displayTime, isApprovedTheater } from '../../utils'
import PageLoader from '../PageLoader'

export default function ManagementPage() {
  const { user } = useAuth()
  const [movies, setMovies] = useState([])
  const [theaters, setTheaters] = useState([])
  const [pendingTheaters, setPendingTheaters] = useState([])
  const [showtimes, setShowtimes] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [form, setForm] = useState({ movieId: '', theaterId: '', startsAt: '', basePrice: '250', format: '2D' })
  const [theaterForm, setTheaterForm] = useState({ name: '', city: '', address: '', seatCount: '200' })
  const [editingShowtime, setEditingShowtime] = useState('')
  const [omdbQuery, setOmdbQuery] = useState('')
  const [omdbResults, setOmdbResults] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [today] = useState(() => dateInputValue(new Date()))

  const refresh = async () => {
    const [movieResult, theaterResult, showResult, analyticsResult, pendingResult] = await Promise.all([
      api.get('/movies'),
      api.get('/theaters/mine'),
      api.get('/theaters/showtimes'),
      api.get('/analytics'),
      user.role === 'admin' ? api.get('/theaters/pending') : Promise.resolve({ data: { theaters: [] } }),
    ])
    const listedTheaters = theaterResult.data.theaters || []
    const theaterIds = new Set(listedTheaters.map((theater) => theater._id))
    setMovies(movieResult.data.movies || [])
    setTheaters(listedTheaters)
    setPendingTheaters(pendingResult.data.theaters || [])
    setShowtimes((showResult.data.showtimes || []).filter((show) => (
      user.role === 'admin' || theaterIds.has(show.theater?._id)
    )))
    setAnalytics(analyticsResult.data)
    setForm((current) => ({
      ...current,
      movieId: current.movieId || movieResult.data.movies?.[0]?._id || '',
      theaterId: (listedTheaters.some((theater) => theater._id === current.theaterId && isApprovedTheater(theater))
        ? current.theaterId
        : listedTheaters.find(isApprovedTheater)?._id) || '',
    }))
  }

  useEffect(() => {
    let active = true
    if (user) {
      Promise.all([
        api.get('/movies'),
        api.get('/theaters/mine'),
        api.get('/theaters/showtimes'),
        api.get('/analytics'),
        user.role === 'admin' ? api.get('/theaters/pending') : Promise.resolve({ data: { theaters: [] } }),
      ]).then(([movieResult, theaterResult, showResult, analyticsResult, pendingResult]) => {
        if (!active) return
        const listedTheaters = theaterResult.data.theaters || []
        const theaterIds = new Set(listedTheaters.map((theater) => theater._id))
        setMovies(movieResult.data.movies || [])
        setTheaters(listedTheaters)
        setPendingTheaters(pendingResult.data.theaters || [])
        setShowtimes((showResult.data.showtimes || []).filter((show) => (
          user.role === 'admin' || theaterIds.has(show.theater?._id)
        )))
        setAnalytics(analyticsResult.data)
        setForm((current) => ({
          ...current,
          movieId: current.movieId || movieResult.data.movies?.[0]?._id || '',
          theaterId: (listedTheaters.some((theater) => theater._id === current.theaterId && isApprovedTheater(theater))
            ? current.theaterId
            : listedTheaters.find(isApprovedTheater)?._id) || '',
        }))
      }).catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Could not load management data.')
      }).finally(() => {
        if (active) setPageLoading(false)
      })
    }
    return () => { active = false }
  }, [user])

  const createShow = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      if (editingShowtime) {
        await api.patch(`/theaters/showtimes/${editingShowtime}`, {
          startsAt: form.startsAt,
          basePrice: form.basePrice,
          format: form.format,
        })
        setSuccess('Showtime schedule updated.')
        setEditingShowtime('')
      } else {
        await api.post('/theaters/showtimes', form)
        setSuccess('Showtime added to the schedule.')
      }
      setForm((current) => ({ ...current, startsAt: '' }))
      await refresh()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not create the showtime.')
    } finally {
      setLoading(false)
    }
  }

  const createTheater = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const { data } = await api.post('/theaters', { ...theaterForm, seatCount: Number(theaterForm.seatCount) })
      setSuccess(data.message)
      setTheaterForm({ name: '', city: '', address: '', seatCount: '200' })
      await refresh()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not submit the theatre request.')
    } finally {
      setLoading(false)
    }
  }

  const reviewTheater = async (id, approvalStatus) => {
    setError('')
    setSuccess('')
    try {
      const { data } = await api.patch(`/theaters/${id}/approval`, { approvalStatus })
      setSuccess(data.message)
      await refresh()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not review this theatre request.')
    }
  }

  const searchOmdb = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const { data } = await api.get('/movies/omdb/search', { params: { title: omdbQuery } })
      setOmdbResults(data.results || [])
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'OMDb search failed.')
    }
  }

  const importMovie = async (imdbID) => {
    setError('')
    try {
      await api.post('/movies/omdb/import', { imdbID })
      setSuccess('Movie imported from OMDb.')
      await refresh()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Movie import failed.')
    }
  }

  const deactivateShow = async (id) => {
    setError('')
    try {
      await api.patch(`/theaters/showtimes/${id}`, { active: false })
      setSuccess('Showtime removed from public listings.')
      await refresh()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update that schedule.')
    }
  }

  const editShow = (show) => {
    setEditingShowtime(show._id)
    setForm({
      movieId: show.movie?._id || '',
      theaterId: show.theater?._id || '',
      startsAt: dateTimeInputValue(show.startsAt),
      basePrice: String(show.basePrice),
      format: show.format || '2D',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditingShowtime('')
    setForm((current) => ({ ...current, startsAt: '' }))
  }

  if (!user) return <Navigate to="/login" replace />
  if (!['admin', 'theaterOwner'].includes(user.role)) return <main className="page-shell container"><div className="inline-error">This page is for cinema managers.</div></main>
  if (pageLoading) return <main className="page-shell container manage-page"><PageLoader message="Preparing the studio desk..." /></main>
  const approvedTheaters = theaters.filter(isApprovedTheater)

  return (
    <main className="page-shell container manage-page">
      <div className="page-intro"><p className="eyebrow">BEHIND THE CURTAIN</p><h1>Studio <em>desk.</em></h1><p>Everything you need to keep the show running.</p></div>
      {error && <div className="inline-error">{error}</div>}
      {success && <div className="inline-success"><Check size={16} />{success}<button className="icon-button" onClick={() => setSuccess('')} aria-label="Dismiss"><X size={15} /></button></div>}
      {analytics && <section className="analytics-grid">
        <article><span>TEST REVENUE</span><strong>{currency(analytics.revenue)}</strong><small>Confirmed Razorpay test payments</small></article>
        <article><span>TICKETS SOLD</span><strong>{analytics.tickets}</strong><small>{analytics.bookings} confirmed bookings</small></article>
        <article><span>SEAT OCCUPANCY</span><strong>{analytics.occupancyRate}%</strong><small>Upcoming scheduled shows</small></article>
        <article className="analytics-icon"><BarChart3 size={24} /><span>YOUR CINEMA<br />AT A GLANCE</span></article>
      </section>}
      {user.role === 'admin' && <section className="schedule-panel theater-approval-panel"><div className="section-heading"><div><p className="eyebrow">OWNER APPLICATIONS</p><h2>Theatre approval requests</h2></div><span className="section-count">{pendingTheaters.length} PENDING</span></div>
        {pendingTheaters.length ? <div className="schedule-list">{pendingTheaters.map((theater) => <article className="schedule-row theater-request-row" key={theater._id}><div className="schedule-film"><strong>{theater.name}</strong><span>{theater.city} · {theater.address}</span></div><div className="schedule-film"><strong>{theater.owner?.name || 'Theatre owner'}</strong><span>{theater.owner?.email}</span></div><span>{theater.seatCount} seats</span><div className="schedule-actions"><button className="edit-ticket" onClick={() => reviewTheater(theater._id, 'approved')}>Approve</button><button className="cancel-ticket" onClick={() => reviewTheater(theater._id, 'rejected')}>Reject</button></div></article>)}</div> : <p className="manage-hint">No theatre requests are waiting for review.</p>}
      </section>}
      <div className="manage-columns">
        {user.role === 'theaterOwner' && <section className="manage-panel"><div className="panel-title"><span className="panel-icon"><Film size={18} /></span><div><p className="eyebrow">GROW YOUR CINEMA</p><h2>Request a theatre</h2></div></div>
          <form className="manage-form" onSubmit={createTheater}>
            <label className="form-label">Theatre name<input required maxLength={120} value={theaterForm.name} onChange={(event) => setTheaterForm({ ...theaterForm, name: event.target.value })} /></label>
            <label className="form-label">City<input required maxLength={100} value={theaterForm.city} onChange={(event) => setTheaterForm({ ...theaterForm, city: event.target.value })} /></label>
            <label className="form-label">Street address<input required maxLength={240} value={theaterForm.address} onChange={(event) => setTheaterForm({ ...theaterForm, address: event.target.value })} /></label>
            <label className="form-label">Seat count<input required type="number" min="1" max="2000" value={theaterForm.seatCount} onChange={(event) => setTheaterForm({ ...theaterForm, seatCount: event.target.value })} /></label>
            <button className="button button-gold auth-submit" disabled={loading}>{loading ? 'Submitting...' : <>Submit for approval <ArrowRight size={16} /></>}</button>
          </form>
          {theaters.length > 0 && <div className="owner-theater-status">{theaters.map((theater) => <div key={theater._id}><strong>{theater.name}</strong><span className={`approval-status status-${theater.approvalStatus || 'approved'}`}>{theater.approvalStatus || 'approved'}</span></div>)}</div>}
        </section>}
        <section className="manage-panel"><div className="panel-title"><span className="panel-icon"><CalendarDays size={18} /></span><div><p className="eyebrow">KEEP THE LIGHTS ON</p><h2>Add a showtime</h2></div></div>
          <form className="manage-form" onSubmit={createShow}>
            <label className="form-label">Film<select required disabled={Boolean(editingShowtime)} value={form.movieId} onChange={(event) => setForm({ ...form, movieId: event.target.value })}>{movies.map((movie) => <option key={movie._id} value={movie._id}>{movie.title}</option>)}</select></label>
            <label className="form-label">Theatre<select required disabled={Boolean(editingShowtime)} value={form.theaterId} onChange={(event) => setForm({ ...form, theaterId: event.target.value })}>{approvedTheaters.map((theater) => <option key={theater._id} value={theater._id}>{theater.name} · {theater.city}</option>)}</select></label>
            <div className="manage-form-row"><label className="form-label">Date & time<input required type="datetime-local" min={`${today}T00:00`} value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} /></label><label className="form-label">Base price (₹)<input required type="number" min="1" value={form.basePrice} onChange={(event) => setForm({ ...form, basePrice: event.target.value })} /></label></div>
            <label className="form-label">Format<select value={form.format} onChange={(event) => setForm({ ...form, format: event.target.value })}><option>2D</option><option>3D</option><option>IMAX</option><option>Dolby Atmos</option></select></label>
            <button className="button button-gold auth-submit" disabled={loading || !movies.length || !approvedTheaters.length}>{loading ? 'Saving...' : <>{editingShowtime ? <Check size={16} /> : <Plus size={16} />} {editingShowtime ? 'Save showtime changes' : 'Add to schedule'}</>}</button>
            {editingShowtime && <button className="button button-quiet auth-submit" type="button" onClick={cancelEdit}>Cancel editing</button>}
          </form>
        </section>
        {user.role === 'admin' && <section className="manage-panel omdb-panel"><div className="panel-title"><span className="panel-icon"><Film size={18} /></span><div><p className="eyebrow">CINEMA DATABASE</p><h2>Find a film on OMDb</h2></div></div>
          <form className="omdb-search" onSubmit={searchOmdb}><input aria-label="Search OMDb" placeholder="Search movie title..." value={omdbQuery} onChange={(event) => setOmdbQuery(event.target.value)} minLength={2} required /><button className="button button-dark" aria-label="Search"><Search size={16} /></button></form>
          {omdbResults.map((result) => <div className="omdb-result" key={result.imdbID}><span><strong>{result.Title}</strong><small>{result.Year} · {result.Type}</small></span><button className="text-link" onClick={() => importMovie(result.imdbID)}>Import <ArrowRight size={13} /></button></div>)}
          {!omdbResults.length && <p className="manage-hint">Search the OMDb catalogue and add titles directly to your film list.</p>}
        </section>}
      </div>
      {analytics?.topMovies?.length > 0 && <section className="schedule-panel popular-panel">
        <div className="section-heading"><div><p className="eyebrow">AUDIENCE FAVOURITES</p><h2>Most-booked films</h2></div><span className="section-count">TOP 5</span></div>
        <div className="popular-list">{analytics.topMovies.map((movie, index) => {
          const max = analytics.topMovies[0].bookings || 1
          return <div className="popular-row" key={movie.title}><span className="popular-rank">{String(index + 1).padStart(2, '0')}</span><strong>{movie.title}</strong><span className="popular-bar"><i style={{ width: `${Math.max(5, (movie.bookings / max) * 100)}%` }} /></span><span className="popular-bookings">{movie.bookings} bookings</span></div>
        })}</div>
      </section>}
      <section className="schedule-panel"><div className="section-heading"><div><p className="eyebrow">COMING UP</p><h2>Showtime schedule</h2></div><span className="section-count">{showtimes.length} LISTINGS</span></div>
        {showtimes.length ? <div className="schedule-list">{showtimes.map((show) => {
          const hasBookings = show.availableSeats < show.capacity
          return <article className="schedule-row" key={show._id}><div className="schedule-date">{displayDate(show.startsAt)}<strong>{displayTime(show.startsAt)}</strong></div><div className="schedule-film"><strong>{show.movie?.title}</strong><span>{show.theater?.name} · {show.theater?.city}</span></div><span className="format-pill">{show.format}</span><span className="schedule-price">{currency(show.basePrice)}</span><div className="schedule-actions"><button className="edit-ticket" disabled={hasBookings} onClick={() => editShow(show)}>Edit</button><button className="cancel-ticket" disabled={hasBookings} onClick={() => deactivateShow(show._id)}>Remove</button></div></article>
        })}</div> : <p className="manage-hint">No upcoming showtimes scheduled.</p>}
      </section>
      <p className="demo-note">Ticket payments and cancellations use Razorpay test mode; no live funds are collected.</p>
    </main>
  )
}
