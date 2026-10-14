import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return <main className="page-shell container not-found"><span>404</span><h1>That reel has <em>unspooled.</em></h1><p>We couldn’t find that page. Let’s find you a better story.</p><Link to="/" className="button button-gold">Back to the films <ArrowRight size={16} /></Link></main>
}
