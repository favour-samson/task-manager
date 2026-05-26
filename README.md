# Task Manager — Full Stack Assessment
A full stack task management application with JWT authentication and role-based access control.

**Stack:** Next.js 14 (TypeScript + Tailwind CSS) · Node.js + Express (TypeScript) · MongoDB · JWT


### 1. Backend

```bash
cd backend
npm install

# Copy and edit env
cp .env.example .env

npm run dev        # starts on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install

# Copy and edit env
cp .env.local.example .env.local

npm run dev        # starts on http://localhost:3000
```

Open **http://localhost:3000** in your browser.

---

## Environment Variables

### Backend (`backend/.env`)

`PORT` | Server port | `5000` |
`MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/dev-assessment` |
`JWT_SECRET` | Access token signing secret | — |
`JWT_EXPIRES_IN` | Access token expiry | `1h` |
`JWT_REFRESH_SECRET` | Refresh token signing secret | — |
`FRONTEND_URL` | Allowed CORS origin | `http://localhost:3000` |
`NODE_ENV` | Environment | `development` |

### Frontend (`frontend/.env.local`)

`NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:5000` |



## API Endpoints

POST | `/api/auth/register` 
POST | `/api/auth/login`
POST | `/api/auth/refresh` 
POST | `/api/auth/logout` 
GET | `/api/users` 
GET | `/api/tasks` 
POST | `/api/tasks` 
PUT | `/api/tasks/:id`
DELETE | `/api/tasks/:id` 



To create an admin account, run `npm run create-admin`. It will prompt you for name, email, and password, then create the admin in MongoDB. The password gets hashed automatically by the User model's pre-save hook.
