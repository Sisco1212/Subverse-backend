# Subverse Backend

Subverse Backend is the Express.js REST API for Subverse, a subscription-tracking application. It provides account authentication and user/subscription management, and schedules email reminders ahead of subscription renewals.

## Features

- Sign up and sign in with password hashing and JWT authentication.
- Create, view, update, cancel, and delete subscriptions, including upcoming-renewal queries.
- Schedule renewal reminder workflows through Upstash and send reminder emails with Nodemailer.
- MongoDB persistence with Mongoose.
- Request protection with Arcjet bot detection and rate limiting.

## Requirements

- Node.js (ES modules supported) and npm.
- A MongoDB connection string.
- Credentials for the external services you enable: Arcjet, Upstash QStash/Workflow, and SMTP email.

## Getting started

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/Sisco1212/Subverse-backend.git
   cd Subverse-backend
   npm install
   ```

2. Create `.env.development.local` in the project root. `config/env.js` loads this file when `NODE_ENV` is unset or set to `development`:

   ```dotenv
   NODE_ENV=development
   PORT=3000
   DB_URI=mongodb://127.0.0.1:27017/subverse
   JWT_SECRET=replace-with-a-long-random-secret
   JWT_EXPIRES_IN=7d
   ARCJET_KEY=your-arcjet-key
   ARCJET_ENV=development
   QSTASH_URL=your-upstash-qstash-url
   QSTASH_TOKEN=your-upstash-qstash-token
   SERVER_URL=http://localhost:3000
   EMAIL_PASSWORD=your-smtp-or-gmail-app-password
   FRONTEND_URL=http://localhost:3000
   ```

   Keep credentials private; do not commit environment files. `DB_URI`, `JWT_SECRET`, and the service credentials must be set for the corresponding features to work. `SERVER_URL` must be publicly reachable by Upstash when workflows are triggered. Email delivery uses the Gmail account configured in `config/nodemailer.js`; `EMAIL_PASSWORD` should be an app password, not your account password.

3. Start the configured development or production script:

   ```bash
   npm run dev
   # or
   npm start
   ```

   **Local server note:** the current `app.js` exports the Express application but does not call `app.listen()`. The package scripts invoke `node app.js` (or Nodemon), so they do not themselves open a local HTTP port. Run this app through a compatible host/adapter, or add a local listener before expecting the commands above to serve requests. The deployed service is listed at [subverse-backend.vercel.app](https://subverse-backend.vercel.app).

## API overview

The API is mounted at `/api/v1`:

| Area | Base path | Examples |
| --- | --- | --- |
| Authentication | `/auth` | `POST /sign-up`, `POST /sign-in` |
| Users | `/users` | `GET /`, `GET /:id`, `PATCH /:id`, `DELETE /:id` |
| Subscriptions | `/subscriptions` | `GET /`, `POST /`, `GET /renewals/upcoming`, `PATCH /:id`, `PATCH /:id/cancel`, `DELETE /:id` |
| Workflows | `/workflows` | `POST /subscription/reminder` |

For example, create an account with:

```bash
curl -X POST http://localhost:3000/api/v1/auth/sign-up \
  -H 'Content-Type: application/json' \
  -d '{"name":"Alex Example","email":"alex@example.com","password":"change-me"}'
```

Authentication endpoints return a token. Protected routes require authentication; see `middlewares/auth.middleware.js` for the expected authorization header. Subscription creation triggers a reminder workflow, so configure Upstash and email before relying on reminders. The root route (`/`) returns a simple API welcome message.

## Project layout

- `app.js` — Express app, middleware, and API route mounting.
- `routes/` and `controllers/` — API endpoints and request handlers.
- `models/` — Mongoose user and subscription models.
- `database/` — MongoDB connection.
- `config/` — environment, Arcjet, email, and Upstash configuration.
- `middlewares/` — authentication, request protection, and error handling.
- `utils/` — shared helpers, including reminder email delivery.

## Help and documentation

- Open a [GitHub issue](https://github.com/Sisco1212/Subverse-backend/issues) for bugs or feature requests.
- See the [deployed service](https://subverse-backend.vercel.app).
- Detailed API reference and a contribution guide are not currently included in this repository; use the route files as the source of truth for endpoint behavior.

## Contributing and maintenance

The repository is maintained by [@Sisco1212](https://github.com/Sisco1212). Contributions are welcome: open an issue to discuss a change, then submit a pull request with a focused description and verification steps. Run `npm run dev` or `npm start` as appropriate for your environment; note the local server limitation above. No test script is currently defined in `package.json`.

## License

No `LICENSE` file is currently present. Check with the maintainer before redistributing or reusing this project.
