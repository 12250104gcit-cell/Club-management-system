# GCIT Club Management System — Sprint 1

## Run locally

1. Install PostgreSQL and Go, create the `club_management` database, copy `.env.example` to `.env`, then set the database credentials, a random `JWT_SECRET` with at least 32 characters, and a development `SEED_PASSWORD` with at least 8 characters.
2. Seed the admin, clubs, coordinators, students, and one approved student membership:

   ```powershell
   go run ./cmd/seed
   ```

3. Start the API in one terminal:

   ```powershell
   go run .
   ```

4. Start each client in its own terminal:

   ```powershell
   cd frontend/Student/student-app
   npm install
   npm run dev -- --host 127.0.0.1 --port 5173
   ```

   ```powershell
   cd "frontend/Club Coordinator/coordinatorFrontend"
   npm install
   npm run dev -- --host 127.0.0.1 --port 5174
   ```

   ```powershell
   cd frontend/Admin
   node ../Student/student-app/node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5175
   ```

   Set `CORS_ORIGINS` to the exact browser origins if you use different addresses or ports.

## Development accounts

`go run ./cmd/seed` creates these accounts. The password for each is the value of `SEED_PASSWORD` in `.env`.

| Role | Email |
| --- | --- |
| Admin | `admin@gcit.bt` |
| Coordinator | `karma.coordinator@gcit.bt` |
| Coordinator | `tashi.coordinator@gcit.bt` |
| Coordinator | `sonam.coordinator@gcit.bt` |
| Student | `pema.student@gcit.bt` |
| Student | `tshering.student@gcit.bt` |
| Student | `kinzang.student@gcit.bt` |

Student/coordinator account passwords use bcrypt hashes. The API uses bearer JWTs. Clubs and membership tables are initialized when the API starts; the student active-request constraint is a PostgreSQL partial unique index.

## Shared sign-in

Open `http://localhost:5173/login` (or the matching `127.0.0.1` address). This is the shared login and student signup page. After authentication, the account's server-side role sends the user to the matching dashboard on ports 5173, 5174, or 5175. Use the same hostname for all three portals so the HttpOnly session cookie is shared between their ports.
