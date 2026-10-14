import { useState } from 'react'
import { Film, Heart, Star, Ticket } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function MovieCard({ movie, index }) {
  const [saved, setSaved] = useState(false)
  const moviePath = movie._id.startsWith('demo-') ? '/theaters' : `/showtimes/${movie._id}`

  return (
    <article className="movie-card" style={{ '--card-delay': `${index * 45}ms` }}>
      <Link className="poster-wrap" to={moviePath} aria-label={`See showtimes for ${movie.title}`}>
        {movie.poster ? <img className="poster" src={movie.poster} alt={`${movie.title} poster`} loading="lazy" /> : <div className="poster poster-placeholder"><Film size={36} /></div>}
        <span className="poster-overlay" />
        <span className="poster-book"><Ticket size={15} /> Find a show</span>
        {movie.featured && <span className="poster-tag">THE LUMIÈRE PICK</span>}
      </Link>
      <div className="movie-card-meta">
        <div className="movie-title-row">
          <Link to={moviePath} className="movie-title">{movie.title}</Link>
          <button className={`save-button ${saved ? 'is-saved' : ''}`} onClick={() => setSaved(!saved)} aria-label={saved ? 'Remove from saved movies' : 'Save movie'}><Heart size={16} fill={saved ? 'currentColor' : 'none'} /></button>
        </div>
        <div className="movie-details"><span>{movie.year || 'Now showing'}</span><i /> <span>{(movie.genre || []).slice(0, 2).join(' · ') || 'Cinema'}</span></div>
        <div className="movie-rating"><Star size={13} fill="currentColor" /> {movie.rating || 'New'} <span>IMDb</span></div>
      </div>
    </article>
  )
}
