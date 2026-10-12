# Dani-Tech website

Existing static Dani-Tech website with incremental Vercel Functions and Neon support. The public pages remain plain HTML, CSS, and JavaScript.

## Local development

1. Copy `.env.example` to `.env.local` and set the Neon connection value locally. Never commit `.env.local` or paste credentials into chat.
2. Apply [`database/schema.sql`](database/schema.sql) to a development Neon branch using the Neon SQL Editor.
3. Run `npm install`, then `npm run dev` to use Vercel's local runtime for both the existing site and `/api` functions.
4. Run `npm test` for the local API helper tests.

## Deployment

Vercel detects the `api/` functions and serves the existing website as static files. Configure `DATABASE_URL` (or `POSTGRES_URL`) in Vercel's Project Settings for the intended environments, then redeploy. The contact API requires the schema migration before it can store submissions.

The admin API and dashboard are not enabled yet; authentication and authorization must be configured before any private records can be exposed.
