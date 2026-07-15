# Cloudflare Deployment & Architecture Guide

This document outlines the architecture, configuration, database schema, and commands for running and deploying the HR Management system on Cloudflare.

---

## 1. Architecture Overview

The application is deployed on Cloudflare using a modern, serverless architecture that bundles both the frontend and backend under a single Cloudflare Worker.

```
                  ┌──────────────────────────────┐
                  │      Cloudflare Edge         │
                  └──────────────┬───────────────┘
                                 │
                  ┌──────────────▼───────────────┐
                  │      Cloudflare Worker       │
                  │       (hr-management)        │
                  └──────────────┬───────────────┘
                                 │
         ┌───────────────────────┴───────────────────────┐
         │                                               │
┌────────▼───────────────────────┐             ┌────────▼───────────────────────┐
│     Cloudflare Assets          │             │         Hono Worker            │
│  (React Frontend from /dist)   │             │   (Backend API /api/*)         │
└────────────────────────────────┘             └────────┬───────────────────────┘
                                                        │
                                               ┌────────▼───────────────────────┐
                                               │      Cloudflare D1 SQL         │
                                               │     (hr-management-db)         │
                                               └────────────────────────────────┘
```

*   **Frontend (React + Vite 6)**: Compiled into static assets (`frontend/dist`) and served by Cloudflare's global edge network (Worker Assets).
*   **Backend (Hono Router)**: Running inside the Worker (`backend/worker.js`), handling all requests under the `/api/*` path.
*   **Database (Cloudflare D1)**: A serverless SQL database storing users, departments, attendance logs, leaves, and requests.

---

## 2. Configuration (`wrangler.toml`)

The [wrangler.toml](file:///c:/Users/ABC/OneDrive/Desktop/hrmanagement/HR-Management/wrangler.toml) file configures the Worker, asset serving, and database binding:

*   **`main`**: Points to the entry point `backend/worker.js`.
*   **`[assets]`**:
    *   `directory`: Serves files from `frontend/dist`.
    *   `not_found_handling = "single-page-application"`: Fallbacks to `index.html` for client-side React Router navigation.
    *   `run_worker_first = ["/api/*"]`: Optimizes performance by executing the Hono Worker only for API calls, leaving static asset requests to Cloudflare's asset pipeline.
*   **`[[d1_databases]]`**: Binds the Cloudflare D1 SQL database to `c.env.DB`.

---

## 3. Database Schema (`schema.sql`)

The database consists of 11 relational SQL tables:
1.  **`users`**: Stored user profiles, hashed passwords, roles (`hr` or `employee`), and department assignments.
2.  **`departments`**: Stores department name, descriptions, and soft-delete states.
3.  **`leave_types`**: Leave categories (e.g., Annual, Sick, Casual) and their quotas.
4.  **`leave_requests`**: Applied leave details, date ranges, and statuses.
5.  **`attendance`**: Daily check-in/check-out timestamps.
6.  **`holidays`**: Public/optional/restricted holidays.
7.  **`onboarding_tasks`**: List of tasks for onboarding new practices.
8.  **`onboarding_task_completions`**: Junction table mapping tasks to user completions.
9.  **`hr_requests`**: Employee requests (Attendance correction, Salary slip, WFH, etc.) with HR remarks.
10. **`practice_infos`**: Configuration of the medical practice.
11. **`practice_providers`**: Providers registered under the practice.

---

## 4. Setup & Commands Reference

Ensure you are logged into Cloudflare via Wrangler:
```bash
npx wrangler whoami
```

### Initialize the Database (Remote)
Run this command to create and initialize the tables on your Cloudflare D1 database:
```bash
npm run db:init
```
*(Executes: `wrangler d1 execute hr-management-db --remote --file=./schema.sql`)*

### Set Environment Secrets
Upload your JWT signing key securely to Cloudflare:
```bash
echo "your_super_secret_jwt_key" | npx wrangler secret put JWT_SECRET
```

### Run Local Development
Test the application locally (Worker + D1 + local asset simulator):
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
The Hono backend (`backend/worker.js`) has an automatic seeder. Upon the first API call, if the tables are empty, it automatically seeds:
- An HR Admin account: **`admin@hr.com`** (Password: **`admin123`**).
- Default leave types (Annual Leave, Sick Leave, Casual Leave).
- Default departments (`development`, `design`, `hr`, `QA`).

#### Why does the frontend use `/api` instead of an absolute URL?
Because the frontend assets and Hono Worker run on the same Cloudflare host, we set `VITE_API_URL=/api` in [frontend/.env](file:///c:/Users/ABC/OneDrive/Desktop/hrmanagement/HR-Management/frontend/.env). This eliminates CORS issues and ensures the app works automatically on development, staging, preview, and custom domains.
