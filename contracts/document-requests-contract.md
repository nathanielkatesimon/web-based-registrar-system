# Document Requests API Contract

## Endpoint Group
- Base Path: `/api/v1/document_requests`
- Controller: `Api::V1::DocumentRequestsController`
- Auth required: `Yes` (`authenticate_user!`)

## Purpose
Manages student-owned document requests with nested `document_request_items`, required ID verification upload, conditional payment receipt upload, and server-generated `request_id`.

## Endpoints
- `GET /api/v1/document_requests` (index, current user only)
- `GET /api/v1/document_requests/:id` (show, current user only)
- `POST /api/v1/document_requests` (create)
- `PATCH /api/v1/document_requests/:id` (update, current user only)
- `PUT /api/v1/document_requests/:id` (update, current user only)
- `DELETE /api/v1/document_requests/:id` (destroy, current user only)

## Enums
- `status`: `on_hold`, `processing`, `completed`, `closed`
- `delivery_method`: `self_pickup`, `courier_delivery`
- `payment_status`: `paid`, `not_paid`, `under_review`
- `payment_method`: `cash`, `online`

## Request
### Headers
- `Content-Type: multipart/form-data` for create/update with file uploads.
- `Content-Type: application/json` can be used for non-file updates.

### Body Wrapper
All write endpoints require top-level key: `document_request`.

### Create/Update Example
```json
{
  "document_request": {
    "status": "on_hold",
    "unpaid_bill": true,
    "missing_requirements": true,
    "delivery_method": "courier_delivery",
    "courier_name": "LBC",
    "payment_method": "online",
    "payment_status": "under_review",
    "payment_verified_at": 1739980800,
    "shipping_fee_cents": 10000,
    "id_verification_photo": "<uploaded file>",
    "payment_receipt": "<uploaded file>",
    "document_request_items_attributes": [
      {
        "document_type_id": 1,
        "quantity": 2,
        "purpose": "Scholarship requirement",
        "destination": 0,
        "remarks": "Process ASAP"
      },
      {
        "id": 10,
        "_destroy": true
      }
    ]
  }
}
```

### Allowed Fields
Top-level `document_request`:
- `status`
- `unpaid_bill`
- `missing_requirements`
- `delivery_method`
- `courier_name`
- `payment_method`
- `payment_status`
- `payment_verified_at`
- `shipping_fee_cents`
- `id_verification_photo`
- `payment_receipt`
- `document_request_items_attributes`

Nested `document_request_items_attributes[]`:
- `id`
- `document_type_id`
- `quantity`
- `purpose`
- `destination`
- `remarks`
- `_destroy`

## Server-Enforced Behavior
- `user_id` is always assigned from `current_user`.
- `request_id` is generated after successful create using format `RIDXXXXX-XXXXXX` (numeric digits) and is unique.
- `courier_name` is required when `delivery_method = courier_delivery`.
- `id_verification_photo` is required.
- `payment_receipt` is required when `payment_method = online`.
- `payment_verified_at` is automatically managed from `payment_status` updates:
  - set to current UNIX timestamp when `payment_status = paid`
  - cleared (`null`) when `payment_status = not_paid` or `under_review`
- `unpaid_bill` and `missing_requirements` are independent boolean flags and can both be `true`.
- For nested request items, `unit_price_cents` is enforced from `document_type.price_cents` on save.

## Success Responses
### `GET /api/v1/document_requests`
- Status: `200 OK`
- Body: array of current user document requests.

### `GET /api/v1/document_requests/:id`
- Status: `200 OK`
- Body: single current user document request.

### `POST /api/v1/document_requests`
- Status: `201 Created`
- Body: created document request.

### `PATCH|PUT /api/v1/document_requests/:id`
- Status: `200 OK`
- Body: updated document request.

### `DELETE /api/v1/document_requests/:id`
- Status: `204 No Content`
- Body: empty.

## Error Responses
### `422 Unprocessable Content`
Returned when validations fail, including:
- missing `id_verification_photo`
- missing `payment_receipt` for online payment
- missing `courier_name` for courier delivery
- invalid nested `document_type_id`

### `404 Not Found`
Returned when `:id` does not exist for current user scope.

## Serialization (Current)
`DocumentRequestSerializer` returns:
- `id`
- `request_id`
- `status`
- `unpaid_bill`
- `missing_requirements`
- `delivery_method`
- `courier_name`
- `payment_method`
- `payment_status`
- `payment_verified_at`
- `shipping_fee_cents`
- `student_name`
- `created_at`
- `updated_at`
- `request_items` (derived list with item name, quantity, unit/line pricing, purpose, remarks)
- `total_cents` (sum of line totals + shipping)
- `id_verification_photo_url` (Active Storage blob path)
- `payment_receipt_url` (Active Storage blob path when attached)
- `escalation_ticket` (`id`, `ticket_code`, `status`) or `null`
- `request_time_lines` (timeline entries)
