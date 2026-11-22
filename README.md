# Club-management-system
an agile project with a group of six members where we are trying to handle the problem of club management.

## Local setup

1. Copy `.env.example` to `.env` and set the PostgreSQL and JWT values.
2. Create the `club_management` database.
3. Run `migrations/001_create_users.sql` against that database.
4. Start the API:
   ```powershell
   go run .
   ```
5. Start the frontend in another terminal:
   ```powershell
   cd student-app
   npm run dev
   ```

The frontend is available through the Vite development URL and proxies `/api` requests to `http://localhost:8080`.
