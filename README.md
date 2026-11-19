# Heng Ratanak — 3D Studio & Portfolio CMS

An interactive 3D studio portfolio with a full-stack CMS admin dashboard. Visitors can explore an isometric Three.js 3D room with clickable wall frames, view projects and videos, and send contact inquiries. The project owner has a password-protected dashboard to manage all profile details, media uploads, projects, and site settings.

**Built with:** Next.js 16 (App Router) · React 19 · Three.js · PostgreSQL (Drizzle ORM) · Redis · Cloudflare R2

---

## Quick Start Guide

Follow these steps to set up and run the project locally.

### Prerequisites

Make sure you have:
- **Node.js 20+** installed (`node -v`)
- Either **Docker Desktop** (for running PostgreSQL & Redis locally) OR cloud database accounts (such as [Neon](https://neon.tech) for PostgreSQL and [Upstash](https://upstash.com) / [Redis Cloud](https://redis.io) for Redis).
- A **Cloudflare R2** bucket for media uploads (images, videos, PDF CV).

---

### Step 1: Install Dependencies

```bash
npm install
```

---

### Step 2: Configure Environment Variables

Create your local `.env.local` file by copying the template:

```bash
cp .env.example .env.local
```

Open `.env.local` and configure your credentials:

```env
# 1. Database (PostgreSQL)
# Local Docker: postgresql://postgres:postgres@localhost:5432/ratanak_studio
# Cloud (Neon): postgresql://<user>:<password>@<host>/<db>?sslmode=verify-full
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ratanak_studio"

# 2. Redis Cache & Rate Limiting
# Must start with redis:// or rediss:// (Do NOT include 'redis-cli -u')
# Local Docker: redis://localhost:6379
# Cloud (Upstash / Redis Cloud): redis://default:<password>@<host>:<port>
REDIS_URL="redis://localhost:6379"

# 3. Cloudflare R2 Storage (S3-compatible)
R2_ACCOUNT_ID="your_cloudflare_account_id"
R2_ACCESS_KEY_ID="your_r2_access_key_id"
R2_SECRET_ACCESS_KEY="your_r2_secret_key"
R2_BUCKET_NAME="your_bucket_name"
# Public URL for your bucket (custom domain or r2.dev URL, no trailing slash)
R2_PUBLIC_URL="https://media.yourdomain.com"

# 4. Initial Admin Credentials (used once by npm run db:seed)
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="YourStrongPassword123!"
ADMIN_NAME="Your Name"

# 5. Application Origin
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> **Important notes:**
> - Never commit `.env` or `.env.local` to git.
> - For `REDIS_URL`, only provide the connection URL string (`redis://...` or `rediss://...`). Do not paste the CLI command prefix `redis-cli -u`.

---

### Step 3: Start Database & Redis

#### Option A: Using Docker (Local)
If you have Docker Desktop installed, run:
```bash
docker compose up -d
```
This spins up PostgreSQL on port `5432` and Redis on port `6379`.

#### Option B: Using Hosted / Cloud Services
If using Neon (PostgreSQL) and Upstash / Redis Cloud, simply ensure your `DATABASE_URL` and `REDIS_URL` in `.env.local` point to those instances. No Docker required.

---

### Step 4: Apply Database Schema & Seed Data

1. Run migrations to create all database tables:
   ```bash
   npm run db:migrate
   ```
   *(Alternatively, you can generate fresh migrations with `npm run db:generate` or push with `npm run db:push`)*

2. Seed default portfolio records and the initial admin account:
   ```bash
   npm run db:seed
   ```
   *The seed is idempotent: it only inserts default data into empty tables and will never overwrite an existing admin password.*

---

### Step 5: Configure Cloudflare R2 CORS

In the **Cloudflare Dashboard → R2 → Your Bucket → Settings → CORS Policy**, add this configuration to allow direct browser uploads and 3D texture loading:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Content-Length", "Range"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Range", "Accept-Ranges"],
    "MaxAgeSeconds": 3600
  }
]
```

---

### Step 6: Start the Development Server

```bash
npm run dev
```

Open your browser to:
- **Public 3D Studio & Portfolio:** `http://localhost:3000`
- **Admin Sign In:** `http://localhost:3000/login`
- **Admin Dashboard:** `http://localhost:3000/dashboard`

