# User Session API Contract (Staff + Student)

## Scope
Session endpoints are shared by both `Staff` and `Student` (STI under `User`).
Both user types authenticate through the same Devise session endpoints.

## Sign In

### Endpoint
- Method: `POST`
- Path: `/api/v1/users/sign_in`
- Controller: `Users::SessionsController#create`
- Auth required: `No` (must be logged out; already-authenticated users get a message response)

### Request
Headers:
- `Content-Type: application/json`

Body:
```json
{
  "user": {
    "auth_id": "14-2026-011",
    "password": "password123"
  }
}
```

`auth_id` format by STI type (`User#auth_id_format`):
- `Staff`: `NN-NNNN-NNN` (example: `14-2026-011`)
- `Student`: 11 to 13 digits only (example: `2026000000999`)

### Success Response
- Status: `200 OK`
```json
{
  "user": {
    "id": 10,
    "auth_id": "14-2026-011"
  }
}
```

Notes:
- Response shape is the same for both `Staff` and `Student`.
- Current session response includes only `id` and `auth_id`.

### Error Responses
- Status: `422 Unprocessable Entity` (invalid credentials)
```json
{
  "message": "Invalid ID or password"
}
```

- Status: `200 OK` (already authenticated)
```json
{
  "message": "You are already signed in."
}
```
Note: message text is locale-dependent from Devise (`devise.failure.already_authenticated`).

- Status: `401 Unauthorized` (requesting sign-in page endpoint directly)
```json
{
  "message": "You must sign-in first"
}
```

### Session/Cookies
- On successful sign-in, Devise creates a cookie-backed session.
- Client must send cookies on subsequent requests (`credentials: "include"`).
- Session behavior is identical for `Staff` and `Student`.

## Sign Out

### Endpoint
- Method: `DELETE`
- Path: `/api/v1/users/sign_out`
- Controller: `Users::SessionsController#destroy`
- Authenticated user type: `Staff` or `Student`

### Request
Headers:
- Cookie/session headers from prior sign-in.

### Success Response
- Status: `204 No Content`
```json
{}
```

### Behavior Notes
- Signs out current user session.
- `verify_signed_out_user` is overridden to no-op, so sign-out responds without Devise redirect-style behavior.
- Response shape is identical regardless of user STI type.

## Implementation Notes (Current)
- Authentication key is `auth_id` + `password`.
- `User.find_for_database_authentication` looks up by exact `auth_id`.
- STI subclasses using this session flow: `Staff`, `Student`.
- Session endpoints are API JSON endpoints and do not provide HTML form pages.
