const mongoose = require('mongoose');

let connectionPromise;

const connectDB = async () => {
  try {
    const connectionString = process.env.CONNECTION_STRING || process.env.MONGO_URI;
    if (!connectionString) {
      throw new Error('Set CONNECTION_STRING (or MONGO_URI) in the backend environment.');
    }

    if (mongoose.connection.readyState === 1) return mongoose.connection;
    if (mongoose.connection.readyState !== 2) connectionPromise = null;

    if (!connectionPromise) {
      connectionPromise = mongoose.connect(connectionString, { serverSelectionTimeoutMS: 8000 })
        .then((conn) => {
          console.log(`MongoDB connected: ${conn.connection.host}`);
          return conn;
        })
        .catch((error) => {
          connectionPromise = null;
          throw error;
        });
    }

    return await connectionPromise;
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    console.error('Set CONNECTION_STRING (or MONGO_URI) in the backend environment and ensure the database is reachable.');
    throw error;
  }
};

module.exports = connectDB;
