# Subverse Backend

Subverse Backend is a JavaScript/Express API for managing user accounts and recurring subscriptions. It stores subscription details in MongoDB and uses Upstash Workflow with email reminders to notify users ahead of renewal dates.

> **Runtime note:** `app.js` configures and exports the Express application, but it does not call `app.listen()` or create an HTTP server. The repository's `start` and `dev` scripts execute `app.js` directly, so they do not, by themselves, expose an HTTP listener. Use a deployment/runtime wrapper that mounts the exported app, or add a server entry point before expecting the API to be reachable locally.

## Features

- User registration and sign-in using password hashes and JWTs.
- Authenticated user profile lookup, name updates, and account deletion.
- Create, inspect, update, cancel, delete, and list subscriptions.
- Track subscription price, currency, billing frequency, category, payment method, status, start date, and renewal date.
- List upcoming renewals for the authenticated account.
- Schedule renewal reminder workflows through Upstash Workflow and send reminder emails at 7, 5, 2, and 1 day before renewal.
- Apply Arcjet Shield, bot detection, and IP-based token-bucket rate limiting to incoming requests.
- Configure cross-origin requests for a frontend origin, with credentials enabled.

## Technology stack

| Area | Technologies |
| --- | --- |
| Language and runtime | JavaScript (ES modules), Node.js |
| HTTP API | Express 4, `cors`, `cookie-parser` |
| Database / ODM | MongoDB, Mongoose |
| Authentication | JSON Web Tokens (`jsonwebtoken`), `bcryptjs` |
| Abuse protection | Arcjet Node SDK |
| Scheduled workflows | Upstash Workflow |
| Email | Nodemailer with Gmail transport |
| Date handling | Day.js |
| Development tooling | Nodemon, ESLint |

There is no frontend application in this repository. No test script or test suite is defined in `package.json`.

## Architecture

`app.js` creates the Express application, configures JSON and URL-encoded request parsing, cookie parsing, CORS, Arcjet protection, and database connection middleware. It mounts route modules under `/api/v1` and ends with centralized error handling. Route handlers delegate application logic to controllers, which use Mongoose models for persistence.

When a subscription is created, the subscription controller stores it and triggers an Upstash Workflow callback at the configured server URL. The workflow loads the subscription and its user, waits until the configured reminder dates, and sends email using Nodemailer and the templates in `utils/email-template.js`. Updating a subscription's start date or frequency reschedules its workflow; cancelling or deleting it cancels the existing workflow.

## Project structure

```text
.
├── app.js                         Express app setup and route mounting
├── config/
│   ├── arcjet.js                  Arcjet security rules
│   ├── env.js                     Environment-file loading and exports
│   ├── nodemailer.js              Gmail SMTP transport
│   └── upstash.js                 Upstash Workflow client
├── controllers/
│   ├── auth.controller.js         Registration and sign-in
│   ├── subscription.controller.js Subscription CRUD and workflow scheduling
│   ├── user.controller.js         User operations
│   └── workflow.controller.js     Reminder workflow callback
├── database/
│   └── mongodb.js                 Mongoose connection
├── middlewares/
│   ├── arcject.middleware.js     Arcjet request protection
│   ├── auth.middleware.js        Bearer-token verification
│   └── error.middleware.js       API error responses
├── models/
│   ├── subscription.model.js     Subscription schema and status/date logic
│   └── user.model.js             User schema
├── routes/                       Express route declarations
├── utils/
│   ├── email-template.js         Reminder message templates
│   └── send-email.js             Reminder email delivery
├── package.json                  Dependencies and npm scripts
└── eslint.config.js              ESLint configuration
```

## Requirements and setup

Install a Node.js release compatible with the dependencies in `package-lock.json`, npm, and access to MongoDB. Configure external Arcjet, Upstash Workflow, and Gmail SMTP credentials for the functionality that uses those services.

1. Clone the repository and enter its directory:

   ```bash
   git clone https://github.com/Sisco1212/Subverse-backend.git
   cd Subverse-backend
   ```

2. Install the locked dependencies:

   ```bash
   npm ci
   ```

3. Create `.env.development.local` in the repository root and populate the variables described below. `config/env.js` loads `.env.<NODE_ENV>.local`, defaulting to `.env.development.local` when `NODE_ENV` is not set. A generic `.env` file is not loaded by this configuration.

