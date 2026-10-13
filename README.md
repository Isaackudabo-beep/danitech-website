# Dani-Tech website

The original Dani-Tech public website remains static HTML, CSS, and JavaScript. Vercel Functions under `api/` provide the Neon-backed contact inbox, admin APIs, and public published-content reads. The admin dashboard is served on the same domain at `/admin`.

## Local development

1. Create an ignored `.env.local` from `.env.example` and set `DATABASE_URL` privately. Never commit this file or share its contents.
2. The existing six application tables are defined in `database/schema.sql` and are already applied to the current Neon branch. For admin auth, review and manually run only `database/admin-auth-migration.sql`; it adds `admin_users`, `admin_sessions`, `admin_login_limits`, and `admin_sessions_expiry_idx`. It does not alter or delete existing records.
3. On the fresh content tables only, optionally run `database/seed-content.sql` to copy the existing public projects, leadership profiles, testimonials, and partners into the managed tables. It seeds each table only when that table is empty; review it before execution.
4. Run `npm install`, `npm test`, and `npm run dev` from this directory. `npm run dev` uses Vercel's local runtime for static routes and Functions.
5. Create the first admin locally in an interactive terminal with `npm run admin:create`. The script reads `DATABASE_URL` only from the ignored `.env.local` (it deliberately ignores inherited process environment values), displays only the Neon hostname/database name, and requires exact typed confirmation after you compare it with the intended branch in Neon. It prompts for the password without echo, refuses a second initial account, and serializes creation with a PostgreSQL advisory transaction lock. No public signup/setup endpoint exists.

## Vercel configuration and deployment

The repository root is the website root. In the Vercel project, select the `Other` framework preset, use the repository root as Root Directory, and leave custom Build Command and Output Directory overrides unset. The `api/` directory contains only the six intended Vercel Function entry points. Shared server modules live in `lib/server/` (outside `api/`) so they are bundled as imports, not exposed as extra function routes. `vercel.json` only rewrites exact `/admin` and `/admin/` paths to the same-domain static dashboard; it does not match `/api/*`.

Configure `DATABASE_URL` and `ADMIN_LOGIN_SALT` in Vercel's server-side environment settings for Production and any Preview environments, then deploy the intended Git commit. `ADMIN_LOGIN_SALT` must be 64 hexadecimal characters (32 random bytes); generate it privately and paste it directly into Vercel settings, never into chat or source files. In production, admin login fails closed if this salt is missing or malformed. Verify `GET /api/contact` returns 405 (the endpoint only accepts POST) rather than 404, and verify `/admin` loads before sending a test contact submission. If the API is still 404, inspect the active deployment's build logs and Vercel project root/output settings; no repository config can override a different deployment or custom output directory safely.

## Security

- Admin sessions use random opaque session cookies, stored as hashes in Neon, with HttpOnly, SameSite=Strict, Secure-on-HTTPS flags, expiry, and CSRF verification for writes.
- Passwords are stored as Node scrypt hashes. Login attempts are rate-limited in the database.
- Use `npm run admin:create` from a trusted local machine after applying `database/admin-auth-migration.sql`. Keep the connection URL in `.env.local`; never put it in frontend JavaScript or Vercel build output.
- Contact messages are only returned by authenticated admin APIs. Public APIs only return published content fields.
- The contact form reports clearly when its backend is unavailable and does not redirect to email as if a message had been saved.

## Data notes

The current contact table has `service`, not a `subject` column; the inbox presents the service as the inquiry subject. Its status values are `new`, `read`, and `archived` (`new` is unread). Existing project/team/testimonial/partner field names and types are defined in `database/schema.sql` and enforced by the API.

- Admin bootstrap displays the selected Neon hostname and database name, but never the full connection string. Compare it with the intended Neon branch before entering the exact confirmation text. The bootstrap refuses non-Neon hosts and does not use inherited `DATABASE_URL` values.
