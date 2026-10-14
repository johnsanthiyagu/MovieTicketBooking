import { useEffect, useMemo, useState } from 'react'
import { Armchair, CalendarDays, ChevronLeft, Film, MapPin, Star, ArrowRight } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../auth'
import { api } from '../../api'
import { currency, dateInputValue, displayDate, displayTime } from '../../utils'
import PageLoader from '../PageLoader'

export default function ShowtimesPage() {
  const { movieId } = useParams()
  const { user } = useAuth()
  const [movie, setMovie] = useState(null)
  const [showtimes, setShowtimes] = useState([])
  const [date, setDate] = useState(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return dateInputValue(tomorrow)
  })
  const [city, setCity] = useState('Everywhere')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [today] = useState(() => dateInputValue(new Date()))

  useEffect(() => {
    let active = true
    Promise.all([
      api.get(`/movies/${movieId}`),
      api.get('/theaters/showtimes', { params: { movie: movieId, date } }),
    ]).then(([movieResponse, showResponse]) => {
      if (!active) return
      setMovie(movieResponse.data.movie)
      setShowtimes(showResponse.data.showtimes || [])
      setError('')
    }).catch((requestError) => {
      if (!active) return
      setError(requestError.response?.data?.message || 'Could not load showtimes. Check that the API and MongoDB are running.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [movieId, date])

  const cities = useMemo(() => ['Everywhere', ...new Set(showtimes.map((show) => show.theater?.city).filter(Boolean))], [showtimes])
  const filteredShows = city === 'Everywhere' ? showtimes : showtimes.filter((show) => show.theater?.city === city)

  return (
    <main className="page-shell container">
      <Link className="back-link" to="/"><ChevronLeft size={16} /> Back to films</Link>
      <section className="show-page-head">
        <div className="show-movie-art">{movie?.poster && <img src={movie.poster} alt="" />}</div>
        <div className="show-page-copy"><p className="eyebrow">CHOOSE YOUR CINEMA MOMENT</p><h1>{movie?.title || 'Showtimes'}</h1>
          <p>{movie?.year} {movie?.runtime && `· ${movie.runtime}`} {(movie?.genre || []).slice(0, 2).join(' · ')}</p>
          <span className="rating-pill"><Star size={14} fill="currentColor" /> {movie?.rating || '—'} <small>IMDb</small></span>
        </div>
      </section>
      <div className="show-filter-bar">
        <label className="date-control"><CalendarDays size={17} /><span>DATE</span><input type="date" min={today} value={date} onChange={(event) => { setLoading(true); setDate(event.target.value) }} /></label>
        <label className="city-control"><MapPin size={17} /><span>CITY</span><select value={city} onChange={(event) => setCity(event.target.value)}>{cities.map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>
      {loading ? <PageLoader message="Finding your seats..." />
        : error ? <div className="inline-error">{error}</div>
          : filteredShows.length ? <div className="theater-list">{filteredShows.map((show) => (
            <article className="theater-show-card" key={show._id}>
              <div className="theater-show-info"><span className="theater-monogram"><Film size={19} /></span><div><h3>{show.theater.name}</h3><p><MapPin size={13} /> {show.theater.city} · {show.theater.address}</p></div></div>
              <div className="theater-show-tags"><span>{show.format}</span><span><Armchair size={13} /> {show.availableSeats} seats</span></div>
              <div className="show-time-price"><strong>{displayTime(show.startsAt)}</strong><span>from {currency(show.basePrice)}</span></div>
              {user?.role !== 'admin' && user?.role !== 'theaterOwner' && <Link className="button button-gold show-book-button" to={`/seats/${show._id}`}>Select seats <ArrowRight size={15} /></Link>}
            </article>
          ))}</div>
            : <div className="empty-state empty-large"><CalendarDays size={25} /><h3>No showtimes yet</h3><p>There are no listings for {displayDate(`${date}T00:00:00`)}. Try another date or city.</p></div>}
    </main>
  )
}
