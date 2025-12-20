# Campus Q&A Backend (Node/Express)

This backend implements the API expected by your frontend: spaces, posts, comments, profiles, notifications, tags, membership, and authentication.

## Quick Start

1. Create `.env` from the example:

```
copy .env.example .env
```

2. Install dependencies:

```
npm install
```

3. Run dev server:

```
npm run dev
```

Server listens on `http://localhost:4000/api` by default.

## Notes

- Data is stored in PostgreSQL via Prisma. Configure `DATABASE_URL` in `.env`.
- JWT auth with `Authorization: Bearer <token>`.
- Tags are extracted from post `content` using hashtags (e.g., `#math`).
- This is a starter backend; tighten security (hash passwords) for production.

## Key Endpoints

- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh-token`, `GET /api/auth/me`, `POST /api/auth/logout`
- Spaces: `GET /api/spaces`, `GET /api/spaces/:spaceId`, `POST /api/spaces/request`, `POST /api/spaces/:spaceId/join`, `POST /api/spaces/:spaceId/leave`
- Posts: `GET /api/posts` (supports `page`, `limit`, `sort`, `spaceSlug`, `tag`), `GET /api/posts/:postId`, `POST /api/posts`, `DELETE /api/posts/:postId`, `POST /api/posts/:postId/vote`, `POST /api/posts/:postId/save`, `POST /api/posts/:postId/unsave`
- Comments: `GET /api/posts/:postId/comments`, `POST /api/posts/:postId/comments`, `DELETE /api/posts/:postId/comments/:commentId`
- Profiles: `GET /api/profiles/:username`, `PUT /api/profiles/update`
- Notifications: `GET /api/notifications`, `POST /api/notifications/:notificationId/read`, `GET /api/notifications/unread-count`
- Tags: `GET /api/tags`
- Membership: `GET /api/users/me/spaces`

## Postgres Setup

1. Ensure PostgreSQL is running locally and create a database:

```
createdb quanda
```

2. Set `DATABASE_URL` in `.env` (example is provided):

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/quanda?schema=public
```

3. Install and generate Prisma client:

```
npm install
npm run prisma:generate
```

4. Apply migrations to create tables:

```
npm run prisma:migrate -- --name init
```

5. Start the dev server:

```
npm run dev
```