4. The scripts declared by the project are:

   ```bash
   npm run dev
   npm start
   ```

   `npm run dev` invokes `nodemon app.js`; `npm start` invokes `node app.js`. As noted above, `app.js` only exports the Express app and does not listen on a port. These commands do not make the API available over HTTP without a runtime wrapper or a server entry point. No local server wrapper, Docker configuration, or deployment manifest is included in the repository.

## Environment variables

All variables are read from `process.env` after loading `.env.<NODE_ENV>.local`. Do not commit environment files or put real credentials in documentation.

| Variable | Purpose | Notes |
| --- | --- | --- |
| `DB_URI` | MongoDB connection string | Required to connect; the database module throws if it is missing. |
| `JWT_SECRET` | Signs and verifies access tokens | Required for sign-up, sign-in, and protected routes. Keep private. |
| `JWT_EXPIRES_IN` | JWT expiration setting passed to `jsonwebtoken` | Set to a value accepted by `jsonwebtoken` (for example, a duration string). |
| `ARCJET_KEY` | Arcjet project key | Used by the global Arcjet middleware. |
| `QSTASH_URL` | Upstash Workflow/QStash endpoint | Used to initialize the workflow client. |
| `QSTASH_TOKEN` | Upstash Workflow/QStash token | Used to initialize the workflow client; keep private. |
| `SERVER_URL` | Public base URL of this API | Used to construct the Upstash workflow callback URL. |
| `EMAIL_PASSWORD` | Gmail SMTP credential for the configured mail account | Used by Nodemailer; keep private. |
| `FRONTEND_URL` | Allowed CORS origin | Optional; defaults to `http://localhost:3000`. |
| `NODE_ENV` | Selects the environment-file name and is logged on DB connection | Defaults to `development` when not set before environment loading. |
| `PORT` | Exported by the environment module | No listener in this repository currently consumes it. |
| `ARCJET_ENV` | Exported by the environment module | Not referenced by the current Arcjet configuration. |

Arcjet protection is configured in `LIVE` mode, and the middleware requires an Arcjet decision for requests. The configured Arcjet key should therefore be available for API requests.

## API

The API is mounted at `/api/v1`. Except for the endpoints specifically marked otherwise, protected routes require:

```http
Authorization: Bearer <JWT>
```

The token is returned in the JSON response from sign-up and sign-in. Authentication reads the bearer token from the `Authorization` header; it does not authenticate from a cookie.

| Method | Path | Authentication | Purpose |
| --- | --- | --- | --- |
| `GET` | `/` | No | Returns a plain-text welcome message. |
| `POST` | `/api/v1/auth/sign-up` | No | Create an account with `name`, `email`, and `password`; returns a token and user data. |
| `POST` | `/api/v1/auth/sign-in` | No | Authenticate with `email` and `password`; returns a token and user data. |
| `GET` | `/api/v1/users` | No | Return the user list. |
| `GET` | `/api/v1/users/:id` | Yes | Get a user by ID. |
| `PATCH` | `/api/v1/users/:id` | Yes | Update the account name. |
| `DELETE` | `/api/v1/users/:id` | Yes | Delete the account and its subscriptions. |
| `GET` | `/api/v1/subscriptions` | No | Return the subscription list. |
| `GET` | `/api/v1/subscriptions/:id` | Yes | Get a subscription owned by the authenticated user. |
| `POST` | `/api/v1/subscriptions` | Yes | Create a subscription for the authenticated user and schedule its reminder workflow. |
| `PATCH` | `/api/v1/subscriptions/:id` | Yes | Update allowed subscription fields; date/frequency changes reschedule reminders. |
| `DELETE` | `/api/v1/subscriptions/:id` | Yes | Delete an owned subscription and cancel its workflow. |
| `GET` | `/api/v1/subscriptions/user/:id` | Yes | List subscriptions for the authenticated user's own ID. |
| `PATCH` | `/api/v1/subscriptions/:id/cancel` | Yes | Mark an owned subscription cancelled and cancel its workflow. |
| `GET` | `/api/v1/subscriptions/renewals/upcoming` | Yes | List the authenticated user's active subscriptions with renewal dates from now onward, sorted by date. |
| `POST` | `/api/v1/workflows/subscription/reminder` | Workflow callback | Handle the Upstash reminder workflow payload containing `subscriptionId`. |

