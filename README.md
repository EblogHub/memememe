[README.md](https://github.com/user-attachments/files/32884504/README.md)
# Acada Cart

Acada Cart is a Nigerian student marketplace built with React, Tailwind CSS, Express, Prisma, and PostgreSQL. Campus access is determined by the authenticated student's stored university, not by a browser-selected filter.

## Local setup

1. Install dependencies with `npm.cmd install`.
2. Copy `.env.example` to `.env` and set a PostgreSQL `DATABASE_URL`, independent 32+ character `SESSION_SECRET` and `IDENTITY_HASH_SECRET`, `APP_ORIGIN`, and private S3-compatible storage credentials.
3. Create a private object bucket. Do not enable public access for student ID or product images.
4. Run `npm.cmd run db:generate`, `npm.cmd run db:migrate`, and `npm.cmd run db:seed`.
5. Start the React and API development servers with `npm.cmd run dev`.
6. Register an admin student account. Set `ADMIN_BOOTSTRAP_EMAIL` to that email in `.env`, then run `npm.cmd run admin:promote` once.

The Vite app is available at `http://127.0.0.1:5173`; Express listens at `http://127.0.0.1:3000`. Production serves the Vite build from Express. Set `APP_ORIGIN` to the exact HTTPS origin in production.

## Render deployment

`render.yaml` defines a Node web service and private managed Postgres database. To deploy, push this project to a GitHub repository, create a Render Blueprint from that repository, and enter the prompted private S3-compatible storage settings. Create the object bucket first, keep it private, and use a dedicated bucket access key. The Blueprint runs Prisma migrations before deployment and seeds universities after the first successful deploy.

The default Render plans can incur monthly charges. Review the Blueprint's service and database plans in Render before confirming resource creation. The app is not publicly deployed until the Blueprint is applied and health checks pass. Promote your initial admin from Render's one-off shell with `npm run admin:promote` after setting `ADMIN_BOOTSTRAP_EMAIL` to that account's registration email.

## Vercel deployment

Import the connected GitHub repository into Vercel. The root `server.js` exports the Express app for Vercel Functions, `vercel.json` provides SPA deep-link rewrites, and the Vercel build writes Vite assets to `public/` for CDN delivery. Vercel does not provide the app's PostgreSQL database or private image bucket automatically.

Configure these environment variables in the Vercel project before the first deployment:

- `DATABASE_URL`: a PostgreSQL connection string from a managed provider, using its serverless/pooler URL when required.
- `SESSION_SECRET` and `IDENTITY_HASH_SECRET`: separate random values of at least 32 characters.
- `S3_REGION`, `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY`: credentials for a private S3-compatible bucket.
- `ADMIN_BOOTSTRAP_EMAIL`: the email for the account that will be promoted to administrator.
- `APP_ORIGIN`: the production Vercel URL if the system deployment hostname is not detected.

After deployment, apply the Prisma migration and seed the university directory from a trusted deployment shell. Promote the initial admin account only after it has registered. Do not place database or storage credentials in this repository or in chat.

## Vercel deployment

`vercel.json` exports the Express app as Vercel's server entry, builds the Vite SPA into Vercel's static `public` directory, and rewrites application routes to the SPA entry. Import this Git repository into Vercel to receive a public `.vercel.app` URL.

Configure these project environment variables in Vercel before the first production build:

- `DATABASE_URL`: PostgreSQL connection string from a managed provider such as Neon or Render Postgres. Vercel needs this during build for Prisma Client generation and at runtime for API requests.
- `SESSION_SECRET` and `IDENTITY_HASH_SECRET`: independent random values, each at least 32 characters.
- `S3_REGION`, `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY`: credentials for a private S3-compatible bucket used for student IDs and product photos.
- `ADMIN_BOOTSTRAP_EMAIL`: email used by the admin promotion process.

Set `APP_ORIGIN` to the production deployment origin if automatic Vercel origin detection is not available. Apply the Prisma migration and seed the university directory after connecting the database. Do not enable public access on the object-storage bucket.

## Security model

- Sessions use random opaque tokens in HttpOnly, SameSite=Lax cookies; only HMAC-SHA256 token hashes are stored in Postgres. Production cookies require HTTPS.
- Registration requires terms acceptance, an E.164 phone, unique email and matric number, a valid university, and a 5 MB-or-smaller JPEG/PNG/WEBP student ID. The server checks file signatures and uploads the ID privately before atomically creating the student and session rows. Failed database transactions trigger best-effort object cleanup.
- New accounts are `PENDING` and `isVerified=false`. API route guards deny product reads and writes until an admin approves the account.
- Product queries always derive `targetUniversityId` from the signed-in profile. Product creation ignores client-supplied seller/university IDs, checks campus meetup locations, and requires 2–3 private images.
- Student ID photos are only signed for admins; product image URLs are short-lived and only issued for same-campus, verified users.
- Admin ban operations revoke sessions, delete the student's product rows and images, record an audit event, and add a keyed matric-number hash to a permanent blacklist.
- Rate limits, Helmet headers, same-origin checks on mutations, bounded request bodies/uploads, and generic server errors are enabled.

## API overview

- `GET /api/universities`
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`
- `GET /api/products`, `POST /api/products`, `GET /api/products/:id`, `PATCH /api/products/:id/status`
- `GET /api/admin/verifications`, `POST /api/admin/verifications/:userId`, `POST /api/admin/ban-user`

Product details include the required no-pay-before-meeting warning, daylight meetup guidance, and a WhatsApp deep link. Phone and matriculation numbers are not included in product-feed responses.

## Checks

- `npm.cmd test` runs utility tests.
- `npm.cmd run build` compiles the React frontend.
- `npm.cmd run db:generate` validates the Prisma schema and generates the client.

Before collecting real student records, publish a privacy notice and define ID-image retention, authorized reviewers, and deletion handling. Configure database backups, object-store lifecycle/backup policies, TLS, and operational monitoring before production launch.
