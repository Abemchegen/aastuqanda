# AASTU Q&A

AASTU Q&A is a full-stack web app for an anonymous, campus-oriented Q&A/community feed.

- Frontend: Vite + React + TypeScript + shadcn-ui + Tailwind
- Backend: Node.js + Express + Prisma + PostgreSQL

## Features

- Auth with email verification
- Spaces (communities) with membership
- Posts with Markdown content (and images)
- Comments with replies
- Voting and saved posts
- Public profiles (read-only view)
- Notifications

## Repo structure

- `frontend/` — React client
- `backend/` — Express API server

## Local development

### Prerequisites

- Node.js 20+
- PostgreSQL

### Backend

```sh
cd backend
npm install

# create and fill backend/.env (DATABASE_URL, JWT secret, email, cloudinary, etc.)
# then:
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Backend runs on `http://localhost:4000/api` by default.

### Frontend

```sh
cd frontend
npm install

# set VITE_API_BASE if your backend is not localhost
npm run dev
```

Frontend runs on the Vite dev server (see console output).

## Configuration

Common environment variables:

Backend (`backend/.env`):

- `DATABASE_URL` (PostgreSQL connection string)
- `JWT_SECRET` (or equivalent, depending on your setup)
- Email/SMTP variables (for verification emails)
- Cloudinary variables (optional, for image uploads)

Frontend (`frontend/.env`):

- `VITE_API_BASE` (defaults to `http://localhost:4000/api`)

## Scripts

Backend:

- `npm run dev` — start API in watch mode
- `npm run start` — start API
- `npm run prisma:generate` — generate Prisma client
- `npm run prisma:deploy` — apply migrations in production

Frontend:

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run preview` — preview build

## Security notes

This repository is intended as a project starter. Before production use, review:

- password storage (hashing)
- rate limiting
- input validation
- secrets management

## License

MIT — see [LICENSE.md](LICENSE.md).
