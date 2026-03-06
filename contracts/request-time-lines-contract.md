# Request Time Lines API Contract

## Endpoint Group
- Base Path: `/api/v1/document_requests/:document_request_id/request_time_lines`
- Controller: `Api::V1::RequestTimeLinesController`
- Auth required: `Yes` (`authenticate_user!`)

## Purpose
Tracks status history entries (`RequestTimeLine`) for a specific `DocumentRequest`.

## Endpoints
- `GET /api/v1/document_requests/:document_request_id/request_time_lines/:id` (show)
- `POST /api/v1/document_requests/:document_request_id/request_time_lines` (create)
- `PATCH /api/v1/document_requests/:document_request_id/request_time_lines/:id` (update)
- `PUT /api/v1/document_requests/:document_request_id/request_time_lines/:id` (update)
- `DELETE /api/v1/document_requests/:document_request_id/request_time_lines/:id` (destroy)

## Access Scope
- `Student`: can only access timelines under their own document requests.
- `Staff`: can access timelines under any document request.

## Enum (`RequestTimeLine.type`)
- `request_processed`: `0`
- `request_forwarded_to_head_office`: `1`
- `waiting_for_approval`: `2`
- `approved_by_head_office`: `3`
- `declined_by_head_office`: `4`
- `completed`: `5`
- `ready_for_shipping`: `6`
- `ready_for_pick_up`: `7`
- `document_shipped`: `8`
- `request_opened`: `9`
- `request_submitted`: `10`

## Request
### Headers
- `Content-Type: application/json`

### Body Wrapper
All write endpoints require top-level key: `request_time_line`.

### Create/Update Example
```json
{
  "request_time_line": {
    "type": "waiting_for_approval"
  }
}
```

### Allowed Fields
Top-level `request_time_line`:
- `type`

## Server-Enforced Behavior
- `document_request_id` comes from the nested URL path.
- `type` is required.
- `type` accepts only enum values listed above.

## Success Responses
### `GET /api/v1/document_requests/:document_request_id/request_time_lines/:id`
- Status: `200 OK`
- Body: single request timeline record.

### `POST /api/v1/document_requests/:document_request_id/request_time_lines`
- Status: `201 Created`
- Body: created request timeline record.

### `PATCH|PUT /api/v1/document_requests/:document_request_id/request_time_lines/:id`
- Status: `200 OK`
- Body: updated request timeline record.

### `DELETE /api/v1/document_requests/:document_request_id/request_time_lines/:id`
- Status: `204 No Content`
- Body: empty.

## Error Responses
### `401 Unauthorized`
- Returned when user is not signed in.

### `404 Not Found`
- Returned when `document_request_id` is outside user scope.
- Returned when timeline `:id` is not found under the scoped document request.

### `422 Unprocessable Content`
- Returned when validation fails (for example, missing `type`).

## Serialization (Current)
`RequestTimeLineSerializer` returns:
- `id`
- `type`
