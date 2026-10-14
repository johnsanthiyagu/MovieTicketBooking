import { Film } from 'lucide-react'
import MovieCard from './MovieCard'

export default function MovieSection({ title, eyebrow, movies, emptyText }) {
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
