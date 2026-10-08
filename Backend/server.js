require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const app = express();
const port = Number(process.env.PORT) || 4000;

app.disable('x-powered-by');
app.use(cors({
  origin: process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map((url) => url.trim())
    : true
}));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => {
  res.status(mongoose.connection.readyState === 1 ? 200 : 503).json({
    status: mongoose.connection.readyState === 1 ? 'ok' : 'database_disconnected',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/movies', require('./routes/movieRoutes'));
app.use('/api/theaters', require('./routes/theaterRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` }));
app.use((error, _req, res, _next) => {
  console.error(`${error.name || 'Error'}: ${error.message}`);
  if (error.name === 'ValidationError') {
    return res.status(400).json({ message: error.message });
  }
  if (error.name === 'CastError') {
    return res.status(400).json({ message: 'The requested identifier is invalid.' });
  }
  if (error.code === 11000) {
    return res.status(409).json({ message: 'A record with those details already exists.' });
  }
  return res.status(500).json({
    message: process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred.' : error.message
  });
});

const start = async () => {
  try {
    await connectDB();
  } catch {
    console.error('API will start without database access; database-backed actions will return errors until MongoDB reconnects.');
  }
  const server = app.listen(port, () => console.log(`Movie booking API listening on http://localhost:${port}`));
  const reconnectTimer = setInterval(async () => {
    if (mongoose.connection.readyState === 0) {
      try {
        await connectDB();
      } catch {
        console.error('MongoDB retry failed.');
      }
    }
  }, 15000);
  reconnectTimer.unref();
  process.on('SIGTERM', () => server.close(() => process.exit(0)));
};

if (require.main === module) start();

module.exports = app;
