import { Film } from 'lucide-react'
import { ThreeCircles } from 'react-loader-spinner'

export default function PageLoader({ message }) {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <span className="page-loader-mark"><Film size={18} /></span>
      <ThreeCircles height={32} width={32} color="#d6b879" ariaLabel={message} wrapperClass="page-loader-spinner" />
      <span>{message}</span>
    </div>
  )
}
