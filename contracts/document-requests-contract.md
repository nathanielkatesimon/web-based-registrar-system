# Document Requests API Contract

## Endpoint Group
- Base Path: `/api/v1/document_requests`
- Controller: `Api::V1::DocumentRequestsController`
- Auth required: `No` (current controller has no authentication guard)

## Purpose
Manages document request records and supports nested create/update/delete of `document_request_items` through `document_request_items_attributes`.

## Endpoints
- `GET /api/v1/document_requests` (index)
- `GET /api/v1/document_requests/:id` (show)
- `POST /api/v1/document_requests` (create)
- `PATCH /api/v1/document_requests/:id` (update)
- `PUT /api/v1/document_requests/:id` (update)
- `DELETE /api/v1/document_requests/:id` (destroy)

## Request
### Headers
- `Content-Type: application/json` (for `POST`, `PATCH`, `PUT`)

### Body Wrapper
All write endpoints require top-level key: `document_request`.

### Create/Update Example (with nested items)
```json
{
  "document_request": {
    "user_id": 2,
    "status": 0,
    "delivery_method": 1,
    "payment_method": 0,
    "payment_status": 0,
    "payment_verified_at": 1739980800,
    "shipping_fee_cents": 10000,
    "document_request_items_attributes": [
      {
        "document_type_id": 1,
        "quantity": 2,
        "purpose": "Scholarship requirement",
        "destination": 0,
        "remarks": "Process ASAP",
        "unit_price_cents": 5000
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
- `user_id` (integer, required by DB/model association)
- `status` (integer)
- `delivery_method` (integer)
- `payment_method` (integer)
- `payment_status` (integer)
- `payment_verified_at` (integer)
- `shipping_fee_cents` (integer)
- `document_request_items_attributes` (array)

Nested `document_request_items_attributes[]`:
- `id` (integer; required when updating/deleting existing nested row)
- `document_type_id` (integer; must reference an existing `document_types.id`)
- `quantity` (integer)
- `purpose` (string)
- `destination` (integer)
- `remarks` (string)
- `unit_price_cents` (integer)
- `_destroy` (boolean; with `id`, removes nested row on update)

## Server-Enforced Behavior
- Nested items are enabled via `accepts_nested_attributes_for :document_request_items, allow_destroy: true`.
- Each nested item must use an existing `document_type_id`.
  - Enforced by `belongs_to :document_type` and DB foreign key on `document_request_items.document_type_id`.
  - Contract expectation: clients must not create new document types through this endpoint.
- `DocumentType` data is pre-seeded and should be selected from existing records.
- Deleting a `DocumentRequest` also deletes associated `document_request_items` (`dependent: :destroy`).

## Success Responses
### `GET /api/v1/document_requests`
- Status: `200 OK`
- Body: array of document requests (serialized via `DocumentRequestSerializer`).

### `GET /api/v1/document_requests/:id`
- Status: `200 OK`
- Body: single document request (serialized via `DocumentRequestSerializer`).

### `POST /api/v1/document_requests`
- Status: `201 Created`
- Body: created document request (serialized).
- `Location` header is set to created resource URL.

### `PATCH|PUT /api/v1/document_requests/:id`
- Status: `200 OK`
- Body: updated document request (serialized).

### `DELETE /api/v1/document_requests/:id`
- Status: `204 No Content`
- Body: empty.

## Error Responses
### `422 Unprocessable Content`
Returned when create/update validations fail. Current controller returns raw model errors:
```json
{
  "user": [
    "must exist"
  ],
  "document_request_items.document_type": [
    "must exist"
  ]
}
```

Possible causes include:
- Missing/invalid `user_id`.
- Missing/invalid nested `document_type_id`.
- Any model-level validation failures for `DocumentRequest` or nested `DocumentRequestItem`.

### `404 Not Found`
Returned when `:id` does not match an existing `DocumentRequest` (raised by `DocumentRequest.find`).

## Serialization Notes (Current)
- Controller renders ActiveModelSerializer output for `DocumentRequest`.
- Current serializer attributes:
  - `id`, `status`, `delivery_method`, `payment_method`, `payment_status`, `payment_verified_at`, `shipping_fee_cents`
- Current serializer declares `has_one :user`.
  - If response shape changes (for example adding nested `document_request_items`), update this contract accordingly.

## Frontend Integration Notes
- Submit nested rows under `document_request.document_request_items_attributes`.
- For new rows, send `document_type_id` from existing seeded document types.
- For nested row deletion in update, send both `id` and `_destroy: true`.
- Prefer loading selectable document types from `/api/v1/document_types` (or another approved source) and never creating types from the document request payload.
