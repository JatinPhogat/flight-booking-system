# Flight Booking System

A simple full-stack flight booking system implementing:
- Database-backed flight search (MongoDB Atlas)
- Dynamic pricing (10% surge after 3 booking attempts within 5 minutes, resets after 10 minutes)
- Wallet (default ₹50,000) with deduction on booking
- Filters and sorting on flights
- Ticket Surge indicators and countdown
- PDF ticket generation with PNR
- Booking history with ticket re-download

- Attempts are tracked per user and auto-expire after 5 minutes.
- Price adjustments auto-expire after 10 minutes via TTL index.
- Tickets: locally (Express) they’re saved under `server/tickets/` and served statically; on Vercel serverless they’re streamed on demand from `/api/bookings/:id/ticket` (no disk storage).


## Tech Stack
- Backend: Node.js (Express) + Mongoose
- Database: MongoDB Atlas Cloud
- Frontend: React + (Vite) 

## Note
This is client-server based arhitecture but I’m deploying with a serverless architecture {detailed section: [Serverless API Architecture](#serverless-api-architecture)}
The reason is that i am a student and can't track all the deployments of different servers continuously and they can also incur very high charges like render/aws.

## Setup

### 1 Backend
```
cd server
npm install
```
Create a `.env` file in `server/` with:
```
MONGODB_URI=your-mongodb-uri
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
APP_URL=http://localhost:4000
```
Seed flights:
```
npm run seed
```
Run server:
```
npm run dev
```
APIs:
- GET /api/health
- GET /api/flights?departure=City&arrival=City
- GET /api/wallet
- POST /api/wallet/reset
- POST /api/bookings (body: { passenger_name, flight_id })
- GET /api/bookings
- Ticket files: /tickets/<PNR>.pdf

### 2 Frontend
```
cd ../client
npm install
npm run dev
```
Open http://localhost:5173

The frontend uses a generated `x-user-id` stored in localStorage for wallet and history isolation.


## Serverless API Architecture

For deployment, this app also runs purely on Vercel Functions. The serverless API lives under [client/api](client/api) and exposes the same endpoints via `/api` on your Vercel domain.

- Where the API lives: [client/api](client/api)
	- [client/api/health.js](client/api/health.js): health check.
	- [client/api/flights.js](client/api/flights.js): flight search with surge + sorting.
	- [client/api/wallet/index.js](client/api/wallet/index.js): get wallet.
	- [client/api/wallet/reset.js](cliesummary under thnt/api/wallet/reset.js): reset wallet.
	- [client/api/bookings/index.js](client/api/bookings/index.js): list + create bookings.
	- Dynamic route: [client/api/bookings/[id]/ticket.js](client/api/bookings/%5Bid%5D/ticket.js) streams the PDF for a specific booking. The `[id]` folder name is intentional and correct in Vercel—it defines a dynamic segment, so the endpoint becomes `/api/bookings/:id/ticket`.

- Env vars on Vercel (Project Settings → Environment Variables):
	- `MONGODB_URI` — MongoDB Atlas connection string
	- `APP_URL` (optional) — your Vercel URL to build absolute ticket links

- Frontend API base:
	- The client calls same-origin `/api` by default (see [client/src/api.js](client/src/api.js)). No DB secrets are exposed to the browser.

- Tickets in serverless:
	- Tickets are generated on demand and streamed from `/api/bookings/:id/ticket` (no disk storage).
