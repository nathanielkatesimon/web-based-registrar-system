# Student Registration API Contract

## Endpoint
- Method: `POST`
- Path: `/api/v1/students/registrations`
- Controller: `Api::V1::StudentRegistrationsController#create`
- Auth required: `No` (must be logged out)

## Purpose
Creates a new `Student` user (STI type), accepts nested `student_profile` and `previous_schools` data, and signs the student in using Devise cookie-based session authentication.

## Request
### Headers
- `Content-Type: application/json`

### Body
```json
{
  "user": {
    "auth_id": "2026000000999",
    "email": "student.self.registered@example.com",
    "password": "password123",
    "password_confirmation": "password123",
    "first_name": "Self",
    "middle_name": "Student",
    "last_name": "Signup",
    "extension": "Jr.",
    "student_profile_attributes": {
      "civil_status": "single",
      "contact_number": "09171234567",
      "sex": "male",
      "birthday": "2007-03-01",
      "place_of_birth": "Quezon City",
      "citizenship": "Filipino",
      "religion": "Catholic",
      "house_number": "123",
      "street_name": "Mabini St",
      "barangay_name": "San Isidro",
      "city_municipality": "Quezon City",
      "province": "Metro Manila",
      "status": "currently_enrolled",
      "school_level": "college",
      "year_level": "1st",
      "department": "computer_studies",
      "course": "bachelor_of_science_in_information_technology",
      "track": null,
      "strand": null,
      "previous_schools_attributes": [
        {
          "school_type": "senior_high",
          "school_name": "ABC Senior High School",
          "academic_year_from": 2022,
          "academic_year_to": 2024,
          "program": "STEM",
          "completed": true
        }
      ]
    }
  }
}
```

### Allowed Fields
Top-level `user`:
- `auth_id` (string, required, unique, must be 11-13 digits for Student)
- `email` (string)
- `password` (string)
- `password_confirmation` (string)
- `first_name` (string)
- `middle_name` (string)
- `last_name` (string)
- `extension` (string)
- `student_profile_attributes` (object)

Nested `student_profile_attributes`:
- `id` (integer)
- `civil_status` (enum string)
- `contact_number` (string)
- `sex` (enum string)
- `birthday` (date string)
- `place_of_birth` (string)
- `citizenship` (string)
- `religion` (string)
- `house_number` (string)
- `street_name` (string)
- `barangay_name` (string)
- `city_municipality` (string)
- `province` (string)
- `status` (enum string)
- `school_level` (enum string)
- `year_level` (string)
- `course` (string)
- `department` (string)
- `strand` (string)
- `track` (string)
- `previous_schools_attributes` (array)

Nested `previous_schools_attributes[]`:
- `id` (integer)
- `school_type` (string)
- `school_name` (string)
- `academic_year_from` (integer, required when adding a previous school)
- `academic_year_to` (integer, required when adding a previous school)
- `program` (string)
- `completed` (boolean)
- `_destroy` (boolean)

### Server-Enforced Behavior
- `type` is always forced to `Student` server-side.
- Any client-supplied `type` is ignored.
- `student_profile_attributes` is accepted during signup through nested attributes.
- During signup, controller sets `student_profile.registration_flow = true`.
- During signup, if `student_profile.status = "graduated"` (for either `college` or `senior_high`), at least one `previous_schools` entry is required.
- If no profile is provided, `Student` creates a default blank `student_profile` after create.

## Success Response
### Status
- `201 Created`

### Body
```json
{
  "user": {
    "id": 456,
    "auth_id": "2026000000999",
    "type": "Student",
    "student_profile": {
      "id": 789,
      "status": "currently_enrolled",
      "school_level": "college",
      "year_level": "1st",
      "department": "computer_studies",
      "course": "bachelor_of_science_in_information_technology",
      "previous_schools": [
        {
          "id": 1,
          "school_type": "senior_high",
          "school_name": "ABC Senior High School"
        }
      ]
    }
  }
}
```

