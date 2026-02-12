# Staff Session API Contract

## Scope
Session endpoints are shared by both `Staff` and `Student` (STI under `User`), but this contract focuses on staff usage.

## Sign In

### Endpoint
- Method: `POST`
- Path: `/api/v1/users/sign_in`
- Controller: `Users::SessionsController#create`
- Auth required: `No` (must be logged out)

### Request
Headers:
- `Content-Type: application/json`

Body:
```json
{
  "user": {
    "auth_id": "staff_001",
    "password": "password123"
  }
}
```

### Success Response
- Status: `200 OK`
```json
{
  "user": {
    "id": 10,
    "auth_id": "staff_001"
  }
}
```

### Error Responses
- Status: `422 Unprocessable Entity` (invalid credentials)
```json
{
  "message": "Invalid username or password"
}
```

- Status: `200 OK` (already authenticated)
```json
{
  "message": "You are already signed in."
}
```
Note: message text is locale-dependent from Devise (`devise.failure.already_authenticated`).

### Session/Cookies
- On successful sign-in, Devise creates a cookie-backed session.
- Client must send cookies on subsequent requests (`credentials: "include"`).

## Sign Out

### Endpoint
- Method: `DELETE`
- Path: `/api/v1/users/sign_out`
- Controller: `Users::SessionsController#destroy`

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

## Implementation Notes (Current)
- Authentication key is `auth_id` + `password`.
- Session endpoints are API JSON endpoints and do not provide HTML form pages.
