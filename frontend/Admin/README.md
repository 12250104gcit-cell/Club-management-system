# GCIT Clubs – Club Management System (Front-end)

Mobile-first front-end prototype built from the Figma frames. Plain HTML, CSS and JavaScript — no build step, no dependencies.

## Run it
Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

Demo login: any valid email + any password (or "Sign in with Google").

## Screens (all from the Figma file)
| Area | Screens |
|------|---------|
| Auth | Login |
| Home | Admin dashboard (stats + recent clubs) |
| Clubs | All clubs (search), club details, create, edit, delete confirmation |
| Coordinators | Accounts list (search), create, details, edit, delete confirmation |
| Profile | Profile & settings, edit profile (photo upload), change password |

## Structure
```
index.html
assets/logo.svg
css/styles.css        design tokens (orange #f57c20, green #25b04f) + all styles
js/icons.js           inline SVG icons
js/data.js            Store: sample data + localStorage persistence (swap for API calls)
js/components.js      shared UI helpers: forms, validation, modal, toast
js/views.js           one function per screen
js/app.js             hash router, auth guard, app shell (top bar + bottom nav)
```

## Connecting a back-end
All data access goes through the `Store` object in `js/data.js`. Replace its methods with `fetch()` calls to your API (and make the views `await` them). Passwords are never stored by the prototype.

## Notes
- Data is saved in the browser's localStorage; use **Profile → Reset demo data** to restore samples.
- The logo in `assets/logo.svg` is a placeholder recreation; replace it with your exported Figma logo.
