# Lumière — Movie Ticket Booking

A MERN movie-ticket booking starter with a responsive React and TailwindCSS client and an Express/Mongoose API.

## Features

- Movie catalogue, title/genre filters, cinema directory, and date-filtered showtimes.
- JWT sign-up/sign-in with regular-user, theater-owner, and admin roles.
- Interactive 200-seat maps, server-priced tickets, atomic seat reservation, unique booking codes, booking history, cancellations, and printable ticket confirmations.
- Razorpay test-mode checkout for every ticket booking, with server-created orders, ten-minute seat holds, signature verification, booking history, and test-mode refunds.
- Branded Nodemailer booking confirmation emails with Razorpay test-payment details, when email settings are configured.
- OMDb search/import from the admin schedule manager, when an OMDb API key is configured.
- Theater-owner schedule management, admin schedule tools, and booking/revenue/occupancy summaries.
- Theater-owner registration and theater applications with admin approval before public listing or showtime scheduling.
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
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_test_key_secret
ADMIN_REGISTRATION_CODE=private_admin_invitation_code
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

Choose User, Theatre owner, or Admin with the account-type radio controls on `/login`. New user and theater-owner accounts can be registered there. Admin registration additionally requires `ADMIN_REGISTRATION_CODE`; keep that code private. After signing in, manager accounts open the **Manage** dashboard. Theater owners submit theater applications from Manage and can schedule shows only after an administrator approves them. The seed script creates development accounts such as `demo.admin01@example.com` and `demo.owner02@example.com`; set `SEED_PASSWORD` in your local environment and never publish account passwords.

Bookings use Razorpay Standard Checkout in test mode, not a dummy payment gateway. Use test credentials from the Razorpay dashboard in `Backend/.env`. Test payments do not collect real funds. The backend keeps the key secret private, creates orders, verifies payment signatures, and captures authorized payments. Use the test payment methods and current test card/UPI details documented in the Razorpay dashboard.

## Configure the frontend

```powershell
cd Frontend
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm install
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`). To create a production build, run `npm run build` from `Frontend`.

## API outline

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`
- `GET /api/movies`, `GET /api/movies/:id`, `GET /api/movies/omdb/search?title=...`, admin `POST /api/movies/omdb/import`
- `GET /api/theaters`, `GET /api/theaters/:id/shows`, `GET /api/theaters/showtimes`, `GET /api/theaters/showtimes/:id`
- Theater owners `POST /api/theaters`; admins review with `GET /api/theaters/pending` and `PATCH /api/theaters/:id/approval`
- Theater-owner/admin `POST`, `PATCH`, and `DELETE /api/theaters/showtimes` (approved theaters only)
- User `POST /api/bookings/razorpay/order`, `POST /api/bookings/razorpay/verify`, `GET /api/bookings/mine`, and `PATCH /api/bookings/:id/cancel`
- Admin/theater-owner `GET /api/analytics`
- `GET /api/health`

Protected endpoints expect `Authorization: Bearer <token>`.

## Production considerations

When deploying the backend to Vercel, configure `CONNECTION_STRING` (or `MONGO_URI`) as a project environment variable using the production MongoDB connection URI. The API connects on demand and reuses the connection for subsequent requests in the same function instance. Ensure the MongoDB deployment allows connections from your Vercel deployment.

The included Razorpay integration is for test mode only. Before accepting live payments, use live credentials, configure and verify Razorpay webhooks, test refund/idempotency behavior, and review deployment security. Configure production secrets, HTTPS, email delivery, rate limits, monitoring, MongoDB backups, and privacy/retention policies before launch. The frontend uses external Google Fonts and image URLs for the visual demo.



## use this credentials for testing:
Admin credential (for your evaluation) 
Email: johnsanthiyagu94@gmail.com Pws: John@123

Theatre owner(manage showtime, price...) 
Email: demo.owner02@example.com 
Pwd: Owner@123

User: create your own account and book a ticket.

Payment: dummy payment gateway
Test UPI: test@razorpay
Test card: 4100 2800 0000 1007 
CVV: 123 
Expiry: 12/26