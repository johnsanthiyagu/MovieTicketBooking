import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, ChevronDown, MapPin, Popcorn, Search } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import MovieSection from '../MovieSection'
import { api } from '../../api'

const fallbackMovies = [
  { _id: 'demo-dune', title: 'Dune: Part Two', year: '2024', runtime: '166 min', genre: ['Sci-Fi', 'Adventure'], rating: '8.5', plot: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.', poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=900&q=85', featured: true },
  { _id: 'demo-oppenheimer', title: 'Oppenheimer', year: '2023', runtime: '180 min', genre: ['Drama', 'History'], rating: '8.3', plot: 'The story of J. Robert Oppenheimer and his role in the development of the atomic bomb.', poster: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=900&q=85' },
  { _id: 'demo-spiderverse', title: 'Across the Spider-Verse', year: '2023', runtime: '140 min', genre: ['Animation', 'Action'], rating: '8.6', plot: 'Miles Morales travels across the multiverse and encounters a team of Spider-People.', poster: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=900&q=85' },
  { _id: 'demo-batman', title: 'The Batman', year: '2022', runtime: '176 min', genre: ['Action', 'Crime'], rating: '7.8', plot: 'Batman ventures into Gotham City’s underworld when a sadistic killer leaves behind a trail of clues.', poster: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?auto=format&fit=crop&w=900&q=85' },
  { _id: 'demo-everything', title: 'Everything Everywhere All at Once', year: '2022', runtime: '139 min', genre: ['Adventure', 'Comedy'], rating: '7.8', plot: 'An exhausted woman is swept into an adventure where she alone can save existence.', poster: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?auto=format&fit=crop&w=900&q=85' },
  { _id: 'demo-maverick', title: 'Top Gun: Maverick', year: '2022', runtime: '130 min', genre: ['Action', 'Drama'], rating: '8.2', plot: 'After decades of service, a daring test pilot takes on a new mission and trains elite graduates.', poster: 'https://images.unsplash.com/photo-1474302770737-173ee21bab63?auto=format&fit=crop&w=900&q=85' },
  { _id: 'demo-interstellar', title: 'Interstellar', year: '2014', runtime: '169 min', genre: ['Sci-Fi', 'Drama'], rating: '8.7', plot: 'A team of explorers travels beyond this galaxy to discover whether mankind has a future among the stars.', poster: 'https://images.unsplash.com/photo-14467768121-b23d57bd21aa?auto=format&fit=crop&w=900&q=85' },
  { _id: 'demo-inception', title: 'Inception', year: '2010', runtime: '148 min', genre: ['Sci-Fi', 'Thriller'], rating: '8.8', plot: 'A skilled thief is given a chance to have his past erased if he can plant an idea in a target’s mind.', poster: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=900&q=85' },
  { _id: 'demo-grand-budapest', title: 'The Grand Budapest Hotel', year: '2014', runtime: '99 min', genre: ['Comedy', 'Adventure'], rating: '8.1', plot: 'A legendary concierge and his trusted protégé become entangled in a race for a priceless painting.', poster: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=900&q=85' },
  { _id: 'demo-la-la-land', title: 'La La Land', year: '2016', runtime: '128 min', genre: ['Romance', 'Drama'], rating: '8.0', plot: 'A jazz pianist and an aspiring actor meet and fall in love while pursuing their dreams in Los Angeles.', poster: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=85' },
]

const genres = ['All films', 'Action', 'Adventure', 'Animation', 'Comedy', 'Drama', 'Sci-Fi', 'Thriller']
const cities = ['Everywhere', 'Chennai', 'Bengaluru', 'Hyderabad', 'Mumbai', 'Delhi', 'Pune', 'Kochi', 'Coimbatore', 'Jaipur', 'Kolkata']

export default function HomePage() {
  const navigate = useNavigate()
  const [movies, setMovies] = useState(fallbackMovies)
  const [search, setSearch] = useState('')
  const [genre, setGenre] = useState('All films')
  const [year, setYear] = useState('All years')
  const [city, setCity] = useState('Everywhere')
  const [apiReady, setApiReady] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    api.get('/movies')
      .then(({ data }) => {
        if (active) {
          if (data.movies?.length) setMovies(data.movies)
          setApiReady(Boolean(data.movies?.length))
        }
      })
      .catch(() => { if (active) setApiReady(false) })
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
            <label className="search-location"><MapPin size={17} /><select aria-label="Select city" value={city} onChange={(event) => setCity(event.target.value)}>{cities.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={14} /></label>
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
