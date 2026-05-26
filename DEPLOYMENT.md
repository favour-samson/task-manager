# GCP Deployment Guide

> **Note:** This document explains how this application would be deployed to Google Cloud Platform (GCP).

---

## What is GCP?

Google Cloud Platform is Google's cloud hosting service. Instead of running your app on your own computer or server, you run it on Google's infrastructure. This means it's available 24/7, can scale automatically, and you only pay for what you use.


## Step 1 — The Database (MongoDB Atlas)

Before deploying anything to GCP, the database needs to be set up first because the backend needs a database URL to connect to.

**What is MongoDB Atlas?**
MongoDB Atlas is a managed cloud database. Instead of installing MongoDB yourself, Atlas handles everything — backups, scaling, security. It has a free tier which is enough for this project.


1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and create a free account
2. Create a new cluster (a "cluster" is just your database server)
3. Create a database user with a username and password
4. Get your connection string — it looks like this:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/pac-technologies
   ```
5. Allow connections from anywhere (`0.0.0.0/0`) for now, or from GCP's IP range for better security

This connection string gets stored as a secret in the next step.


## Step 2 — Storing Secrets (Secret Manager)

**What is Secret Manager?**
It's like a secure vault for sensitive values like passwords and API keys. Instead of putting them directly in your code, you store them in Secret Manager and GCP injects them into your app at runtime.

```
JWT_SECRET          → the secret used to sign login tokens
JWT_REFRESH_SECRET  → the secret used to sign refresh tokens
MONGO_URI           → the MongoDB Atlas connection string from Step 1
```

In practice, you would run these commands using the `gcloud` CLI tool:

```bash
# You would run these once to create the secrets
gcloud secrets create jwt-secret --data-file=-          # then type the value
gcloud secrets create jwt-refresh-secret --data-file=-
gcloud secrets create mongo-uri --data-file=-
```

The backend Cloud Run service would then be given permission to read these secrets, and GCP automatically injects them as environment variables when the container starts.

---

## Step 3 — Storing Docker Images (Artifact Registry)

**What is Artifact Registry?**
When you run `docker build`, it creates a Docker image (a packaged version of your app). Artifact Registry is where you store those images so GCP can pull them when deploying.

Think of it like GitHub, but for Docker images instead of code.


```bash
# Create a repository to store your images
gcloud artifacts repositories create task-manager \
  --repository-format=docker \
  --location=us-central1

# Build and push the backend image
docker build -t us-central1-docker.pkg.dev/YOUR_PROJECT/task-manager/backend:latest ./backend
docker push us-central1-docker.pkg.dev/YOUR_PROJECT/task-manager/backend:latest

# Build and push the frontend image
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://YOUR_BACKEND_URL \
  -t us-central1-docker.pkg.dev/YOUR_PROJECT/task-manager/frontend:latest ./frontend
docker push us-central1-docker.pkg.dev/YOUR_PROJECT/task-manager/frontend:latest
```

---

## Step 4 — Deploying the Backend (Cloud Run)

**What is Cloud Run?**
Cloud Run runs Docker containers. You give it a Docker image, tell it which port to listen on, and it handles everything else, starting the container, scaling it up if there's more traffic, and shutting it down when idle (to save costs).


```bash
gcloud run deploy task-manager-backend \
  --image us-central1-docker.pkg.dev/YOUR_PROJECT/task-manager/backend:latest \
  --region us-central1 \
  --allow-unauthenticated \
  --port 5000 \
  --set-secrets MONGO_URI=mongo-uri:latest,JWT_SECRET=jwt-secret:latest,JWT_REFRESH_SECRET=jwt-refresh-secret:latest \
  --set-env-vars PORT=5000,NODE_ENV=production,FRONTEND_URL=https://YOUR_FRONTEND_URL
```

After running this, GCP gives you a URL like `https://task-manager-backend-xxxx-uc.a.run.app`. That is your live backend URL.

---

## Step 5 — Deploying the Frontend (Cloud Run)

The frontend is deployed the same way. The key difference is that `NEXT_PUBLIC_API_URL` must point to the backend URL from Step 4, and it needs to be set **at build time** (when you build the Docker image), not at runtime, because Next.js bakes it into the JavaScript bundle.


```bash
# Re-build the frontend image with the real backend URL
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://task-manager-backend-xxxx-uc.a.run.app \
  -t us-central1-docker.pkg.dev/YOUR_PROJECT/task-manager/frontend:latest ./frontend
docker push us-central1-docker.pkg.dev/YOUR_PROJECT/task-manager/frontend:latest

# Deploy to Cloud Run
gcloud run deploy task-manager-frontend \
  --image us-central1-docker.pkg.dev/YOUR_PROJECT/task-manager/frontend:latest \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000
```

GCP then gives you a URL like `https://task-manager-frontend-xxxx-uc.a.run.app`. That is your live app.

---

## Step 6 — Update the Backend CORS

Once you have both URLs, go back and update the backend's `FRONTEND_URL` environment variable in Cloud Run to the real frontend URL. This ensures the backend only accepts requests from your frontend, not from anyone else.

---

## Security Considerations

These are things you would think about for a real production deployment:

- **Never commit `.env` files** — secrets go in Secret Manager, not in code
- **HTTPS is automatic** — Cloud Run gives you HTTPS by default, no setup needed
- **CORS** — the backend is configured to only allow requests from the frontend URL
- **JWT expiry** — access tokens expire after 1 hour; refresh tokens after 7 days
- **MongoDB Atlas** — restrict the IP allowlist to your Cloud Run services only (not `0.0.0.0/0`) for better security in production
- **IAM (permissions)** — in a real setup, each service should only have the minimum permissions it needs. For example, the frontend container does not need access to Secret Manager at all

---

## Summary

The full deployment flow in order:

```
1. Set up MongoDB Atlas cluster
       
2. Store secrets in GCP Secret Manager
       
3. Build Docker images and push to Artifact Registry
       
4. Deploy backend to Cloud Run → get backend URL
       
5. Rebuild frontend image with backend URL baked in
       
6. Deploy frontend to Cloud Run → get frontend URL
       
7. Update backend FRONTEND_URL to the real frontend URL
```
