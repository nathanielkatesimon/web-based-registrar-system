# Staff Registration API Contract

## Endpoint
- Method: `POST`
- Path: `/api/v1/staffs/registrations`
- Controller: `Api::V1::StaffRegistrationsController#create`
- Auth required: `No` (must be logged out)

## Purpose
Creates a new `Staff` user (STI type) and signs them in using Devise cookie-based session authentication.

## Request
### Headers
- `Content-Type: application/json`

### Body
```json
{
  "user": {
    "auth_id": "14-2026-011",
    "email": "self.registered.staff@example.com",
    "password": "password123",
    "password_confirmation": "password123",
    "first_name": "Self",
    "middle_name": "Staff",
    "last_name": "Signup",
    "extension": "Jr."
  }
}
```

### Allowed Fields
- `auth_id` (string)
- `email` (string)
- `password` (string)
- `password_confirmation` (string)
- `first_name` (string)
- `middle_name` (string)
- `last_name` (string)
- `extension` (string)

### Server-Enforced Behavior
- `type` is always forced to `Staff` server-side.
- Any client-supplied `type` is ignored.

## Success Response
### Status
- `201 Created`

### Body
```json
{
  "user": {
    "id": 123,
    "auth_id": "14-2026-011",
    "type": "Staff"
  }
}
```

### Session/Cookies
- A Devise session is created on successful registration.
- Response includes session cookie headers (`Set-Cookie`), enabling authenticated requests after signup.

## Error Responses
### Status: `422 Unprocessable Entity`
Returned when validations fail.

```json
{
  "errors": [
    "Employee ID invalid"
  ]
}
```

Example staff-specific validation errors:
- `Employee ID invalid`
- `Auth has already been taken`
- Devise password/email validation messages

### Status: `200 OK` (Already Authenticated)
If requester is already signed in, Devise `require_no_authentication` responds with:

```json
{
  "message": "You are already signed in."
}
```

Note: exact message is locale-dependent (`devise.failure.already_authenticated`).

## STI and Model Rules (Current)
- Record class stored in `users` table with `type = "Staff"`.
- `auth_id` must be present and unique.
- For staff, `auth_id` must be `<= 10` characters.

## Frontend Integration Notes
- Send credentials with cookie support (e.g., `credentials: "include"` in `fetch`).
- Handle both:
  - `201` success with `user`
  - `422` validation errors with `errors[]`
  - `200` already-authenticated message
