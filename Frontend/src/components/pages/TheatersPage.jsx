import { useEffect, useState } from 'react'
import { Armchair, Film, MapPin, X, ArrowRight } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../../api'
import PageLoader from '../PageLoader'

export default function TheatersPage() {
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
      {loading ? <PageLoader message="Finding cinemas..." />
        : error ? <div className="inline-error">{error}</div>
          : theaters.length ? <div className="theater-grid">{theaters.map((theater, index) => <article className="theater-card" key={theater._id}><div className={`theater-card-art art-${index % 4}`}><Film size={26} /><span>LUmiÈRE · {theater.city}</span></div><div className="theater-card-body"><h2>{theater.name}</h2><p><MapPin size={14} /> {theater.address}</p><div className="facility-list">{(theater.facilities || []).slice(0, 3).map((item) => <span key={item}>{item}</span>)}</div><div className="theater-card-foot"><span><Armchair size={14} /> {theater.seatCount || 200} seats</span><Link to={`/theaters/${theater._id}`} className="text-link">See films <ArrowRight size={14} /></Link></div></div></article>)}</div>
            : <div className="empty-state empty-large"><Film size={25} /><h3>No theatres found</h3><p>Try another city, or check back soon.</p></div>}
    </main>
  )
}
