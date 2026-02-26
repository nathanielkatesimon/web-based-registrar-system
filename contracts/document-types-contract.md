# Document Types API Contract

## Endpoint Group
- Base Path: `/api/v1/document_types`
- Controller: `Api::V1::DocumentTypesController`
- Auth required: `No` (current controller has no authentication guard)

## Purpose
Provides read access to available document types and their prices.

## Endpoints
- `GET /api/v1/document_types` (index)

## Request
### Headers
- No special headers required for `GET`.

## Success Responses
### `GET /api/v1/document_types`
- Status: `200 OK`
- Body: JSON array of document types.

Example:
```json
[
  {
    "id": 1,
    "name": "Transcript of Records",
    "price_cents": 5000
  },
  {
    "id": 2,
    "name": "Good Moral Certificate",
    "price_cents": 3000
  }
]
```

## Response Shape (Current)
Each item is serialized via `DocumentTypeSerializer` and includes:
- `id` (integer)
- `name` (string)
- `price_cents` (integer)

## Not Implemented (Current)
The following REST actions exist in routes but are currently stubbed in controller code and should not be used until implemented:
- `GET /api/v1/document_types/:id` (show)
- `POST /api/v1/document_types` (create)
- `PATCH /api/v1/document_types/:id` (update)
- `PUT /api/v1/document_types/:id` (update)
- `DELETE /api/v1/document_types/:id` (destroy)

## Frontend Integration Notes
- Use this endpoint to populate selectable document types when creating document requests.
- Treat `price_cents` as integer cents and format client-side (e.g., `5000` => `50.00`).
