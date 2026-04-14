<<<<<<< HEAD
# Smart Campus Operations Hub

Production-style monorepo for **IT3030 (PAF)** covering facilities catalogue, booking workflow with conflict prevention, maintenance/incident ticketing (attachments + comments + technician updates), and in-app notifications. Backend is **Spring Boot 4** with **JWT + role-based access**; frontend is **React (CRA)**.

## Features

- **Module A — Catalogue:** CRUD for admins; search/filter for authenticated users; `ACTIVE` / `OUT_OF_SERVICE`.
- **Module B — Bookings:** `PENDING → APPROVED | REJECTED`, `APPROVED → CANCELLED`; overlap prevention for `PENDING` + `APPROVED`; admin reason on rejection; notifications.
- **Module C — Tickets:** workflow `OPEN → IN_PROGRESS → RESOLVED → CLOSED` plus admin `REJECTED`; up to **3** image attachments (JPEG/PNG/WEBP); assign technician; comments with edit/delete ownership rules.
- **Module D — Notifications:** persisted feed + unread count; triggers on booking decisions, ticket status changes, and new comments.

## Tech stack

- **API:** Java 17, Spring Boot 4, Spring Security (JWT), JPA/Hibernate, MySQL (dev), H2 (tests).
- **UI:** React 19, React Router 6, Axios.
- **CI:** GitHub Actions (`.github/workflows/ci.yml`).

## Quick start

### 1) Database (MySQL)

Either use your existing local MySQL or Docker:

```bash
docker compose up -d mysql
```

Default API datasource (see `backend/src/main/resources/application.properties`):

- URL: `jdbc:mysql://localhost:3306/campus_hub?createDatabaseIfNotExist=true...`
- User: `root`
- Password: `2026`

Override with env vars: `DATABASE_URL`, `DATABASE_USER`, `DATABASE_PASSWORD`.

### 2) Backend

```bash
cd backend
./mvnw spring-boot:run
```

### Self-service registration roles

Public registration accepts `accountType`:

- `USER` (default): normal campus user.
- `TECHNICIAN`: grants `USER` + `TECHNICIAN` (intended for lab/helpdesk staff demos).

`ADMIN` cannot be created via `/api/v1/auth/register` (blocked server-side).

On first successful startup (non-test profile), demo users and sample resources are seeded:

| Email             | Password      | Roles              |
|------------------|---------------|--------------------|
| admin@campus.edu | `ChangeMe123!` | ADMIN, USER        |
| tech@campus.edu  | `ChangeMe123!` | TECHNICIAN, USER   |
| user@campus.edu  | `ChangeMe123!` | USER               |

### 3) Frontend

```bash
cd frontend
npm install
npm start
```

`frontend/.env.development` points the UI at `http://localhost:8080/api/v1`.

## API surface (summary)

Base path: `/api/v1`

- `POST /auth/register`, `POST /auth/login`
- `GET|POST|PUT|DELETE /resources` (write requires `ADMIN`)
- `POST /bookings`, `GET /bookings/me`, `GET /bookings` (admin), `PATCH /bookings/{id}/approve|reject|cancel`
- `POST /tickets`, `GET /tickets?scope=mine|assigned|all`, `GET /tickets/{id}`, `PATCH /tickets/{id}/assign|status|reject`, attachments + comments routes
- `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/{id}/read`, `POST /notifications/read-all`

## Testing

```bash
cd backend && ./mvnw test
cd frontend && npm test -- --watchAll=false
```

## Security notes for production

- Set a strong `CAMPUS_HUB_JWT_SECRET` env var (long random string).
- Serve the API over HTTPS and tighten CORS origins in `SecurityConfig`.
- Back up and scan uploaded files according to your institution policy.

## Assignment artefacts

Use this repo for: architecture diagrams (match packages under `com.campus.hub`), Postman/Newman collections against the endpoints above, and GitHub Actions logs as CI evidence.
=======
# PAF
>>>>>>> 4b19d7d94ac8feb58ac30542248fa977ae83c8a4