The unauthenticated user and subscription list endpoints are exposed as implemented; do not assume they are restricted to the current account. The workflow callback is mounted without the JWT authorization middleware and is intended for Upstash Workflow delivery.

### Subscription fields

The Mongoose subscription schema defines `name`, `price`, `currency`, `frequency`, `category`, `paymentMethod`, `status`, `startDate`, `renewalDate`, `workflowRunId`, and a required `user` reference. Supported currencies are `USD`, `NGN`, `EUR`, and `GBP`; frequencies are `daily`, `weekly`, `monthly`, and `yearly`; categories are `Sports`, `News`, `Entertainment`, `Lifestyle`, `Technology`, `Finance`, `Politics`, and `Other`; statuses are `active`, `cancelled`, and `expired`. Timestamps are enabled. See `models/subscription.model.js` for required fields and validation behavior.

Most controller responses use JSON with a `success` field and either `data`, a `message`, or an error. The root endpoint instead returns plain text. Error middleware maps Mongoose validation errors and duplicate-key errors to `400`, invalid ObjectIds to `404`, and otherwise defaults to `500`.

## Authentication and security

- Passwords are hashed with `bcryptjs` using a generated salt before storage; sign-in compares the supplied password against the stored hash.
- JWTs include the user ID and are signed with `JWT_SECRET`, with expiration configured by `JWT_EXPIRES_IN`.
- Protected routes verify the bearer token, reload the user from MongoDB, and check ownership for account and subscription operations.
- Arcjet applies Shield, bot detection, and a token bucket with capacity 10 and a refill rate of 5 tokens per 10-second interval. The middleware returns `429` for rate limits and `403` for bot/access denials.
- CORS allows `FRONTEND_URL` (or `http://localhost:3000` by default) and enables credentials.

For production, keep secrets out of source control and configure a strong JWT secret and the external services' production credentials. Review the unauthenticated list endpoints and user serialization behavior before exposing sensitive data: the current implementation's `GET /api/v1/users` returns model documents, and sign-up/sign-in include the user model in their responses. No claim is made here that those response paths remove password hashes.

## Database model

MongoDB is accessed through Mongoose. There are two models:

- **User** — name, unique lowercase email, password hash, and Mongoose timestamps.
- **Subscription** — subscription and renewal metadata, timestamps, and a required `user` ObjectId reference to `User`. The `user` field is indexed.

A user's subscriptions are found by querying `Subscription.user`; deleting a user also deletes that user's subscriptions. The subscription model derives a renewal date from the start date and frequency when no renewal date is supplied (using fixed day counts of 1, 7, 30, and 365), and sets status to active or expired on save unless it is cancelled.

## Deployment

The repository metadata lists `https://subverse-backend.vercel.app` as the project homepage. The checked-in code does not include deployment configuration, a Vercel adapter, or an HTTP server entry point; the homepage alone does not establish the deployment procedure. A deployment must provide a runtime that serves the exported Express app and must configure the environment variables and public `SERVER_URL` required for callbacks. The callback URL used by Upstash is `${SERVER_URL}/api/v1/workflows/subscription/reminder`.

## Screenshots

<img width="1312" height="592" alt="subverse" src="https://github.com/user-attachments/assets/89182063-0309-46cb-9c8d-ed52fc4089f0" />
<img width="1311" height="604" alt="signup" src="https://github.com/user-attachments/assets/317fe4dd-7adc-4d5d-a471-b8ffd44bf5c6" />
<img width="1304" height="602" alt="signin" src="https://github.com/user-attachments/assets/aafb3228-8cd5-4e01-be30-4a958015c9de" />
<img width="1360" height="597" alt="subscriptions" src="https://github.com/user-attachments/assets/6e84784a-9d54-4a3a-a8bd-276212e9c3e6" />



## Possible future improvements

These are suggestions, not currently implemented features:

- Add a dedicated HTTP server entry point that listens on `PORT`, along with a documented local/deployment runtime.
- Protect or remove collection-wide user and subscription listing endpoints, and consistently exclude password hashes from all user responses.
- Add automated tests and API request/response examples.
- Add validation for incoming request payloads and document an OpenAPI specification.

## Repository

Maintainer/owner information available from GitHub: [Sisco1212](https://github.com/Sisco1212).
