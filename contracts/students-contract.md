# Students API Contract

## Endpoint Group
- Base Path: `/api/v1/students`
- Controller: `Api::V1::StudentsController`
- Auth required:
  - `GET /api/v1/students`: `Yes` (Staff only)
  - `GET /api/v1/students/personal_info`: `Yes`
  - `GET /api/v1/students/:id`: `Yes`
  - `PATCH|PUT /api/v1/students/:id`: `Yes`
  - `DELETE /api/v1/students/:id`: `Yes`
  - `POST /api/v1/students`: excluded from this contract (covered by student registration contract)

## Purpose
Returns, updates, and deletes a student resource resolved from `:id`, with support for current-user aliasing via `personal_info`.

## Endpoints (Covered)
- `GET /api/v1/students` (index)
- `GET /api/v1/students/personal_info` (show)
- `GET /api/v1/students/:id` (show)
- `PATCH /api/v1/students/:id` (update)
- `PUT /api/v1/students/:id` (update)
- `DELETE /api/v1/students/:id` (destroy)

## Request
### Headers
- `Content-Type: application/json` (for `PATCH`, `PUT`)
- Auth session cookie required (Devise session).

### Query Params (Index)
- `year_level` (optional): exact match on `student_profiles.year_level`
- `school_level` (optional): exact match on `student_profiles.school_level`
- `status` (optional): exact match on `student_profiles.status`
- `course_or_track` (optional): exact match against either `student_profiles.course` OR `student_profiles.track`

### Index Example
`GET /api/v1/students?year_level=12&school_level=senior_high&course_or_track=academic_track&status=currently_enrolled`

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
      "current_college_school_name": "ACLC",
      "current_college_program": "bachelor_of_science_in_information_technology",
      "current_college_level": "1st",
      "current_college_department_track": "computer_studies",
      "current_senior_high_school_name": "Sample SHS",
      "current_senior_high_program": "STEM",
      "current_senior_high_level": "12",
      "current_senior_high_year_from": 2022,
      "current_senior_high_year_to": 2024,
      "current_senior_high_department_track": "academic_track"
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
- `current_college_school_name`
- `current_college_program`
- `current_college_level`
- `current_college_year_from`
- `current_college_year_to`
- `current_college_department_track`
- `prev_college_school_name`
- `prev_college_program`
- `prev_college_level`
- `prev_college_year_from`
- `prev_college_year_to`
- `prev_college_department_track`
- `current_senior_high_school_name`
- `current_senior_high_program`
- `current_senior_high_level`
- `current_senior_high_year_from`
- `current_senior_high_year_to`
- `current_senior_high_department_track`
- `prev_senior_high_school_name`
- `prev_senior_high_program`
- `prev_senior_high_level`
- `prev_senior_high_year_from`
- `prev_senior_high_year_to`
- `prev_senior_high_department_track`

## Server-Enforced Behavior (Current)
- `authenticate_user!` protects `show`, `update`, and `destroy`.
- `authenticate_user!` protects `index`, `show`, `update`, and `destroy`.
- `index` is staff-only:
  - If `current_user` is not `Staff`, returns `403 Forbidden`.
  - Returns students with a joined `student_profile`.
  - Applies optional filters: `year_level`, `school_level`, `status`, `course_or_track`.
- `set_student` resolution for `show`, `update`, and `destroy`:
  - If `params[:id] == "personal_info"`, target is `current_user`.
  - Otherwise, target is `Student.find(params[:id])`.
- `show` renders the resolved target student.
- `update` updates the resolved target student.
- `destroy` destroys the resolved target student.
- Nested `student_profile_attributes` are accepted on update.
- Credential fields are filtered out during update when:
  - `current_user` is not a `Student`, or
  - resolved `@student` does not equal `current_user`.
- Filtered credential fields:
  - `email`
  - `password`
  - `password_confirmation`

## Success Responses
### `GET /api/v1/students`
- Status: `200 OK`
- Access: staff users only
- Body: JSON array of student objects (with nested `student_profile` and `family_info`), optionally filtered by query params.
- Student object includes `incomplete_personal_info` (boolean) based on required Personal Info fields.
- Student object includes `incomplete_family_info` (boolean) based on Family Info contact completeness.
- Student object includes `incomplete_academic_info` (boolean) based on status-specific Academic Info presence.

### `GET /api/v1/students/personal_info`
- Status: `200 OK`
- Body: JSON of the authenticated student (includes nested `student_profile` data).
- Includes `incomplete_personal_info` (boolean).
- Includes `incomplete_family_info` (boolean).
- Includes `incomplete_academic_info` (boolean).

### `GET /api/v1/students/:id`
- Status: `200 OK`
- Body: JSON of the resolved student.
- Includes `incomplete_personal_info` (boolean).
- Includes `incomplete_family_info` (boolean).
- Includes `incomplete_academic_info` (boolean).

### `PATCH|PUT /api/v1/students/:id`
- Status: `200 OK`
- Body: JSON of the updated resolved student.

### `DELETE /api/v1/students/:id`
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

### `403 Forbidden` (Index)
Returned when authenticated user is not a `Staff`.

Typical response shape:
```json
{}
```

### `422 Unprocessable Entity` (Update)
Returned when validations fail for `Student` or `StudentProfile`.

```json
{
  "errors": [
    "Student profile year level must be 1st, 2nd, 3rd, or 4th for college"
  ]
}
```

### `404 Not Found`
Returned when `:id` is not `"personal_info"` and no matching `Student` exists.

## Frontend Integration Notes
- Use `/api/v1/students` for staff-facing student directory/list pages.
- Available list filters: `year_level`, `school_level`, `status`, `course_or_track`.
- Use `/api/v1/students/personal_info` for current account operations.
- Use `/api/v1/students/:id` for ID-based student operations.
- Send requests with cookies enabled (for example, `credentials: "include"` in `fetch`).
- For update errors, read `errors[]` and map directly to form validation messages.
- Use `incomplete_personal_info` to drive the Personal Info nav alert badge.
- Use `incomplete_family_info` to drive the Family Info nav alert badge.
- Use `incomplete_academic_info` to drive the Academic Info nav alert badge.
