# Student Registration API Contract

## Endpoint
- Method: `POST`
- Path: `/api/v1/students/registrations`
- Controller: `Api::V1::StudentRegistrationsController#create`
- Auth required: `No` (must be logged out)

## Purpose
Creates a new `Student` user (STI type), accepts nested `student_profile` data (including school slots), and signs the student in using Devise cookie-based session authentication.

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
      "current_college_school_name": "ACLC",
      "current_college_program": "bachelor_of_science_in_information_technology",
      "current_college_level": "1st",
      "current_college_department_track": "computer_studies",
      "current_senior_high_school_name": "ABC Senior High School",
      "current_senior_high_program": "STEM",
      "current_senior_high_level": "12",
      "current_senior_high_year_from": 2022,
      "current_senior_high_year_to": 2024,
      "current_senior_high_department_track": "academic_track"
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

### Server-Enforced Behavior
- `type` is always forced to `Student` server-side.
- Any client-supplied `type` is ignored.
- `student_profile_attributes` is accepted during signup through nested attributes.
- During signup, controller sets `student_profile.registration_flow = true`.
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
      "current_college_school_name": "ACLC"
    }
  }
}
```

### Session/Cookies
- A Devise session is created on successful registration.
- Response includes session cookie headers (`Set-Cookie`), enabling authenticated requests after signup.

## Error Responses
### Status: `422 Unprocessable Entity`
Returned when validations fail in `Student`, `StudentProfile`, or Devise validations.

```json
{
  "errors": [
    "Student profile school level can't be blank",
    "Student profile year level can't be blank"
  ]
}
```

### Status: `200 OK` (Already Authenticated)
If requester is already signed in, Devise `require_no_authentication` responds with:

```json
{
  "message": "You are already signed in."
}
```

## STI and Model Rules (Current)
- Record class stored in `users` table with `type = "Student"`.
- `auth_id` is required and unique (case-insensitive).
- For `Student`, `auth_id` must match `^(\\d{11}|\\d{12}|\\d{13})$` (digits only, 11 to 13 characters).
- `Student` has one `student_profile` (`user_id` FK).
- `student_profile` enums:
  - `civil_status`: `single`, `married`, `widower`, `separated`
  - `status`: `currently_enrolled`, `transferee`, `returnee`, `graduated`
  - `school_level`: `college`, `senior_high`
  - `sex`: `male`, `female`

## Frontend Integration Notes
- Send credentials with cookie support (e.g., `credentials: "include"` in `fetch`).
- Use `user.student_profile_attributes` payload with flat slot fields.
- Handle both:
  - `201` success with `user`
  - `422` validation errors with `errors[]`
  - `200` already-authenticated message
