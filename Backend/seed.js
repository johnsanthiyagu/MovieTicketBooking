require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Theater = require('./models/Theater');
const Movie = require('./models/Movie');
const Showtime = require('./models/Showtime');

const titles = [
  ['Dune: Part Two', '2024', 'Sci-Fi', 'A young heir joins a desert people to shape the future of a world.'],
  ['Oppenheimer', '2023', 'Drama', 'A brilliant physicist leads a project that changes the course of history.'],
  ['Spider-Man: Across the Spider-Verse', '2023', 'Animation', 'Miles Morales journeys across a spectacular multiverse.'],
  ['The Batman', '2022', 'Action', 'A masked detective follows a trail of clues through a city in crisis.'],
  ['Everything Everywhere All at Once', '2022', 'Adventure', 'An ordinary woman discovers extraordinary possibilities across realities.'],
  ['Top Gun: Maverick', '2022', 'Action', 'A veteran pilot returns to train a new generation for a demanding mission.'],
  ['Interstellar', '2014', 'Sci-Fi', 'Explorers travel beyond our solar system in search of a future for humanity.'],
  ['Inception', '2010', 'Thriller', 'A specialist enters layered dreams to carry out an impossible assignment.'],
  ['The Grand Budapest Hotel', '2014', 'Comedy', 'A concierge and his protégé embark on a charming European adventure.'],
  ['La La Land', '2016', 'Romance', 'A musician and an actor pursue their ambitions in Los Angeles.']
];
const posters = [
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1535016120720-40c646be5580?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1474302770737-173ee21bab63?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=85'
];
const cities = ['Chennai', 'Bengaluru', 'Hyderabad', 'Mumbai', 'Delhi', 'Pune', 'Kochi', 'Coimbatore', 'Jaipur', 'Kolkata'];
const seatLayout = (basePrice) => Array.from({ length: 200 }, (_, index) => {
  const rowIndex = Math.floor(index / 20);
  const row = String.fromCharCode(65 + rowIndex);
  const premium = rowIndex >= 8;
  return {
    label: `${row}${(index % 20) + 1}`,
    row,
    number: (index % 20) + 1,
    type: premium ? 'premium' : 'standard',
    price: basePrice + (premium ? Math.round(basePrice * 0.25) : 0),
    status: 'available'
  };
});

const seed = async () => {
  await connectDB();
  const password = process.env.SEED_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error('Set SEED_PASSWORD to at least 8 characters in Backend/.env before running npm run seed.');
  }

  const users = [];
  for (let index = 1; index <= 50; index += 1) {
    const role = index === 1 ? 'admin' : index <= 11 ? 'theaterOwner' : 'user';
    const email = `demo.${role === 'user' ? 'user' : role === 'admin' ? 'admin' : 'owner'}${String(index).padStart(2, '0')}@example.com`;
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: role === 'admin' ? 'Demo Administrator' : role === 'theaterOwner' ? `Theater Owner ${index - 1}` : `Demo Guest ${index - 11}`,
        email,
        password,
        role
      });
    }
    users.push(user);
  }

  const movies = [];
  for (const [index, [title, year, genre, plot]] of titles.entries()) {
    try {
      await Movie.collection.updateOne({ title }, { $unset: { language: '' } });
      const movie = (await Movie.findOne({ title })) || new Movie({ title });
      Object.assign(movie, {
        year,
        genre: [genre],
        plot,
        rating: (7.1 + (index % 9) * 0.2).toFixed(1),
        poster: posters[index],
        languages: 'English',
        featured: index < 5
      });
      await movie.save();
      movies.push(movie);
    } catch (error) {
      throw new Error(`Could not seed movie "${title}": ${error.message}`);
    }
  }

  const theaters = [];
  for (let index = 0; index < 10; index += 1) {
    try {
      const name = `Lumière ${String(index + 1).padStart(2, '0')}`;
      const theater = (await Theater.findOne({ name, city: cities[index] })) || new Theater({ name, city: cities[index] });
      Object.assign(theater, {
        address: `${10 + index} Cinema Avenue, ${cities[index]}`,
        owner: users[index + 1]._id,
        seatCount: 200,
        facilities: ['Dolby Atmos', 'Laser Projection', 'Parking', 'Premium Lounge'],
        approvalStatus: 'approved',
        active: true
      });
      await theater.save();
      theaters.push(theater);
    } catch (error) {
      throw new Error(`Could not seed theater in ${cities[index]}: ${error.message}`);
    }
  }

  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + 1);
  baseDate.setHours(0, 0, 0, 0);
  for (const [theaterIndex, theater] of theaters.entries()) {
    for (let slot = 0; slot < 4; slot += 1) {
      const startsAt = new Date(baseDate);
      startsAt.setHours([10, 13, 17, 20][slot] + (theaterIndex % 2), 0, 0, 0);
      const movie = movies[(theaterIndex + slot) % movies.length];
      const basePrice = 220 + slot * 30;
      try {
        let showtime = await Showtime.findOne({ theater: theater._id, startsAt });
        if (!showtime) {
          showtime = new Showtime({
            movie: movie._id,
            theater: theater._id,
            startsAt,
            basePrice,
            format: slot % 2 ? 'IMAX' : '2D',
            seats: seatLayout(basePrice),
            active: true
          });
          await showtime.save();
        }
      } catch (error) {
        throw new Error(`Could not seed showtime ${slot + 1} at ${theater.name}: ${error.message}`);
      }
    }
  }

  console.log(`Seed complete: ${users.length} users, ${theaters.length} theaters, ${movies.length} movies, ${theaters.length * 4} showtimes, and 200 seats per showtime.`);
  console.log('Demo roles: demo.admin01@example.com; demo.owner02@example.com through demo.owner11@example.com; demo.user12@example.com onward.');
  console.log('All seeded demo accounts use the SEED_PASSWORD you configured.');
};

seed()
  .catch((error) => {
    console.error(`Seed failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
