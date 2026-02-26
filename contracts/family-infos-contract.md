# Family Infos API Contract

## Endpoint Group
- Base Path: `/api/v1/family_infos`
- Controller: `Api::V1::FamilyInfosController`
- Auth required:
  - `GET /api/v1/family_infos/personal_info`: `Yes`
  - `GET /api/v1/family_infos/:id`: `Yes`
  - `PATCH|PUT /api/v1/family_infos/:id`: `Yes`

## Purpose
Returns and updates a student family information record for father, mother, and guardian details.

## Endpoints (Covered)
- `GET /api/v1/family_infos/personal_info` (show current user)
- `GET /api/v1/family_infos/:id` (show by family info id)
- `PATCH /api/v1/family_infos/:id` (update)
- `PUT /api/v1/family_infos/:id` (update)

## Request
### Headers
- `Content-Type: application/json` (for `PATCH`, `PUT`)
- Auth session cookie required (Devise session).

### Body Wrapper (Update)
All write requests require top-level key: `family_info`.

### Update Example
```json
{
  "family_info": {
    "father_first_name": "Pedro",
    "father_middle_name": "Dela",
    "father_last_name": "Cruz",
    "father_extension": "Sr.",
    "father_home_address": "123 Main Street, Cebu City",
    "father_occupation": "Engineer",
    "father_office_company_name": "ABC Engineering",
    "father_company_address": "Cebu IT Park, Cebu City",
    "father_contact_number": "09171234567",
    "father_email_address": "pedro.cruz@example.com",
    "mother_first_name": "Maria",
    "mother_middle_name": "Santos",
    "mother_last_name": "Cruz",
    "mother_extension": "",
    "mother_home_address": "123 Main Street, Cebu City",
    "mother_occupation": "Teacher",
    "mother_office_company_name": "XYZ Academy",
    "mother_company_address": "Mandaue City",
    "mother_contact_number": "09179876543",
    "mother_email_address": "maria.cruz@example.com",
    "guardian_first_name": "Juan",
    "guardian_middle_name": "Perez",
    "guardian_last_name": "Reyes",
    "guardian_extension": "",
    "guardian_home_address": "456 Second Street, Mandaue City",
    "guardian_occupation": "Business Owner",
    "guardian_office_company_name": "Reyes Trading",
    "guardian_company_address": "Lapu-Lapu City",
    "guardian_contact_number": "09170001111",
    "guardian_email_address": "juan.reyes@example.com"
  }
}
```

### Allowed Fields (`family_info`)
- `father_first_name`
- `father_middle_name`
- `father_last_name`
- `father_extension`
- `father_home_address`
- `father_occupation`
- `father_office_company_name`
- `father_company_address`
- `father_contact_number`
- `father_email_address`
- `mother_first_name`
- `mother_middle_name`
- `mother_last_name`
- `mother_extension`
- `mother_home_address`
- `mother_occupation`
- `mother_office_company_name`
- `mother_company_address`
- `mother_contact_number`
- `mother_email_address`
- `guardian_first_name`
- `guardian_middle_name`
- `guardian_last_name`
- `guardian_extension`
- `guardian_home_address`
- `guardian_occupation`
- `guardian_office_company_name`
- `guardian_company_address`
- `guardian_contact_number`
- `guardian_email_address`

## Server-Enforced Behavior (Current)
- `authenticate_user!` protects `show` and `update`.
- `set_family_info` resolution:
  - If `params[:id] == "personal_info"`, target is `current_user.family_info`.
  - Otherwise, target is `FamilyInfo.find(params[:id])`.
- `update` returns `422 Unprocessable Entity` with `errors[]` when validations fail.
- A `Student` automatically creates a blank `family_info` record after create.

## Success Responses
### `GET /api/v1/family_infos/personal_info`
- Status: `200 OK`
- Body: JSON of current user family info.

### `GET /api/v1/family_infos/:id`
- Status: `200 OK`
- Body: JSON of requested family info record.

### `PATCH|PUT /api/v1/family_infos/:id`
- Status: `200 OK`
- Body: JSON of updated family info record.

## Error Responses
### `401 Unauthorized`
Returned when request is unauthenticated.

Typical response shape:
```json
{
  "error": "You need to sign in or sign up before continuing."
}
```

### `422 Unprocessable Entity`
Returned when update validations fail.

```json
{
  "errors": [
    "Student must exist"
  ]
}
```

### `404 Not Found`
Returned when `:id` is not `"personal_info"` and no matching `FamilyInfo` exists.

## Frontend Integration Notes
- Use `/api/v1/family_infos/personal_info` to fetch/update the current logged-in student's family data.
- Send requests with cookies enabled (for example, `credentials: "include"` in `fetch`).
- Keep payload wrapped in `family_info` to match strong params.
