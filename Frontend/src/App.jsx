import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight, Armchair, BarChart3, CalendarDays, Check, ChevronDown,
  ChevronLeft, Film, Heart, KeyRound, LoaderCircle, LogIn, LogOut, Mail,
  MailCheck, MailWarning,
  CreditCard, Landmark, MapPin, Menu, Plus, Popcorn, Printer, QrCode, Search,
  ShieldCheck, Smartphone, Sparkles, Star, Ticket, TicketCheck, Wallet, X
} from 'lucide-react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api } from './api'
import { useAuth } from './auth'

const fallbackMovies = [
  { _id: 'demo-dune', title: 'Dune: Part Two', year: '2024', runtime: '166 min', genre: ['Sci-Fi', 'Adventure'], rating: '8.5', plot: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.', poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=900&q=85', featured: true },
  { _id: 'demo-oppenheimer', title: 'Oppenheimer', year: '2023', runtime: '180 min', genre: ['Drama', 'History'], rating: '8.3', plot: 'The story of J. Robert Oppenheimer and his role in the development of the atomic bomb.', poster: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=900&q=85' },
  { _id: 'demo-spiderverse', title: 'Across the Spider-Verse', year: '2023', runtime: '140 min', genre: ['Animation', 'Action'], rating: '8.6', plot: 'Miles Morales travels across the multiverse and encounters a team of Spider-People.', poster: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=900&q=85' },
  { _id: 'demo-batman', title: 'The Batman', year: '2022', runtime: '176 min', genre: ['Action', 'Crime'], rating: '7.8', plot: 'Batman ventures into Gotham City’s underworld when a sadistic killer leaves behind a trail of clues.', poster: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?auto=format&fit=crop&w=900&q=85' },
  { _id: 'demo-everything', title: 'Everything Everywhere All at Once', year: '2022', runtime: '139 min', genre: ['Adventure', 'Comedy'], rating: '7.8', plot: 'An exhausted woman is swept into an adventure where she alone can save existence.', poster: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?auto=format&fit=crop&w=900&q=85' },
  { _id: 'demo-maverick', title: 'Top Gun: Maverick', year: '2022', runtime: '130 min', genre: ['Action', 'Drama'], rating: '8.2', plot: 'After decades of service, a daring test pilot takes on a new mission and trains elite graduates.', poster: 'https://images.unsplash.com/photo-1474302770737-173ee21bab63?auto=format&fit=crop&w=900&q=85' },
  { _id: 'demo-interstellar', title: 'Interstellar', year: '2014', runtime: '169 min', genre: ['Sci-Fi', 'Drama'], rating: '8.7', plot: 'A team of explorers travels beyond this galaxy to discover whether mankind has a future among the stars.', poster: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=900&q=85' },
  { _id: 'demo-inception', title: 'Inception', year: '2010', runtime: '148 min', genre: ['Sci-Fi', 'Thriller'], rating: '8.8', plot: 'A skilled thief is given a chance to have his past erased if he can plant an idea in a target’s mind.', poster: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=900&q=85' },
  { _id: 'demo-grand-budapest', title: 'The Grand Budapest Hotel', year: '2014', runtime: '99 min', genre: ['Comedy', 'Adventure'], rating: '8.1', plot: 'A legendary concierge and his trusted protégé become entangled in a race for a priceless painting.', poster: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=900&q=85' },
  { _id: 'demo-la-la-land', title: 'La La Land', year: '2016', runtime: '128 min', genre: ['Romance', 'Drama'], rating: '8.0', plot: 'A jazz pianist and an aspiring actor meet and fall in love while pursuing their dreams in Los Angeles.', poster: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=85' },
]

const currency = (amount) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(amount || 0)

const paymentMethods = [
  { value: 'upi', label: 'UPI', detail: 'Any UPI app · simulated', Icon: Smartphone },
  { value: 'qr', label: 'QR code', detail: 'Scan to pay · simulated', Icon: QrCode },
  { value: 'card', label: 'Credit / debit card', detail: 'Cards · simulated', Icon: CreditCard },
  { value: 'netbanking', label: 'Net banking', detail: 'Bank transfer · simulated', Icon: Landmark },
  { value: 'wallet', label: 'Digital wallet', detail: 'Wallet · simulated', Icon: Wallet },
]
const paymentMethodLabel = (value) => paymentMethods.find((method) => method.value === value)?.label || 'Demo'

const dateInputValue = (date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

const dateTimeInputValue = (date) => {
  const local = new Date(new Date(date).getTime() - new Date(date).getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

const displayDate = (date) => new Intl.DateTimeFormat('en-IN', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
}).format(new Date(date))

const displayTime = (date) => new Intl.DateTimeFormat('en-IN', {
  hour: 'numeric',
  minute: '2-digit',
}).format(new Date(date))

function Navigation() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
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
          {user && <Link to="/bookings" onClick={close}>My tickets</Link>}
          {(user?.role === 'admin' || user?.role === 'theaterOwner') && <Link to="/manage" onClick={close}>Manage</Link>}
          {user ? (
            <button className="nav-account" onClick={() => { logout(); close() }}><LogOut size={15} /> Sign out</button>
          ) : (
            <Link className="nav-signin" to="/login" onClick={close}><LogIn size={15} /> Sign in</Link>
          )}
        </div>
      </nav>
    </header>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <Link className="brand footer-brand" to="/"><span className="brand-mark"><Film size={18} /></span><span className="brand-name">lumière<span>.</span></span></Link>
        <span>Make room for a little movie magic.</span>
        <span className="footer-note">A seat with your name on it.</span>
      </div>
    </footer>
  )
}

function MovieCard({ movie, index }) {
  const [saved, setSaved] = useState(false)
  return (
    <article className="movie-card" style={{ '--card-delay': `${index * 45}ms` }}>
      <Link className="poster-wrap" to={movie._id.startsWith('demo-') ? '/theaters' : `/showtimes/${movie._id}`} aria-label={`See showtimes for ${movie.title}`}>
        {movie.poster ? <img className="poster" src={movie.poster} alt={`${movie.title} poster`} loading="lazy" /> : <div className="poster poster-placeholder"><Film size={36} /></div>}
        <span className="poster-overlay" />
        <span className="poster-book"><Ticket size={15} /> Find a show</span>
        {movie.featured && <span className="poster-tag">THE LUMIÈRE PICK</span>}
      </Link>
      <div className="movie-card-meta">
        <div className="movie-title-row">
          <Link to={movie._id.startsWith('demo-') ? '/theaters' : `/showtimes/${movie._id}`} className="movie-title">{movie.title}</Link>
          <button className={`save-button ${saved ? 'is-saved' : ''}`} onClick={() => setSaved(!saved)} aria-label={saved ? 'Remove from saved movies' : 'Save movie'}><Heart size={16} fill={saved ? 'currentColor' : 'none'} /></button>
        </div>
        <div className="movie-details"><span>{movie.year || 'Now showing'}</span><i /> <span>{(movie.genre || []).slice(0, 2).join(' · ') || 'Cinema'}</span></div>
        <div className="movie-rating"><Star size={13} fill="currentColor" /> {movie.rating || 'New'} <span>IMDb</span></div>
      </div>
    </article>
  )
}

function MovieSection({ title, eyebrow, movies, emptyText }) {
  return (
    <section className="movie-section">
      <div className="section-heading">
        <div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>
        <span className="section-count">{movies.length.toString().padStart(2, '0')} FILMS</span>
      </div>
      {movies.length ? (
        <div className="movie-grid">{movies.map((movie, index) => <MovieCard movie={movie} index={index} key={movie._id} />)}</div>
      ) : <div className="empty-state"><Film size={21} /><p>{emptyText}</p></div>}
    </section>
  )
}

function HomePage() {
  const navigate = useNavigate()
  const [movies, setMovies] = useState(fallbackMovies)
  const [search, setSearch] = useState('')
  const [genre, setGenre] = useState('All films')
  const [year, setYear] = useState('All years')
  const [city, setCity] = useState('Everywhere')
  const [apiReady, setApiReady] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const genres = ['All films', 'Action', 'Adventure', 'Animation', 'Comedy', 'Drama', 'Sci-Fi', 'Thriller']

  useEffect(() => {
    let active = true
    api.get('/movies')
      .then(({ data }) => {
        if (active) {
          if (data.movies?.length) setMovies(data.movies)
          setApiReady(Boolean(data.movies?.length))
        }
      })
      .catch(() => {
        if (active) setApiReady(false)
      })
      .finally(() => { if (active) setLoaded(true) })
    return () => { active = false }
  }, [])

  const filtered = useMemo(() => movies.filter((movie) => {
    const matchesTitle = movie.title.toLowerCase().includes(search.toLowerCase().trim())
    const matchesGenre = genre === 'All films' || (movie.genre || []).some((item) => item.toLowerCase().includes(genre.toLowerCase()))
    const matchesYear = year === 'All years' || String(movie.year) === year
    return matchesTitle && matchesGenre && matchesYear
  }), [movies, search, genre, year])
  const releaseYears = [...new Set(movies.map((movie) => movie.year).filter(Boolean))].sort((left, right) => Number(right) - Number(left))
  const featured = filtered.find((movie) => movie.featured) || filtered[0] || movies[0]

  return (
    <main>
      <section className="hero">
        <div className="hero-backdrop" style={{ backgroundImage: `url("${featured?.poster || fallbackMovies[0].poster}")` }} />
        <div className="hero-scrim" />
        <div className="container hero-content">
          <div className="hero-copy">
            <div className="hero-kicker"><span className="kicker-line" /> YOUR NEXT GREAT STORY</div>
            <h1>Make tonight<br />a <em>feature.</em></h1>
            <p className="hero-description">Find your film, pick the perfect seat, and let the rest of the world wait.</p>
            <div className="hero-actions">
              <a href="#now-showing" className="button button-gold">Explore films <ArrowRight size={16} /></a>
              <Link to="/theaters" className="button button-quiet"><MapPin size={16} /> Find a theatre</Link>
            </div>
            <div className="hero-note"><span className="avatar-stack"><i>L</i><i>M</i><i>A</i></span><span><strong>Good stories, great company.</strong><br />Your local cinema, reimagined.</span></div>
          </div>
          <div className="hero-side-note"><span>NOW SHOWING</span><i /><strong>{featured?.title || 'The Lumière Collection'}</strong></div>
          <span className="hero-index">01 <i /> 04</span>
        </div>
        <a href="#now-showing" className="scroll-cue"><span /> SCROLL TO DISCOVER</a>
      </section>

      <section className="quick-search-wrap">
        <div className="container">
          <form className="quick-search" onSubmit={(event) => { event.preventDefault(); if (city !== 'Everywhere') navigate(`/theaters?city=${encodeURIComponent(city)}`); else document.querySelector('#now-showing')?.scrollIntoView({ behavior: 'smooth' }) }}>
            <div className="search-field"><Search size={18} /><input aria-label="Search movies" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="A film, a feeling, a favourite..." /><kbd>⌘ K</kbd></div>
            <div className="search-divider" />
            <label className="search-location"><MapPin size={17} /><select aria-label="Select city" value={city} onChange={(event) => setCity(event.target.value)}><option>Everywhere</option><option>Chennai</option><option>Bengaluru</option><option>Hyderabad</option><option>Mumbai</option><option>Delhi</option><option>Pune</option><option>Kochi</option><option>Coimbatore</option><option>Jaipur</option><option>Kolkata</option></select><ChevronDown size={14} /></label>
            <a className="search-submit" href="#now-showing" aria-label="Browse films"><ArrowRight size={20} /></a>
          </form>
          {!apiReady && loaded && <p className="demo-note">Preview mode — configure MongoDB and seed the catalogue to load live movies and showtimes.</p>}
        </div>
      </section>

      <section className="discover-section container" id="now-showing">
        <div className="discover-intro">
          <div><p className="eyebrow">THE BIG SCREEN IS CALLING</p><h2>Find your <em>next favourite.</em></h2></div>
          <p>Handpicked for the big screen.<br />Made for wherever you are.</p>
        </div>
        <div className="genre-list" role="group" aria-label="Filter by genre">
          {genres.map((item) => <button className={`genre-chip ${genre === item ? 'genre-active' : ''}`} key={item} onClick={() => setGenre(item)}>{item}</button>)}
          <select className="genre-chip genre-select" aria-label="Filter by release year" value={year} onChange={(event) => setYear(event.target.value)}><option>All years</option>{releaseYears.map((releaseYear) => <option key={releaseYear}>{releaseYear}</option>)}</select>
          <span className="genre-result">{filtered.length} FILMS</span>
        </div>
        <MovieSection eyebrow="PLAYING NOW" title="On the big screen" movies={filtered} emptyText="No films match that search. Try a different title or genre." />
      </section>

      <section className="membership">
        <div className="container membership-inner">
          <div className="membership-icon"><Popcorn size={24} /></div>
          <div><p className="eyebrow">A LITTLE MORE MAGIC</p><h2>Make movie night <em>your thing.</em></h2><p>Pick your seats, settle in, and keep every ticket in one place.</p></div>
          <Link to="/login" className="button button-dark">Join the club <ArrowRight size={16} /></Link>
          <span className="membership-watermark">L.</span>
        </div>
      </section>
      <div className="container"><MovieSection eyebrow="A FEW MORE TO LOVE" title="The Lumière collection" movies={movies.slice(0, 5)} /></div>
    </main>
  )
}

function ShowtimesPage() {
  const { movieId } = useParams()
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
      {loading ? <div className="loading-state"><LoaderCircle className="spin" /> Finding your seats...</div>
        : error ? <div className="inline-error">{error}</div>
          : filteredShows.length ? <div className="theater-list">{filteredShows.map((show) => (
            <article className="theater-show-card" key={show._id}>
              <div className="theater-show-info"><span className="theater-monogram"><Film size={19} /></span><div><h3>{show.theater.name}</h3><p><MapPin size={13} /> {show.theater.city} · {show.theater.address}</p></div></div>
              <div className="theater-show-tags"><span>{show.format}</span><span><Armchair size={13} /> {show.availableSeats} seats</span></div>
              <div className="show-time-price"><strong>{displayTime(show.startsAt)}</strong><span>from {currency(show.basePrice)}</span></div>
              <Link className="button button-gold show-book-button" to={`/seats/${show._id}`}>Select seats <ArrowRight size={15} /></Link>
            </article>
          ))}</div>
            : <div className="empty-state empty-large"><CalendarDays size={25} /><h3>No showtimes yet</h3><p>There are no listings for {displayDate(`${date}T00:00:00`)}. Try another date or city.</p></div>}
    </main>
  )
}

function SeatPage() {
  const { showtimeId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showtime, setShowtime] = useState(null)
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('upi')

  useEffect(() => {
    let active = true
    api.get(`/theaters/showtimes/${showtimeId}`)
      .then(({ data }) => { if (active) setShowtime(data.showtime) })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'Could not load this seat map.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [showtimeId])

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
      const { data } = await api.post('/bookings', { showtimeId, seats: selected, paymentMethod })
      navigate('/bookings', { state: { booking: data.transaction, emailSent: data.emailSent, message: data.message } })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Booking could not be completed. Please try again.')
      if (requestError.response?.status === 409) {
        const { data } = await api.get(`/theaters/showtimes/${showtimeId}`)
        setShowtime(data.showtime)
        setSelected([])
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <main className="page-shell container"><div className="loading-state"><LoaderCircle className="spin" /> Preparing the seating plan...</div></main>
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
                  className={`seat ${seat.status === 'booked' ? 'seat-booked' : ''} ${seat.type === 'premium' ? 'seat-premium' : ''} ${selected.includes(seat.label) ? 'seat-selected' : ''}`}
                  disabled={seat.status !== 'available'}
                  title={`${seat.label} · ${seat.type} · ${currency(seat.price)}${seat.status === 'booked' ? ' · Unavailable' : ''}`}
                  aria-label={`Seat ${seat.label}, ${seat.status}, ${currency(seat.price)}`}
                  onClick={() => toggleSeat(seat)}
                >{seat.number}</button>
              </span>)}
            </div><span className="row-label">{row[0]?.row}</span></div>)}
          </div>
          <div className="row-exit"><span>EXIT</span><i /><span>EXIT</span></div>
          <p className="seat-hint">Seats are reserved when you confirm your demo booking. Maximum 10 seats per order.</p>
        </section>
        <aside className="order-summary">
          <p className="eyebrow">YOUR EVENING</p>
          <h2>Ticket summary</h2>
          <div className="summary-film"><div className="summary-poster">{showtime.movie.poster && <img src={showtime.movie.poster} alt="" />}</div><div><strong>{showtime.movie.title}</strong><span>{showtime.movie.genre?.[0] || 'Cinema'} · {showtime.format}</span></div></div>
          <div className="summary-line"><span><CalendarDays size={14} /> {displayDate(showtime.startsAt)}</span><strong>{displayTime(showtime.startsAt)}</strong></div>
          <div className="summary-line"><span><MapPin size={14} /> {showtime.theater.name}</span></div>
          <div className="summary-seats"><span>YOUR SEATS</span><div>{selected.length ? selected.map((label) => <i key={label}>{label}</i>) : <small>No seats selected yet</small>}</div></div>
          <div className="summary-total"><span>{selected.length} {selected.length === 1 ? 'ticket' : 'tickets'}</span><strong>{currency(total)}</strong></div>
          <fieldset className="payment-methods">
            <legend>Payment method</legend>
            <div className="payment-method-grid">
              {paymentMethods.map(({ value, label, detail, Icon }) => (
                <label className={`payment-option ${paymentMethod === value ? 'payment-option-selected' : ''}`} key={value}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={value}
                    checked={paymentMethod === value}
                    onChange={() => setPaymentMethod(value)}
                  />
                  <Icon size={17} aria-hidden="true" />
                  <span><strong>{label}</strong><small>{detail}</small></span>
                  <i aria-hidden="true" />
                </label>
              ))}
            </div>
          </fieldset>
          <div className="demo-payment"><ShieldCheck size={15} /><span><b>Demo checkout · {paymentMethodLabel(paymentMethod)}</b><br />This only simulates a payment. No money is collected and no payment details are needed.</span></div>
          {error && <p className="form-error">{error}</p>}
          <button className="button button-gold confirm-booking" disabled={submitting || selected.length === 0} onClick={bookSeats}>{submitting ? <><LoaderCircle className="spin" size={16} /> Processing...</> : <>Complete demo payment · {currency(total)} <ArrowRight size={16} /></>}</button>
          <p className="summary-disclaimer">No real payment · your booking is confirmed instantly</p>
        </aside>
      </div>
    </main>
  )
}

function TheatersPage() {
  const [theaters, setTheaters] = useState([])
  const [searchParams] = useSearchParams()
  const [city, setCity] = useState(() => searchParams.get('city') || '')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    api.get('/theaters', { params: city ? { city } : {} })
      .then(({ data }) => { setTheaters(data.theaters || []); setError('') })
      .catch((requestError) => setError(requestError.response?.data?.message || 'Connect to MongoDB to browse theaters.'))
      .finally(() => setLoading(false))
  }, [city])
  return (
    <main className="page-shell container">
      <div className="page-intro"><p className="eyebrow">YOUR NEIGHBOURHOOD, IN CINEMASCOPE</p><h1>Find your <em>theatre.</em></h1><p>Good screens. Comfy seats. A little anticipation in the air.</p></div>
      <div className="theater-filter"><label><MapPin size={17} /><input aria-label="Filter theaters by city" placeholder="Filter by city" value={city} onChange={(event) => setCity(event.target.value)} />{city && <button className="icon-button" aria-label="Clear city filter" onClick={() => setCity('')}><X size={15} /></button>}</label><span>{theaters.length} CINEMAS</span></div>
      {loading ? <div className="loading-state"><LoaderCircle className="spin" /> Finding cinemas...</div>
        : error ? <div className="inline-error">{error}</div>
          : theaters.length ? <div className="theater-grid">{theaters.map((theater, index) => <article className="theater-card" key={theater._id}><div className={`theater-card-art art-${index % 4}`}><Film size={26} /><span>LUmiÈRE · {theater.city}</span></div><div className="theater-card-body"><h2>{theater.name}</h2><p><MapPin size={14} /> {theater.address}</p><div className="facility-list">{(theater.facilities || []).slice(0, 3).map((item) => <span key={item}>{item}</span>)}</div><div className="theater-card-foot"><span><Armchair size={14} /> {theater.seatCount || 200} seats</span><Link to="/" className="text-link">See films <ArrowRight size={14} /></Link></div></div></article>)}</div>
            : <div className="empty-state empty-large"><Film size={25} /><h3>No theatres found</h3><p>Try another city, or check back soon.</p></div>}
    </main>
  )
}

function AuthPage() {
  const { login, register, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState(() => location.state?.mode === 'forgot' ? 'forgot' : 'login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
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
          ? await login(form.email, form.password)
          : await register(form.name, form.email, form.password)
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
          {mode === 'login' && <p className="auth-role-note"><KeyRound size={14} /> Admins and theatre owners use this same sign-in. Your account role opens the manager dashboard.</p>}
          <form onSubmit={submit}>
            {mode === 'register' && <label className="form-label">Your name<input required autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="First and last name" /></label>}
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

function ResetPasswordPage() {
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

function BookingHistory() {
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
    if (!user) return
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
          <span className="confirmation-code">DEMO PAYMENT · {paymentMethodLabel(newBooking.paymentMethod)}{newBooking.bookingCode && <> · BOOKING CODE <strong>{newBooking.bookingCode}</strong></>}</span>
        </div>
        <a className="button button-quiet confirmation-action" href="#your-tickets">View your tickets <ArrowRight size={15} /></a>
      </section>}
      {message && <div className="inline-success"><Check size={16} />{message}<button className="icon-button" onClick={() => setMessage('')} aria-label="Dismiss"><X size={15} /></button></div>}
      {error && <div className="inline-error">{error}</div>}
      {loading ? <div className="loading-state"><LoaderCircle className="spin" /> Gathering your tickets...</div>
        : transactions.length ? <div className="booking-list" id="your-tickets">{transactions.map((booking) => <article className={`booking-card ${booking.status === 'cancelled' ? 'booking-cancelled' : ''}`} key={booking._id}>
          <div className="booking-poster">{booking.movie?.poster && <img src={booking.movie.poster} alt="" />}</div>
          <div className="booking-info"><div className="booking-status">{booking.status === 'confirmed' ? <><span className="status-dot" /> CONFIRMED</> : <><span className="status-dot cancelled-dot" /> CANCELLED</>}</div><h2>{booking.movie?.title || 'Movie ticket'}</h2><p><MapPin size={14} /> {booking.theater?.name} · {booking.theater?.city}</p><p><CalendarDays size={14} /> {booking.showtime?.startsAt ? `${displayDate(booking.showtime.startsAt)} · ${displayTime(booking.showtime.startsAt)}` : 'Showtime details unavailable'}</p></div>
          <div className="booking-ticket-detail"><span>SEATS</span><strong>{booking.seats.join(' · ')}</strong><span className="booking-code">{booking.bookingCode}</span></div>
          <div className="booking-price"><strong>{currency(booking.amount)}</strong><span>DEMO · {paymentMethodLabel(booking.paymentMethod)}</span><button className="ticket-print" onClick={() => window.print()}><Printer size={14} /> Print ticket</button>{booking.status === 'confirmed' && <button className="cancel-ticket" disabled={cancelling === booking._id} onClick={() => cancel(booking._id)}>{cancelling === booking._id ? 'Cancelling...' : 'Cancel booking'}</button>}</div>
        </article>)}</div>
          : <div className="empty-state empty-large"><TicketCheck size={28} /><h3>No tickets just yet</h3><p>Your next favourite film is waiting to be discovered.</p><Link className="button button-gold" to="/">Explore films <ArrowRight size={15} /></Link></div>}
    </main>
  )
}

function ManagementPage() {
  const { user } = useAuth()
  const [movies, setMovies] = useState([])
  const [theaters, setTheaters] = useState([])
  const [showtimes, setShowtimes] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [form, setForm] = useState({ movieId: '', theaterId: '', startsAt: '', basePrice: '250', format: '2D' })
  const [editingShowtime, setEditingShowtime] = useState('')
  const [omdbQuery, setOmdbQuery] = useState('')
  const [omdbResults, setOmdbResults] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [today] = useState(() => dateInputValue(new Date()))

  const refresh = async () => {
    const [movieResult, theaterResult, showResult, analyticsResult] = await Promise.all([
      api.get('/movies'),
      api.get('/theaters/mine'),
      api.get('/theaters/showtimes'),
      api.get('/analytics'),
    ])
    const theaterIds = new Set(theaterResult.data.theaters.map((theater) => theater._id))
    setMovies(movieResult.data.movies || [])
    setTheaters(theaterResult.data.theaters || [])
    setShowtimes((showResult.data.showtimes || []).filter((show) => (
      user.role === 'admin' || theaterIds.has(show.theater?._id)
    )))
    setAnalytics(analyticsResult.data)
    setForm((current) => ({
      ...current,
      movieId: current.movieId || movieResult.data.movies?.[0]?._id || '',
      theaterId: current.theaterId || theaterResult.data.theaters?.[0]?._id || '',
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
      ]).then(([movieResult, theaterResult, showResult, analyticsResult]) => {
        if (!active) return
        const theaterIds = new Set(theaterResult.data.theaters.map((theater) => theater._id))
        setMovies(movieResult.data.movies || [])
        setTheaters(theaterResult.data.theaters || [])
        setShowtimes((showResult.data.showtimes || []).filter((show) => (
          user.role === 'admin' || theaterIds.has(show.theater?._id)
        )))
        setAnalytics(analyticsResult.data)
        setForm((current) => ({
          ...current,
          movieId: current.movieId || movieResult.data.movies?.[0]?._id || '',
          theaterId: current.theaterId || theaterResult.data.theaters?.[0]?._id || '',
        }))
      }).catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Could not load management data.')
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

  return (
    <main className="page-shell container manage-page">
      <div className="page-intro"><p className="eyebrow">BEHIND THE CURTAIN</p><h1>Studio <em>desk.</em></h1><p>Everything you need to keep the show running.</p></div>
      {error && <div className="inline-error">{error}</div>}
      {success && <div className="inline-success"><Check size={16} />{success}<button className="icon-button" onClick={() => setSuccess('')} aria-label="Dismiss"><X size={15} /></button></div>}
      {analytics && <section className="analytics-grid">
        <article><span>DEMO REVENUE</span><strong>{currency(analytics.revenue)}</strong><small>Confirmed transactions</small></article>
        <article><span>TICKETS SOLD</span><strong>{analytics.tickets}</strong><small>{analytics.bookings} confirmed bookings</small></article>
        <article><span>SEAT OCCUPANCY</span><strong>{analytics.occupancyRate}%</strong><small>Upcoming scheduled shows</small></article>
        <article className="analytics-icon"><BarChart3 size={24} /><span>YOUR CINEMA<br />AT A GLANCE</span></article>
      </section>}
      <div className="manage-columns">
        <section className="manage-panel"><div className="panel-title"><span className="panel-icon"><CalendarDays size={18} /></span><div><p className="eyebrow">KEEP THE LIGHTS ON</p><h2>Add a showtime</h2></div></div>
          <form className="manage-form" onSubmit={createShow}>
            <label className="form-label">Film<select required disabled={Boolean(editingShowtime)} value={form.movieId} onChange={(event) => setForm({ ...form, movieId: event.target.value })}>{movies.map((movie) => <option key={movie._id} value={movie._id}>{movie.title}</option>)}</select></label>
            <label className="form-label">Theatre<select required disabled={Boolean(editingShowtime)} value={form.theaterId} onChange={(event) => setForm({ ...form, theaterId: event.target.value })}>{theaters.map((theater) => <option key={theater._id} value={theater._id}>{theater.name} · {theater.city}</option>)}</select></label>
            <div className="manage-form-row"><label className="form-label">Date & time<input required type="datetime-local" min={`${today}T00:00`} value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} /></label><label className="form-label">Base price (₹)<input required type="number" min="1" value={form.basePrice} onChange={(event) => setForm({ ...form, basePrice: event.target.value })} /></label></div>
            <label className="form-label">Format<select value={form.format} onChange={(event) => setForm({ ...form, format: event.target.value })}><option>2D</option><option>3D</option><option>IMAX</option><option>Dolby Atmos</option></select></label>
            <button className="button button-gold auth-submit" disabled={loading || !movies.length || !theaters.length}>{loading ? 'Saving...' : <>{editingShowtime ? <Check size={16} /> : <Plus size={16} />} {editingShowtime ? 'Save showtime changes' : 'Add to schedule'}</>}</button>
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
      <p className="demo-note">Bookings are demo transactions; no real money is collected or refunded.</p>
    </main>
  )
}

function NotFound() {
  return <main className="page-shell container not-found"><span>404</span><h1>That reel has <em>unspooled.</em></h1><p>We couldn’t find that page. Let’s find you a better story.</p><Link to="/" className="button button-gold">Back to the films <ArrowRight size={16} /></Link></main>
}

function App() {
  return (
    <>
      <Navigation />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/showtimes/:movieId" element={<ShowtimesPage />} />
        <Route path="/seats/:showtimeId" element={<SeatPage />} />
        <Route path="/theaters" element={<TheatersPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/forgot-password" element={<Navigate to="/login" replace state={{ mode: 'forgot' }} />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/bookings" element={<BookingHistory />} />
        <Route path="/manage" element={<ManagementPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </>
  )
}

export default App
