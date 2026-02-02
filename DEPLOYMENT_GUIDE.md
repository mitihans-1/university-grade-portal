# Deployment Guide for University Grade Portal

This guide provides step-by-step instructions to deploy your University Grade Portal (Frontend, Backend, and MySQL Database) to the cloud for free (or low cost).

## Architecture Overview

- **Frontend**: React (Vite) -> Deployed on **Vercel**
- **Backend**: Node.js (Express) -> Deployed on **Render**
- **Database**: MySQL -> Deployed on **Aiven** (or TiDB Cloud / Clever Cloud)

---

## Step 1: Set up a Free MySQL Database

Since Render's free tier only supports Postgres, and your app is built for MySQL, we will use an external free MySQL provider.

### Option A: Aiven (Recommended)
1.  Go to [Aiven.io](https://aiven.io/) and sign up.
2.  Create a new **Service**.
3.  Select **MySQL**.
4.  Choose **Free Plan** (usually under "Hobbyist" or similar).
5.  Select a cloud region (e.g., Google Cloud `us-east1`).
6.  Once created, copy the **Service URI** (it looks like `mysql://avnadmin:password@host:port/defaultdb?ssl-mode=REQUIRED`).

### Option B: TiDB Cloud
1.  Go to [TiDB Cloud](https://tidbcloud.com/).
2.  Create a free Serverless Tier cluster.
3.  Get the connection parameters (Host, User, Password, Port).

---

## Step 2: Deploy Backend to Render

1.  Go to [Render.com](https://render.com/) and sign up.
2.  Click **New +** -> **Web Service**.
3.  Connect your GitHub repository (`university-grade-portal`).
4.  **Configuration**:
    *   **Name**: `university-backend` (or similar)
    *   **Root Directory**: `backend` (Important!)
    *   **Environment**: `Node`
    *   **Build Command**: `npm install`
    *   **Start Command**: `node server.js`
    *   **Plan**: Free
5.  **Environment Variables** (Scroll down to "Advanced" or "Environment"):
    *   Add the following variables:
        *   `NODE_ENV`: `production`
        *   `PORT`: `10000` (Render default, or just leave it, Render uses PORT automatically)
        *   `DB_HOST`: (Your Aiven/TiDB Host)
        *   `DB_USER`: (Your Aiven/TiDB User)
        *   `DB_PASSWORD`: (Your Password)
        *   `DB_NAME`: `gradeportal` (or similar)
        *   `DB_PORT`: `3306` (or whatever port your provider gave)
        *   `JWT_SECRET`: (Paste your secret from `.env`)
        *   `GMAIL_USER`: `mitikumitihans@gmail.com`
        *   `EMAIL_PASS`: (Paste your email password)
        *   `FRONTEND_URL`: (We will update this *after* deploying the frontend, for now allow `*` or leave blank)
6.  Click **Create Web Service**.
7.  Wait for deployment. Once finished, copy your backend URL (e.g., `https://university-backend.onrender.com`).

---

## Step 3: Deploy Frontend to Vercel

1.  Go to [Vercel.com](https://vercel.com/) and sign up.
2.  Click **Add New...** -> **Project**.
3.  Import your GitHub repository (`university-grade-portal`).
4.  **Framework Preset**: Select **Vite**.
5.  **Root Directory**: Click "Edit" and select `react-grade` folder.
6.  **Environment Variables**:
    *   `VITE_API_URL`: Paste your **Render Backend URL** (e.g., `https://university-backend.onrender.com/api`).
        *   *Note*: Ensure you include `/api` at the end if your logic expects it, or just the root if you prefer. Based on your code, use: `https://university-backend.onrender.com/api`.
7.  Click **Deploy**.
8.  Wait for deployment. Vercel will give you a domain (e.g., `https://university-grade-portal.vercel.app`).

---

## Step 4: Final Configuration

1.  **Update Backend CORS**:
    *   Go back to **Render Dashboard** -> Environment Variables.
    *   Set `FRONTEND_URL` to your new Vercel URL (e.g., `https://university-grade-portal.vercel.app`).
    *   This ensures only your frontend can access your backend (CORS protection).

2.  **Database Migration**:
    *   Your backend is configured to `sync()` (create tables) automatically on start.
    *   However, your *data* (students, users) will be empty.
    *   You may need to run your seeder scripts.
    *   **Option**: Connect to your cloud database from your local machine using a tool like **HeidiSQL** or **DBeaver** using the same credentials, and manually run your `INSERT` SQL scripts or import a dump.

## Troubleshooting

- **CORS Errors**: Check if `FRONTEND_URL` matches exactly (no trailing slash usually best).
- **Database Connection Error**: Ensure "SSL" is enabled if required by the provider (Aiven usually requires it). You might need to add `?ssl-mode=REQUIRED` to your connection string or configure Sequelize dialect options.
    *   *If you see "Protocol not supported"*, ensure you are using the correct port.
