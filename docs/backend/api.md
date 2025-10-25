# Backend API Reference

The Express server in `backend/server.js` exposes a focused set of endpoints that demonstrate authentication, role-based access control, and session validation. All responses are JSON.

> **Base URL:** `http://localhost:4000`

## Authentication

### `POST /api/auth/login`

Authenticates a user by `username` or `email` and returns a signed JWT along with a sanitised user payload.

**Request body**
```json
{
  "identifier": "student1",
  "password": "StudentPass123!",
  "expectedRole": "student" // optional guard to ensure the user selects the correct panel
}
```

**Successful response** (`200 OK`)
```json
{
  "token": "<jwt>",
  "user": {
    "id": 4,
    "username": "student1",
    "email": "student@example.com",
    "displayName": "Mia Avery",
    "role": "student",
    "permissions": ["view:student-dashboard", "view:lessons", "track:progress"],
    "parentId": 3
  }
}
```

**Failure modes**
- `400 Bad Request` – missing identifier or password.
- `401 Unauthorized` – invalid credentials.
- `403 Forbidden` – `expectedRole` is provided but does not match the user’s stored role.

### `GET /api/auth/me`

Validates an existing session token and returns the hydrated user document. Requires an `Authorization: Bearer <token>` header.

**Response** (`200 OK`)
```json
{
  "user": {
    "id": 4,
    "username": "student1",
    "email": "student@example.com",
    "displayName": "Mia Avery",
    "role": "student",
    "permissions": ["view:student-dashboard", "view:lessons", "track:progress"],
    "parentId": 3
  }
}
```

Returns `401 Unauthorized` if the token is missing, expired, or invalid.

## Roles

### `GET /api/roles`

Public endpoint that lists all roles plus their descriptions and permission scopes. Useful for administrative UIs when building dropdowns.

**Response** (`200 OK`)
```json
{
  "roles": [
    {
      "id": 1,
      "name": "student",
      "description": "Access to assigned courses, progress tracking, and daily schedule.",
      "permissions": ["view:student-dashboard", "view:lessons", "track:progress"]
    },
    {
      "id": 2,
      "name": "parent",
      "description": "Oversight of linked students, goal setting, and scheduling controls.",
      "permissions": ["view:parent-dashboard", "manage:schedule", "manage:goals", "review:grades"]
    }
  ]
}
```

## Protected examples

### `GET /api/users/:id`

Requires a valid token **and** the `administrator` role (enforced by `authorize(['administrator'])`). Returns a sanitised user profile for administrative tooling.

**Response** (`200 OK`)
```json
{
  "user": {
    "id": 3,
    "username": "parent1",
    "email": "parent@example.com",
    "displayName": "Jordan Avery",
    "role": "parent",
    "permissions": ["view:parent-dashboard", "manage:schedule", "manage:goals", "review:grades"],
    "parentId": null
  }
}
```

**Error codes**
- `401 Unauthorized` – missing/invalid token.
- `403 Forbidden` – authenticated but not an administrator.
- `404 Not Found` – user does not exist.

## Environment variables

| Variable      | Description                                             | Default                |
|---------------|---------------------------------------------------------|------------------------|
| `PORT`        | HTTP port for the Express server.                        | `4000`                 |
| `DB_PATH`     | Path to the SQLite file.                                | `backend/data/lms.db`  |
| `JWT_SECRET`  | Secret used to sign JWTs. **Change in production.**     | `development-secret`   |
| `JWT_TTL`     | Token lifetime (passed to `jsonwebtoken`).              | `12h`                  |

Copy `backend/.env.example` to `backend/.env` and override these values for local development without altering source control.

## Adding new endpoints

1. Define or reuse a prepared statement at the top of `backend/server.js` so queries are centralised.
2. Implement the route with clear inline documentation and wrap it with `authenticate` / `authorize` where necessary.
3. Update this file so the contract stays discoverable.

When the system eventually integrates third-party curriculum APIs, model adapters should live under a new `backend/services/` directory to keep route handlers slim.
