import { useEffect, useState } from 'react'
import { Armchair, ArrowRight, CalendarDays, ChevronLeft, Film, MapPin } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../auth'
import { api } from '../../api'
import { currency, displayDate, displayTime } from '../../utils'
import PageLoader from '../PageLoader'

export default function TheaterShowsPage() {
  const { theaterId } = useParams()
  const { user } = useAuth()
  const [theater, setTheater] = useState(null)
  const [showtimes, setShowtimes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api.get(`/theaters/${theaterId}/shows`)
      .then(({ data }) => {
        if (!active) return
        setTheater(data.theater)
        setShowtimes(data.showtimes || [])
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Could not load this theatre’s schedule.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [theaterId])

  const running = showtimes.filter((show) => show.status === 'running')
  const upcoming = showtimes.filter((show) => show.status === 'upcoming')
  const showCard = (show, isRunning) => (
    <article className="theater-show-card theater-detail-show" key={show._id}>
      <div className="theater-show-info"><span className="theater-monogram">{show.movie.poster ? <img src={show.movie.poster} alt="" /> : <Film size={19} />}</span><div><h3>{show.movie.title}</h3><p><MapPin size={13} /> {theater.name} · {theater.city}</p></div></div>
      <div className="theater-show-tags"><span>{isRunning ? 'NOW SHOWING' : show.format}</span><span><Armchair size={13} /> {show.availableSeats} seats</span></div>
      <div className="show-time-price"><strong>{isRunning ? 'In progress' : displayTime(show.startsAt)}</strong><span>{isRunning ? `Started ${displayTime(show.startsAt)}` : `${displayDate(show.startsAt)} · from ${currency(show.basePrice)}`}</span></div>
      {!isRunning && user?.role !== 'admin' && user?.role !== 'theaterOwner' && <Link className="button button-gold show-book-button" to={`/seats/${show._id}`}>Select seats <ArrowRight size={15} /></Link>}
    </article>
  )

  return (
    <main className="page-shell container">
      <Link className="back-link" to="/theaters"><ChevronLeft size={16} /> All theatres</Link>
      {loading ? <PageLoader message="Loading this theatre’s films..." />
        : error ? <div className="inline-error">{error}</div>
          : <>
            <div className="page-intro theater-detail-intro"><p className="eyebrow">ON THE BIG SCREEN</p><h1>{theater.name}</h1><p><MapPin size={14} /> {theater.address} · {theater.city}</p></div>
            <section className="theater-schedule-section"><div className="section-heading"><div><p className="eyebrow">HAPPENING NOW</p><h2>Currently showing</h2></div><span className="section-count">{running.length} FILMS</span></div>
              {running.length ? <div className="theater-list">{running.map((show) => showCard(show, true))}</div> : <div className="empty-state"><Film size={21} /><p>No movies are currently in progress.</p></div>}
            </section>
            <section className="theater-schedule-section"><div className="section-heading"><div><p className="eyebrow">COMING UP</p><h2>Next showtimes</h2></div><span className="section-count">{upcoming.length} SHOWS</span></div>
              {upcoming.length ? <div className="theater-list">{upcoming.map((show) => showCard(show, false))}</div> : <div className="empty-state"><CalendarDays size={21} /><p>No upcoming showtimes are listed for this theatre.</p></div>}
            </section>
          </>}
    </main>
  )
}
