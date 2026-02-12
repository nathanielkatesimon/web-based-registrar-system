## Web-Based Registrar System

This repository contains a registrar system split into:
- `frontend/`: Next.js web app
- `api/`: Rails API backend
- `contracts/`: API behavior contracts used by frontend/backend integration

## Tech Stack

### Frontend
- Next.js `16.1.6`
- React `19.2.3`
- React DOM `19.2.3`
- ESLint 9 + `eslint-config-next`

### Backend
- Ruby on Rails `8.1.x` (API-only mode with selected middleware enabled)
- PostgreSQL (`pg` gem)
- Puma
- Devise for authentication
- ActiveModelSerializers
- Solid Queue, Solid Cache, Solid Cable

## API-Only Rails With Cookie Sessions

The backend is configured as an API app (`config.api_only = true`), but it intentionally enables cookie-based sessions for Devise login state:
- `config.session_store :cookie_store, key: "_interslice_session"`
- `ActionDispatch::Cookies` middleware
- session middleware mounted manually

This allows the API to keep server-side session auth (Devise + Warden) while still serving JSON endpoints for a separate frontend app.

Why this setup:
- Single primary web client (Next.js)
- Simpler sign-in/sign-out flow than token/JWT management
- Native Devise integration and session invalidation behavior

Important client behavior:
- Send requests with credentials/cookies enabled (for example `credentials: "include"` in `fetch`).
- Session endpoints are JSON-based and do not return HTML auth pages.

## Authentication Notes

User auth uses `auth_id` + `password` for sign-in.

### `auth_id` Design (USN vs Employee ID)
- The UI shows role-specific labels:
- Students: `USN`
- Staff: `Employee ID`
- In the backend, both are centralized as `auth_id` on `User`.
- Validation is enforced at the model/class level based on STI type:
- `Student` requires USN-style `auth_id` length
- `Staff` requires Employee ID-style `auth_id` length

This keeps API/auth logic unified while preserving correct domain behavior per user type.

Primary auth endpoints:
- `POST /api/v1/users/sign_in`
- `DELETE /api/v1/users/sign_out`
- `POST /api/v1/students/registrations`
- `POST /api/v1/staffs/registrations`

The app uses STI in the `users` table:
- `Student < User`
- `Staff < User`

Server-side registration controllers force the STI type (`Student` or `Staff`) regardless of client input.

## Domain Models (Backend)

Core entities:
- `User` (base auth/account record, Devise-enabled)
- `Student` (inherits `User`)
- `Staff` (inherits `User`)
- `StudentProfile` (belongs to student/user)
- `PreviousSchool` (belongs to student profile)

## Contracts Folder

`contracts/` documents expected API request/response behavior for integration and testing:

1. `contracts/staff-registration-contract.md`
- Defines `POST /api/v1/staffs/registrations`
- Registration payload shape and allowed fields
- Success (`201`) response schema
- Validation error (`422`) format
- Already-authenticated behavior (`200`)
- Notes that successful registration also creates a Devise session cookie

2. `contracts/staff-session-contract.md`
- Defines staff-focused usage of shared session endpoints
- Sign-in contract for `POST /api/v1/users/sign_in`
- Sign-out contract for `DELETE /api/v1/users/sign_out`
- Expected status codes and JSON payloads
- Cookie/session expectations for authenticated requests

## Repository Structure

```text
.
├── api/         # Rails API backend
├── frontend/    # Next.js frontend
├── contracts/   # API behavior contracts
└── readme.md    # Project documentation
```
