# GCP Deployment Guide

This document outlines how this application would be deployed to Google Cloud Platform.

---

## Architecture Overview

| Component | GCP Service |
|---|---|
| Frontend | Cloud Run (containerised Next.js) |
| Backend API | Cloud Run (containerised Express) |
| Database | MongoDB Atlas (external, connected over TLS) |
| Secrets | Secret Manager |
| Docker images | Artifact Registry |

---

## 1. Frontend — Cloud Run

The Next.js app is built into a Docker image and deployed as a Cloud Run service.

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

Next.js `output: 'standalone'` must be enabled in `next.config.ts`.

Deploy:

```bash
gcloud run deploy task-manager-frontend \
  --image REGION-docker.pkg.dev/PROJECT/task-manager/frontend:latest \
  --region REGION \
  --allow-unauthenticated \
  --set-env-vars NEXT_PUBLIC_API_URL=https://BACKEND_CLOUD_RUN_URL
```

---

## 2. Backend API — Cloud Run

The Express API is containerised and deployed similarly.

```dockerfile
# backend/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm ci --omit=dev
EXPOSE 5000
CMD ["node", "dist/index.js"]
```

Deploy:

```bash
gcloud run deploy task-manager-backend \
  --image REGION-docker.pkg.dev/PROJECT/task-manager/backend:latest \
  --region REGION \
  --allow-unauthenticated \
  --set-secrets JWT_SECRET=jwt-secret:latest,JWT_REFRESH_SECRET=jwt-refresh-secret:latest,MONGO_URI=mongo-uri:latest \
  --set-env-vars PORT=5000,NODE_ENV=production,FRONTEND_URL=https://FRONTEND_CLOUD_RUN_URL
```

---

## 3. MongoDB — MongoDB Atlas

MongoDB Atlas is the recommended approach — no self-managed infrastructure required.

Steps:
1. Create a free/paid cluster on [MongoDB Atlas](https://cloud.mongodb.com).
2. Whitelist Cloud Run's egress IP range **or** enable VPC peering / Private Service Connect for production.
3. Store the connection string (with credentials) in **Secret Manager** as `mongo-uri`.

Alternatively, a self-hosted option using **Cloud SQL** is not suitable for MongoDB. For a GCP-native option, **Firestore** could replace MongoDB, but would require application changes.

---

## 4. Environment Variables — Secret Manager

Sensitive values are stored in GCP Secret Manager and injected at runtime:

```bash
# Create secrets
echo -n "supersecretjwt" | gcloud secrets create jwt-secret --data-file=-
echo -n "supersecretrefresh" | gcloud secrets create jwt-refresh-secret --data-file=-
echo -n "mongodb+srv://..." | gcloud secrets create mongo-uri --data-file=-
```

Cloud Run automatically pulls secrets and injects them as environment variables via the `--set-secrets` flag. Non-sensitive config (PORT, NODE_ENV, URLs) is passed with `--set-env-vars`.

---

## 5. Docker Images — Artifact Registry

```bash
# Create repository
gcloud artifacts repositories create task-manager \
  --repository-format=docker \
  --location=REGION

# Authenticate
gcloud auth configure-docker REGION-docker.pkg.dev

# Build and push
docker build -t REGION-docker.pkg.dev/PROJECT/task-manager/backend:latest ./backend
docker push REGION-docker.pkg.dev/PROJECT/task-manager/backend:latest

docker build -t REGION-docker.pkg.dev/PROJECT/task-manager/frontend:latest ./frontend
docker push REGION-docker.pkg.dev/PROJECT/task-manager/frontend:latest
```

For CI/CD, **Cloud Build** can automate builds and pushes on every git push.

---

## 6. Security Considerations

- **Secrets** — Never commit `.env` files. All secrets live in Secret Manager with IAM-restricted access (least privilege).
- **CORS** — The backend only allows requests from the frontend's Cloud Run URL (`FRONTEND_URL`).
- **HTTPS** — Cloud Run enforces HTTPS by default on all services. HTTP is redirected.
- **JWT** — Access tokens expire in 1 hour. Refresh tokens are httpOnly cookies (7 days) and are rotated on each use.
- **Container security** — Images run as non-root (use `USER node` in Dockerfile). Dependabot or `npm audit` should be enabled.
- **MongoDB** — Enable Atlas IP Access List. Avoid `0.0.0.0/0`. Use a dedicated DB user with minimal permissions.
- **IAM** — Each Cloud Run service should use a dedicated Service Account with only the permissions it needs (e.g., `secretmanager.secretAccessor`).
- **VPC** — For production, place Cloud Run services inside a Shared VPC and use Private Service Connect to reach MongoDB Atlas without traversing the public internet.