Notes:
- Actual response includes `user` with: `id`, `auth_id`, `type`, and full nested `student_profile` (including `previous_schools`) as serialized by Rails `as_json`.

### Session/Cookies
- A Devise session is created on successful registration.
- Response includes session cookie headers (`Set-Cookie`), enabling authenticated requests after signup.

## Error Responses
### Status: `422 Unprocessable Entity`
Returned when validations fail in `Student`, `StudentProfile`, nested `PreviousSchool`, or Devise validations.

```json
{
  "errors": [
    "Student profile school level can't be blank",
    "Student profile year level can't be blank"
  ]
}
```

Common student-related validation errors include:
- `Student profile school level can't be blank`
- `Student profile status can't be blank`
- `Student profile year level can't be blank`
- `Student profile year level must be 1st, 2nd, 3rd, or 4th for college`
- `Student profile year level must be 11 or 12 for senior high`
- `Student profile course is not included in the list`
- `Student profile department is not included in the list`
- `Student profile strand is not included in the list`
- `Student profile track is not included in the list`
- `Student profile base Must add previous school information if already graduated`
- `Student profile previous schools academic year from can't be blank`
- `Student profile previous schools academic year to can't be blank`
- `Student profile previous schools academic year to must be after academic year from`
- `Student USN must be 11 to 13 characters`
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
- Record class stored in `users` table with `type = "Student"`.
- `auth_id` is required and unique (case-insensitive).
- For `Student`, `auth_id` must match `^(\d{11}|\d{12}|\d{13})$` (digits only, 11 to 13 characters).
- `Student` has one `student_profile` (`user_id` FK).
- `StudentProfile` has many `previous_schools`.
- `student_profile` enums:
  - `civil_status`: `single`, `married`, `widower`, `separated`
  - `status`: `currently_enrolled`, `transferee`, `returnee`, `graduated`
  - `school_level`: `college`, `senior_high`
  - `sex`: `male`, `female`
- For `college`:
  - `department` must be one of: `computer_studies`, `business`, `culinary`
  - `course` must belong to selected department
  - `year_level` must be `1st`, `2nd`, `3rd`, or `4th`
- For `senior_high`:
  - `track` must be one of: `academic_track`, `technical_vocational_livelihood`
  - `strand` must belong to selected track
  - `year_level` must be `11` or `12`
- Previous school requirements:
  - During student registration (`POST /api/v1/students/registrations`), previous school history is optional for non-`graduated` status.
  - During student registration, `status = graduated` requires at least one previous-school entry for both `college` and `senior_high`.
  - Outside registration flow (other create/update contexts), there is no required previous-school history rule.
- If a `previous_schools` entry is provided, `PreviousSchool` validations apply:
  - `school_name`, `school_type`, `program`, `academic_year_from`, and `academic_year_to` are required.
  - `academic_year_from` and `academic_year_to` must be numeric and `> 1900`.
  - `academic_year_from` and `academic_year_to` must be `<= (current year + 10)`.
  - `academic_year_to` must be greater than `academic_year_from`.

## Previous-School Validations
- `graduated_requires_previous_college_information` (`StudentProfile`):
  - Runs only when `registration_flow` is `true` (student registration endpoint).
  - Applies only when `status = graduated`.
  - Requires at least one `previous_schools` row not marked for destruction.
  - Adds error: `Must add previous school information if already graduated` when missing.
- `accepts_nested_attributes_for :previous_schools` behavior:
  - `reject_if: :all_blank`: completely blank previous-school rows are ignored.
  - `allow_destroy: true`: existing rows can be removed via `_destroy`.

## Frontend Integration Notes
- Send credentials with cookie support (e.g., `credentials: "include"` in `fetch`).
- Use `user.student_profile_attributes` and nested `previous_schools_attributes` in request payload.
- Handle both:
  - `201` success with `user`
  - `422` validation errors with `errors[]`
  - `200` already-authenticated message
