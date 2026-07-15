# Cloudflare + MongoDB Atlas Deployment & Architecture Guide

This document outlines the architecture, configuration, database design, and commands for running and deploying the HR Management system on Cloudflare Workers and MongoDB Atlas.

---

## 1. Architecture Overview

The application is deployed on Cloudflare using a modern, serverless architecture that bundles the frontend assets and backend API into a single Worker. The backend connects directly to MongoDB Atlas.

```
                  ┌──────────────────────────────┐
                  │      Cloudflare Edge         │
                  └──────────────┬───────────────┘
                                 │
                  ┌──────────────▼───────────────┐
                  │      Cloudflare Worker       │
                  │       (hr-management)        │
                  └──────────────┬──────┬────────┘
                                 │      │
         ┌───────────────────────┘      └────────────────────────┐
         │                                                       │
┌────────▼───────────────────────┐             ┌─────────────────▼──────────────┐
│     Cloudflare Assets          │             │         Hono Worker            │
│  (React Frontend from /dist)   │             │   (Backend API /api/*)         │
└────────────────────────────────┘             └─────────────────┬──────────────┘
                                                                 │
                                                       ┌─────────▼──────────────┐
                                                       │    MongoDB Atlas       │
                                                       │  (NoSQL Database)      │
                                                       └────────────────────────┘
```

*   **Frontend (React + Vite 6)**: Compiled into static assets (`frontend/dist`) and served by Cloudflare's global edge network (Worker Assets).
*   **Backend (Hono Router)**: Running inside the Worker (`backend/worker.js`), handling all requests under the `/api/*` path.
*   **Database (MongoDB Atlas)**: Storing users, departments, attendance logs, leaves, and requests.

---

## 2. Configuration (`wrangler.toml`)

The [wrangler.toml](file:///c:/Users/ABC/OneDrive/Desktop/hrmanagement/HR-Management/wrangler.toml) file configures the Worker and asset serving:

*   **`main`**: Points to the entry point `backend/worker.js`.
*   **`compatibility_flags`**: Includes `"nodejs_compat"` to enable standard Node.js APIs (such as sockets and crypto) required by the MongoDB client driver.
*   **`[assets]`**:
    *   `directory`: Serves files from `frontend/dist`.
    *   `not_found_handling = "single-page-application"`: Fallbacks to `index.html` for client-side React Router navigation.
    *   `run_worker_first = ["/api/*"]`: Runs the Hono Worker only for API calls, letting static asset requests bypass the worker for maximum performance.

---

## 3. Database Collections

The database consists of the following collections:
1.  **`users`**: Stored user profiles, hashed passwords, roles (`hr` or `employee`), and department assignments.
2.  **`departments`**: Stores department name, descriptions, and soft-delete states.
3.  **`leave_types`**: Leave categories (e.g., Annual, Sick, Casual) and their quotas.
4.  **`leave_requests`**: Applied leave requests, date ranges, and statuses.
5.  **`attendance`**: Daily check-in/check-out timestamps.
6.  **`holidays`**: Public/optional/restricted holidays.
7.  **`onboarding_tasks`**: List of tasks for onboarding new practices.
8.  **`onboarding_task_completions`**: Completed onboarding tasks mapped to user IDs.
9.  **`hr_requests`**: Employee requests (Attendance correction, Salary slip, WFH, etc.) with HR remarks.
10. **`practice_infos`**: Configuration of the medical practice.
11. **`practice_providers`**: Providers registered under the practice.

---

## 4. Setup & Commands Reference

Ensure you are logged into Cloudflare via Wrangler:
```bash
npx wrangler whoami
```

### Set Environment Secrets (Required)
You must set your MongoDB Atlas connection string securely as a Worker secret:
```bash
npx wrangler secret put MONGODB_URI
```
*Provide your connection string in the format:*
`mongodb+srv://<username>:<password>@cluster0.xxxxxx.mongodb.net/?appName=Cluster0`

Upload your JWT signing key securely to Cloudflare:
```bash
npx wrangler secret put JWT_SECRET
```

### Run Local Development
Test the application locally:
```bash
npm run dev
```

### Build & Deploy to Production
Compile the frontend and publish the Worker and its assets to Cloudflare:
```bash
npm run deploy
```
*(Executes: `npm run build && wrangler deploy`)*

---

## 5. Troubleshooting & FAQ

#### How do I seed initial data?
The Hono backend (`backend/worker.js`) has an automatic seeder. Upon the first API call, if the collections are empty, it automatically seeds:
- An HR Admin account: **`admin@hr.com`** (Password: **`admin123`**).
- Default leave types (Annual Leave, Sick Leave, Casual Leave).
- Default departments (`development`, `design`, `hr`, `QA`).

#### Why does the frontend use `/api` instead of an absolute URL?
Because the frontend assets and Hono Worker run on the same Cloudflare host, we set `VITE_API_URL=/api` in [frontend/.env](file:///c:/Users/ABC/OneDrive/Desktop/hrmanagement/HR-Management/frontend/.env). This eliminates CORS issues and ensures the app works automatically on development, staging, preview, and custom domains.
