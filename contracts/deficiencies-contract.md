# Deficiencies API Contract

## Endpoint Group
- Base Path: `/api/v1/deficiencies`
- Controller: `Api::V1::DeficienciesController`
- Auth required:
  - `GET /api/v1/deficiencies/personal_info`: `Yes`
  - `GET /api/v1/deficiencies/:id`: `Yes`
  - `PATCH|PUT /api/v1/deficiencies/:id`: `Yes`

## Purpose
Returns and updates student deficiency document statuses.

## Endpoints (Covered)
- `GET /api/v1/deficiencies/personal_info` (show current student deficiency)
- `GET /api/v1/deficiencies/:id` (show by deficiency id)
- `PATCH /api/v1/deficiencies/:id` (update)
- `PUT /api/v1/deficiencies/:id` (update)

## Request
### Headers
- `Content-Type: application/json` (for `PATCH`, `PUT`)
- Auth session cookie required (Devise session).

### Body Wrapper (Update)
All write requests require top-level key: `deficiency`.

### Update Example
```json
{
  "deficiency": {
    "enrollment_form": "complied",
    "form_138": "lacking",
    "form_137": "not_included",
    "certificate_of_good_moral_character": "complied",
    "id_pictures": "lacking",
    "birth_certificate": "not_included",
    "senior_high_school_diploma": "complied",
    "honorable_dismissal": "not_included",
    "transcript_of_records": "lacking"
  }
}
```

### Allowed Fields (`deficiency`)
- `enrollment_form`
- `form_138`
- `form_137`
- `certificate_of_good_moral_character`
- `id_pictures`
- `birth_certificate`
- `senior_high_school_diploma`
- `honorable_dismissal`
- `transcript_of_records`

### Allowed Enum Values (all deficiency fields)
- `complied`
- `lacking`
- `not_included`

## Server-Enforced Behavior (Current)
- `authenticate_user!` protects `show` and `update`.
- `set_deficiency` resolution:
  - If `params[:id] == "personal_info"`:
    - `current_user` must be type `Student`; otherwise returns `404 Not Found`.
    - Returns `current_user.deficiency`.
  - Otherwise, target is `Deficiency.find(params[:id])`.
- `update` is staff-only:
  - If `current_user` is type `Staff`, update is allowed.
  - If `current_user` is type `Student`, returns `403 Forbidden`.
- New `Student` records automatically create a linked `Deficiency` after create.
- All deficiency fields default to `not_included` on auto-create.

## Success Responses
### `GET /api/v1/deficiencies/personal_info`
- Status: `200 OK`
- Body: JSON of current student deficiency.

### `GET /api/v1/deficiencies/:id`
- Status: `200 OK`
- Body: JSON of requested deficiency record.

### `PATCH|PUT /api/v1/deficiencies/:id`
- Status: `200 OK`
- Body: JSON of updated deficiency record.

## Response Shape (Current)
Serialized via `DeficiencySerializer`:
- `id` (integer)
- `user_id` (integer)
- `enrollment_form` (string enum)
- `form_138` (string enum)
- `form_137` (string enum)
- `certificate_of_good_moral_character` (string enum)
- `id_pictures` (string enum)
- `birth_certificate` (string enum)
- `senior_high_school_diploma` (string enum)
- `honorable_dismissal` (string enum)
- `transcript_of_records` (string enum)

## Error Responses
### `401 Unauthorized`
Returned when request is unauthenticated.

Typical response shape:
```json
{
  "error": "You need to sign in or sign up before continuing."
}
```

### `403 Forbidden`
Returned when non-staff (for example, `Student`) attempts update.

```json
{}
```

### `404 Not Found`
Returned when:
- `:id` is not `"personal_info"` and no matching `Deficiency` exists, or
- `:id` is `"personal_info"` but `current_user` is not a `Student`.

```json
{}
```

### `422 Unprocessable Entity`
Returned when update validation fails.

```json
{
  "errors": [
    "Enrollment form is not included in the list"
  ]
}
```

## Frontend Integration Notes
- Students should read their own deficiency via `/api/v1/deficiencies/personal_info`.
- Staff can update deficiency statuses by record id.
- Send requests with cookies enabled (for example, `credentials: "include"` in `fetch`).
- Keep payload wrapped in `deficiency`.
