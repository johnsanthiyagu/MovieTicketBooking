const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connectionString =
      process.env.CONNECTION_STRING ||
      process.env.MONGO_URI ||
      'mongodb://127.0.0.1:27017/movie_ticket_booking';
    const conn = await mongoose.connect(connectionString, { serverSelectionTimeoutMS: 8000 });
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    console.error('Set CONNECTION_STRING (or MONGO_URI) in Backend/.env and ensure the database is reachable.');
    throw error;
  }
};

module.exports = connectDB;
