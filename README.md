# The Expose Backend

Production-ready backend for The Expose corruption watchdog platform.

## Stack
- Hono.js + TypeScript (strict)
- MongoDB + Mongoose
- Redis + BullMQ
- Zod validation, SIWE admin auth, JWT

## Setup
1. Copy `.env.example` to `.env` and fill values.
2. Install dependencies: `npm install`
3. Run dev server: `npm run dev`
4. Start workers: `npm run worker`

## Scripts
- `npm run dev` - Local dev server (tsx watch)
- `npm run build` - TypeScript build
- `npm start` - Run production server
- `npm run worker` - Run BullMQ workers

## Core Endpoints
### Public
- `GET /health`
- `GET /ready`
- `GET /articles`
- `GET /articles/:slug`
- `POST /articles`
- `GET /comments/articles/:articleId`
- `POST /comments/articles/:articleId`
- `GET /persons`
- `GET /persons/:slug`
- `GET /cases/persons/:personId`
- `POST /cases`
- `GET /leaderboard`
- `GET /polls/current`
- `POST /polls/:pollId/votes`

### Admin
- `POST /admin/auth/siwe/nonce`
- `POST /admin/auth/siwe/verify`
- `GET /admin/articles?status=submitted`
- `POST /admin/articles/:articleId/review`
- `GET /admin/comments?status=pending`
- `POST /admin/comments/:commentId/review`
- `POST /admin/persons`
- `POST /admin/polls`
- `GET /admin/analytics/overview`

## Environment Variables
See `.env.example` for full list.

## Notes
- All public submissions require sources.
- SIWE verification issues a short-lived JWT for admin routes.
- Redis caching is enabled for popular read endpoints.

## Ops
- PM2 config: `ecosystem.config.js`
- Nginx example: `nginx.conf.example`
