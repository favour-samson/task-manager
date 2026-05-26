# Task Manager — Full Stack Assessment

A full stack task management application with JWT authentication and role-based access control.

**Stack:** Next.js 14 (TypeScript + Tailwind CSS) · Node.js + Express (TypeScript) · MongoDB · JWT

---

## Prerequisites

- [Node.js 18+](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/) running locally **or** a MongoDB Atlas connection string
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) *(only needed for Docker setup)*

---

## Option A — Run locally without Docker

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # then fill in your values
npm run dev               # http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local    # then fill in your values
npm run dev                          # http://localhost:3000
```

Open **http://localhost:3000** in your browser.

---

## Option B — Run with Docker (production build)

Builds optimised images and starts all three services (frontend, backend, MongoDB) in one command.

```bash
docker compose up --build
```

- Frontend → http://localhost:3000
- Backend  → http://localhost:5000
- MongoDB runs internally (not exposed to your machine)

To stop:

```bash
docker compose down
```

---

## Option C — Run with Docker (development + live reload)

Uses `ts-node-dev` and `next dev` so changes you make to the source code reflect in the running containers **without restarting**.

```bash
# First run (builds the images)
docker compose -f docker-compose.dev.yml up --watch --build

# After that
docker compose -f docker-compose.dev.yml up --watch
```

How file watching works:

Edit a file in `backend/src/` - Synced into container → `ts-node-dev` auto-restarts 
Edit a file in `frontend/src/` - Synced into container → Next.js HMR updates the browser 
Edit `next.config.mjs` - Synced + dev server restarts 
Edit `package.json` - Image rebuilds automatically 

---

## Creating an Admin Account

**If running locally (Option A):**

```bash
cd backend
npm run create-admin
```

**If running with Docker (Option B or C):**

With the stack already running, open a new terminal and run:

```bash
# Dev stack
docker compose -f docker-compose.dev.yml exec backend npm run create-admin

# Production stack
docker compose exec backend npm run create-admin
```

Both prompt for name, email, and password, then save the user with `role: admin` in the database.

> Running it directly on your machine (outside the container) won't work with Docker — it would try to connect to MongoDB on `localhost` instead of the container network.

> Regular accounts registered through the UI always get `role: user` by default.

---

## Environment Variables

### Backend — `backend/.env`

`PORT` - Server port 
`MONGO_URI` - MongoDB connection string 
`JWT_SECRET` - Access token signing secret 
`JWT_EXPIRES_IN` - Access token expiry 
`JWT_REFRESH_SECRET` - Refresh token signing secret 
`FRONTEND_URL` - Allowed CORS origin 
`NODE_ENV` - Environment 

### Frontend — `frontend/.env.local`

`NEXT_PUBLIC_API_URL` - `http://localhost:5000` 

---

## API Endpoints

POST - `/api/auth/register` 
POST - `/api/auth/login` 
POST - `/api/auth/refresh` 
POST - `/api/auth/logout` 
GET - `/api/users` 
GET - `/api/tasks` 
POST - `/api/tasks` 
PUT - `/api/tasks/:id` 
DELETE - `/api/tasks/:id` 


