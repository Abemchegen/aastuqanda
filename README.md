# AASTU Q&A

AASTU Q&A is a full-stack, anonymous, campus-oriented Q&A/community feed for spaces, posts, and discussions.

**Tech stack**: Vite + React + TypeScript + shadcn-ui + Tailwind (frontend) / Node.js + Express + Prisma + PostgreSQL (backend).

## Features

- Email-based auth with verification
- Spaces (communities) with membership
- Posts with Markdown + images
- Comments with replies
- Voting and saved posts
- Public profiles (read-only view)
- Notifications

## Repository layout

- `frontend/` — Vite/React client
- `backend/` — Express/Prisma API server

## Prerequisites

- Node.js 20+
- PostgreSQL 13+ running locally or reachable via `DATABASE_URL`

## Quick start (local)

```sh
# Backend
cd backend
npm install
cp .env.example .env   # or create backend/.env manually
npm run prisma:generate
npm run prisma:migrate  # applies migrations
npm run dev             # starts API at http://localhost:4000/api

# Frontend (new terminal)
cd ../frontend
npm install
echo VITE_API_BASE=http://localhost:4000/api > .env  # optional if not default
npm run dev             # starts Vite dev server (see console for URL)
```

## Environment variables

Backend (`backend/.env`):

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aastu_qanda?schema=public
JWT_SECRET=change-me

# Email (for verification)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_user
SMTP_PASS=your_pass

# Cloudinary (optional for images)
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
CLOUDINARY_UPLOAD_FOLDER=campusloop
```

Frontend (`frontend/.env`):

```env
VITE_API_BASE=http://localhost:4000/api
```

## Database and Prisma

- Generate client: `npm run prisma:generate` (in backend)
- Apply migrations locally: `npm run prisma:migrate`
- Deploy migrations in prod: `npm run prisma:deploy`

## Scripts reference

Backend:
- `npm run dev` — start API with reload
- `npm run start` — start API
- `npm run prisma:generate` — generate Prisma client
- `npm run prisma:migrate` — run local migrations
- `npm run prisma:deploy` — apply migrations in production

Frontend:
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run preview` — serve built assets locally

## Security and production checklist

- Use strong `JWT_SECRET` and rotate if compromised
- Ensure password hashing and rate limiting are enabled
- Validate and sanitize inputs server-side
- Store secrets securely (env vars, not in VCS)
- Configure CORS, HTTPS, and logging for production

## Contributing and community

- Contribution guidelines: see [CONTRIBUTING.md](CONTRIBUTING.md)
- Behavior expectations: see [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- License: [LICENSE.md](LICENSE.md) (MIT)

## Roadmap (short-term)

- Add project logo/branding across frontend
- Publish “good first issues” and contribution walkthrough
- Improve docs with screenshots and API examples
- Harden security (rate limiting, stricter validation)
