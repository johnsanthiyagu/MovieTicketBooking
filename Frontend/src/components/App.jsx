import { Navigate, Route, Routes } from 'react-router-dom'
import Footer from './Footer'
import Navigation from './Navigation'
import AuthPage from './pages/AuthPage'
import BookingHistory from './pages/BookingHistory'
import HomePage from './pages/HomePage'
import ManagementPage from './pages/ManagementPage'
import NotFound from './pages/NotFound'
import ResetPasswordPage from './pages/ResetPasswordPage'
import SeatPage from './pages/SeatPage'
import ShowtimesPage from './pages/ShowtimesPage'
import TheaterShowsPage from './pages/TheaterShowsPage'
import TheatersPage from './pages/TheatersPage'

export default function App() {
  return (
    <>
      <Navigation />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/showtimes/:movieId" element={<ShowtimesPage />} />
        <Route path="/seats/:showtimeId" element={<SeatPage />} />
        <Route path="/theaters" element={<TheatersPage />} />
        <Route path="/theaters/:theaterId" element={<TheaterShowsPage />} />
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