Log in using the `ADMIN_EMAIL` and `ADMIN_PASSWORD` you defined in your environment variables.

---

## Using the dashboard

| Section | What you can do |
| :--- | :--- |
| **Profile & CV** | Edit name, bio, contact links; upload portrait photo and CV PDF; show/hide the *Technical* projects tab. |
| **3D Studio Frames** | Upload images for the 6 wall frames — 3 vertical **9:16** (left wall) and 3 horizontal **16:9** (back wall). Images are center-cropped to fit. |
| **Projects** | Add/edit Poster, Video, and Technical projects. Videos can be an uploaded file (streamed from R2) or a YouTube/Vimeo embed URL. |
| **Skills / Experience / Education** | Add, edit, reorder, delete. |
| **Inquiries** | Read contact-form messages from visitors. |
| **R2 Media** | Browse, preview, and delete everything stored in R2. |
| **Security & Redis** | Change email/password, sign out other devices, clear the cache. |

Changes appear on the public site right after saving.

**Upload limits:** images 15 MB (JPG, PNG, WebP, AVIF) · videos 250 MB (MP4, WebM, MOV) · CV 15 MB (PDF).

---

## Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Run the production build |
| `npm run lint` | Check code with ESLint |
| `npm run test` | Run unit tests (Vitest) |
| `npm run db:push` | Sync the database schema |
| `npm run db:seed` | Create admin account + default content |
| `npm run db:generate` | Generate SQL migration files |
| `npm run db:migrate` | Apply SQL migration files |
| `npm run db:studio` | Open a visual database browser |

---

## Troubleshooting

| Problem | Fix |
| :--- | :--- |
| `DATABASE_URL environment variable is not set` | You haven't created `.env.local` or `.env`, or the variable is empty. |
| `relation "admin_users" does not exist` | Database tables haven't been created yet. Run `npm run db:migrate` before `npm run db:seed`. |
| `Invalid URL` or Redis connection error | Check your `REDIS_URL`. It must begin directly with `redis://` or `rediss://`. Remove any CLI wrapper like `redis-cli -u`. |
| `Interactive prompts require a TTY terminal` | Run `npm run db:migrate` instead of `db:push` in non-interactive terminals. |
| `ECONNREFUSED 127.0.0.1:5432` or `:6379` | PostgreSQL or Redis isn't running. Run `docker compose up -d` or check your hosted connection strings. |
| Can't sign in | Make sure you ran `npm run db:seed`. If you changed `ADMIN_PASSWORD` *after* seeding, the original password still applies — the seed never overwrites an existing admin. |
| Upload fails with a CORS / network error | Add the CORS policy from step 5 and verify your `R2_*` credentials. |
| Video won't play | Confirm the file exists in **R2 Media**. The player automatically retries through the built-in streaming endpoint if the direct R2 URL fails. |
| Content not updating | Use **Dashboard → Security & Redis → Purge Cache Now**. |

---

## Project structure

```
app/              Pages and API routes (Next.js App Router)
  dashboard/      Admin dashboard pages + server actions
  api/            Auth, contact form, media upload, video streaming
components/
  studio/         Three.js 3D room
  portfolio/      Public portfolio sections
  dashboard/      Admin UI
  media/          Video streaming player
db/               Database schema (Drizzle) and seed script
lib/              Auth, Redis cache, R2 storage, rate limiting
data/portfolio.ts Default content used by the seed script
proxy.ts          Redirects signed-out visitors away from /dashboard
```
