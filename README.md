# NexusDial

![Tests](https://img.shields.io/badge/tests-passing-brightgreen)

> A modern, multi-tenant cloud phone system with AI-powered voicemail extraction and real-time call analytics.

NexusDial provides businesses with isolated virtual numbers, real-time call simulation, instant contact management, and intelligent voicemail summaries powered by Groq API.

---

## Features
- **Multi-Tenant Architecture:** Strict data isolation between business accounts.
- **AI Voicemail Summaries:** Auto-transcription and sentiment analysis for missed calls using Groq.
- **Real-Time Call Events:** Instant UI updates via WebSockets when calls are received.
- **Cross-Platform Mobile App:** Built with React Native and Expo for a beautiful native experience.
- **Secure by Default:** OTP-based authentication with secure token storage.

---

## Quick Start (Under 10 Minutes)

Get the entire stack running locally in minutes!

### Prerequisites
- **Docker Desktop** (for PostgreSQL and Redis)
- **Node 20+**
- **A Groq API Key** (the free tier works perfectly)

### 1. Backend Setup
Clone the repository and jump into the backend folder:
```bash
git clone https://github.com/sahilxpatel/NexusDial.git
cd NexusDial/backend
```

Configure your environment variables:
```bash
cp .env.example .env
```

#### Environment Variables
Copy `.env.example` to `.env` and fill in the values:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Random secret string for signing JWTs |
| `GROQ_API_KEY` | Your Groq API key (free at console.groq.com) |
| `PORT` | Server port (default: 3000) |

Spin up the databases and start the server:
```bash
# Start Postgres and Redis
docker-compose up -d

# Install dependencies, migrate the database, and seed the number pool
npm install && npx prisma migrate deploy && npx prisma db seed

# Start the backend server
npm run dev
```

### 2. Mobile App Setup
Open a new terminal window and jump into the mobile folder:
```bash
cd NexusDial/mobile

# Install dependencies and start the Expo bundler
npm install && npx expo start
```
*Scan the QR code with the Expo Go app on your physical device, or press `a` / `i` to run on an emulator.*

> **Physical Device Note:** Open `mobile/.env` and set `API_URL=http://YOUR_MACHINE_IP:3000/api`.
> Your machine and phone must be on the same WiFi. Find your IP with `ifconfig` (Mac/Linux) or `ipconfig` (Windows).

### 3. Test Credentials (Login)
When the mobile app launches, use the following credentials to securely log in:
- **Mobile Number:** Any valid E.164 number (e.g., `+19999999999` or your own number with country code like `+919876543210`)
- **OTP:** `123456` (Mocked for testing environments)

---

## Testing

To run the backend API verification tests:
```bash
# In the backend directory
npm test
```

---

## Tech Stack
- **Backend:** Node.js, Express, TypeScript, Prisma, PostgreSQL, Redis, BullMQ, Socket.io
- **Mobile:** React Native, Expo, Zustand, React Query, React Navigation
- **AI:** Groq API

---

## Architecture overview
- **Mobile Client:** Built with React Native, communicates with the backend via REST API (React Query) and WebSockets for real-time call events.
- **API Server:** Node.js Express server that handles HTTP requests, authentication, and strictly isolates data per tenant using Prisma middleware.
- **Database:** PostgreSQL stores all persistent data (Tenants, Contacts, CallRecords, VirtualNumbers) with robust relational integrity.
- **Message Queue:** Redis and BullMQ handle asynchronous tasks, specifically the AI voicemail processing jobs, ensuring the main thread remains unblocked and retries are managed properly.
- **AI Processing Worker:** Background workers pull from the queue, interface with the Groq API for rapid transcription and sentiment analysis, and save the extracted data back to the database.
