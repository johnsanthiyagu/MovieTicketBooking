import { Film } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
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
