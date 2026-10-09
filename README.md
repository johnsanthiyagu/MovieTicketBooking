# Lumière — Movie Ticket Booking

A MERN movie-ticket booking starter with a responsive React and TailwindCSS client and an Express/Mongoose API.

## Features

- Movie catalogue, title/genre filters, cinema directory, and date-filtered showtimes.
- JWT sign-up/sign-in with regular-user, theater-owner, and admin roles.
- Interactive 200-seat maps, server-priced tickets, atomic seat reservation, unique booking codes, booking history, cancellations, and printable ticket confirmations.
- Demo-only checkout with selectable UPI, QR code, card, net banking, and digital wallet methods. The chosen method is stored on the transaction, but checkout does **not** contact a payment provider or charge/refund money.
- Branded Nodemailer booking confirmation emails, including the simulated payment method and an explicit no-charge notice, when email settings are configured.
- OMDb search/import from the admin schedule manager, when an OMDb API key is configured.
- Theater-owner schedule management, admin schedule tools, and booking/revenue/occupancy summaries.
- Seed script for 50 development accounts, 10 theaters, 10 movies, and 4 showtimes per theater.

## Requirements

- Node.js 20.19+ (or a compatible current LTS release) and npm.
- MongoDB local instance or MongoDB Atlas database.

## Configure the backend

```powershell
cd Backend
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Edit `Backend/.env` with your own values:

```dotenv
PORT=4000
CLIENT_URL=http://localhost:5173
CONNECTION_STRING=mongodb://127.0.0.1:27017/movie_ticket_booking
JWT_SECRET_CODE=generate_a_long_random_secret
OMDB_API_KEY=your_omdb_key
EMAIL_USER=
EMAIL_PASS=
EMAIL_SERVICE=gmail
FRONTEND_URL=http://localhost:5173
SEED_PASSWORD=choose_a_development_password_at_least_8_characters
NODE_ENV=development
```

`EMAIL_PASS` should be a provider-specific app password, not your normal email password. Configure `EMAIL_USER`, `EMAIL_PASS`, and `FRONTEND_URL` to send password-reset links; reset links expire after one hour and can only be used once. Keep `.env` private; it is ignored by Git. The API also accepts `MONGO_URI` and `JWT_SECRET` for compatibility.

Install and start the API:

```powershell
npm install
npm run dev
```

The backend development script uses Node's built-in `--watch` mode rather than Nodemon, avoiding a vulnerable transitive watcher dependency.

In another backend terminal, seed the development database:

```powershell
npm run seed
```

The seed command is repeatable and adds missing demo records without deleting bookings. It requires `SEED_PASSWORD` in `.env`. Seeded accounts include `demo.admin01@example.com`, theater owners `demo.owner02@example.com` through `demo.owner11@example.com`, and guests `demo.user12@example.com` through `demo.user50@example.com`. Newly created demo accounts use the configured seed password; rerunning the seed does not change passwords on accounts that already exist.

Admins and theater owners sign in on the same `/login` page as guests. After signing in, manager accounts are directed to the **Manage** dashboard; theater owners can manage only their own cinema schedules. For a seeded admin, use `demo.admin01@example.com`; for seeded theater owners, use an address from `demo.owner02@example.com` through `demo.owner11@example.com`. Use the `SEED_PASSWORD` configured before seeding. Public sign-up creates regular guest accounts only; manager roles must be assigned by an administrator or created by the seed script.

## Configure the frontend

```powershell
cd Frontend/my-react-app
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm install
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`). To create a production build, run `npm run build` from the frontend directory.

## API outline

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`
- `GET /api/movies`, `GET /api/movies/:id`, `GET /api/movies/omdb/search?title=...`, admin `POST /api/movies/omdb/import`
- `GET /api/theaters`, `GET /api/theaters/showtimes`, `GET /api/theaters/showtimes/:id`
- Theater-owner/admin `POST`, `PATCH`, and `DELETE /api/theaters/showtimes`
- Authenticated `POST /api/bookings`, `GET /api/bookings/mine`, `PATCH /api/bookings/:id/cancel`
- Admin/theater-owner `GET /api/analytics`
- `GET /api/health`

Protected endpoints expect `Authorization: Bearer <token>`.

## Production considerations

When deploying the backend to Vercel, configure `CONNECTION_STRING` (or `MONGO_URI`) as a project environment variable using the production MongoDB connection URI. The API connects on demand and reuses the connection for subsequent requests in the same function instance. Ensure the MongoDB deployment allows connections from your Vercel deployment.

The included payment flow is intentionally a demo, not a payment gateway integration. A production launch needs a provider such as Stripe or Razorpay, server-side payment-intent verification and webhook handling, and idempotent refund handling before marking payments as settled. Configure production secrets, HTTPS, email delivery, rate limits, monitoring, MongoDB backups, and privacy/retention policies before deployment. The frontend uses external Google Fonts and image URLs for the visual demo.
