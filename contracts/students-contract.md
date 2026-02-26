# Students API Contract

## Endpoint Group
- Base Path: `/api/v1/students`
- Controller: `Api::V1::StudentsController`
- Auth required:
  - `GET /api/v1/students/personal_info`: `Yes`
  - `PATCH|PUT /api/v1/students`: `Yes`
  - `DELETE /api/v1/students`: `Yes`
  - `POST /api/v1/students`: excluded from this contract (covered by student registration contract)

## Purpose
Returns, updates, and deletes the authenticated student account.

## Endpoints (Covered)
- `GET /api/v1/students/personal_info` (show)
- `PATCH /api/v1/students` (update)
- `PUT /api/v1/students` (update)
- `DELETE /api/v1/students` (destroy)

## Request
### Headers
- `Content-Type: application/json` (for `PATCH`, `PUT`)
- Auth session cookie required (Devise session).

### Body Wrapper (Update)
All write requests require top-level key: `student`.

### Update Example
```json
{
  "student": {
    "first_name": "Updated",
    "middle_name": "Middle",
    "extension": "Jr",
    "student_profile_attributes": {
      "id": 12,
      "contact_number": "09119998888",
      "city_municipality": "Lapu-Lapu City",
      "school_level": "college",
      "year_level": "1st",
      "department": "computer_studies",
      "course": "bachelor_of_science_in_information_technology",
      "previous_schools_attributes": [
        {
          "id": 30,
          "_destroy": true
        }
      ]
    }
  }
}
```

### Allowed Fields (`student`)
- `email`
- `password`
- `password_confirmation`
- `auth_id`
- `first_name`
- `middle_name`
- `last_name`
- `extension`
- `student_profile_attributes`

### Allowed Fields (`student_profile_attributes`)
- `id`
- `civil_status`
- `contact_number`
- `sex`
- `birthday`
- `place_of_birth`
- `citizenship`
- `religion`
- `house_number`
- `street_name`
- `barangay_name`
- `city_municipality`
- `province`
- `status`
- `school_level`
- `year_level`
- `course`
- `department`
- `strand`
- `track`
- `previous_schools_attributes`

### Allowed Fields (`previous_schools_attributes[]`)
- `id`
- `school_type`
- `school_name`
- `academic_year_from`
- `academic_year_to`
- `program`
- `completed`
- `_destroy`

## Server-Enforced Behavior (Current)
- `authenticate_user!` protects `show`, `update`, and `destroy`.
- For covered endpoints, `current_user` is used.
  - `GET /api/v1/students` returns `current_user`.
  - `PATCH|PUT /api/v1/students` updates `current_user`.
  - `DELETE /api/v1/students` destroys `current_user`.
- Nested `student_profile_attributes` and nested `previous_schools_attributes` are accepted on update.
- Nested previous schools can be deleted using `id` + `_destroy: true`.

## Success Responses
### `GET /api/v1/students/personal_info`
- Status: `200 OK`
- Body: JSON of the authenticated student (includes nested `student_profile` data).

### `PATCH|PUT /api/v1/students`
- Status: `200 OK`
- Body: currently renders `null` in the current controller implementation.

### `DELETE /api/v1/students`
- Status: `204 No Content`
- Body: empty.

## Error Responses
### `401 Unauthorized`
Returned when request is unauthenticated.

Typical response shape:
```json
{
  "error": "You need to sign in or sign up before continuing."
}
```

### `422 Unprocessable Entity` (Update)
Returned when validations fail for `Student`, `StudentProfile`, or nested `PreviousSchool`.

```json
{
  "errors": [
    "Student profile year level must be 1st, 2nd, 3rd, or 4th for college"
  ]
}
```

## Frontend Integration Notes
- Treat `/api/v1/students` protected routes as "current account" endpoints.
- Send requests with cookies enabled (for example, `credentials: "include"` in `fetch`).
- For update errors, read `errors[]` and map directly to form validation messages.
