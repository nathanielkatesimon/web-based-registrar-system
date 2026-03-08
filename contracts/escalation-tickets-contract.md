# Escalation Tickets API Contract

## Endpoint Group
- Base Path: `/api/v1/escalation_tickets`
- Controllers:
  - `Api::V1::EscalationTicketsController`
  - `Api::V1::EscalationMessagesController`
- Auth required: `Yes` (`authenticate_user!`)

## Purpose
Provides ticket-based escalation chat between `Student` and `Staff`.

## Endpoints
- `GET /api/v1/escalation_tickets` (index)
- `GET /api/v1/escalation_tickets/:id` (show; accepts numeric id or `ticket_code`)
- `POST /api/v1/escalation_tickets` (create; student only)
- `PATCH /api/v1/escalation_tickets/:id/close` (staff only)
- `PATCH /api/v1/escalation_tickets/:id/reopen` (staff only)
- `GET /api/v1/escalation_tickets/:escalation_ticket_id/messages` (list messages)
- `POST /api/v1/escalation_tickets/:escalation_ticket_id/messages` (send message)

## Access Scope
- `Student`
  - Can only view and message their own tickets.
  - Can create tickets.
  - Cannot close/reopen tickets.
  - Cannot send new messages when ticket is `closed`.
- `Staff`
  - Can view all tickets.
  - Can send messages to any ticket.
  - Can close/reopen any ticket.

## Enum
`EscalationTicket.status`
- `open`: `0`
- `closed`: `1`

## Request
### Headers
- `Content-Type: application/json`

### Body Wrappers
- Ticket create: top-level key `escalation_ticket`
- Message create: top-level key `escalation_message`

### Create Ticket Example
```json
{
  "escalation_ticket": {
    "subject": "Urgent deadline requirement",
    "message": "Hello registrar, I need help with my requirement deadline.",
    "document_request_id": 123
  }
}
```

### Send Message Example
```json
{
  "escalation_message": {
    "body": "Please upload your missing document before Friday."
  }
}
```

### Allowed Fields
Ticket (`escalation_ticket`):
- `subject`
- `message` (optional initial message)
- `document_request_id` (required; must belong to current student)

Message (`escalation_message`):
- `body`

## Server-Enforced Behavior
- Ticket ownership (`student_id`) is always assigned from `current_user` during student create.
- Exactly one escalation ticket is allowed per `document_request_id`.
- If a ticket already exists for `document_request_id`, create returns the existing ticket.
- `ticket_code` is generated on create.
- Student can no longer send messages when ticket is `closed`.
- Staff can still send messages even when ticket is `closed`.
- `close` sets `status=closed`, `closed_at`, and `closed_by`.
- `reopen` sets `status=open` and clears `closed_at` / `closed_by`.
- `last_message_at` is updated when a message is created.

## Success Responses
### `GET /api/v1/escalation_tickets`
- Status: `200 OK`
- Body: array of ticket summaries.

### `GET /api/v1/escalation_tickets/:id`
- Status: `200 OK`
- Body: ticket details with nested `messages` and `can_chat` for current user.

### `POST /api/v1/escalation_tickets`
- Status: `201 Created` when a new ticket is created.
- Status: `200 OK` when a ticket already exists for the provided `document_request_id`.
- Body: ticket details.

### `PATCH /api/v1/escalation_tickets/:id/close`
- Status: `200 OK`
- Body: updated ticket details.

### `PATCH /api/v1/escalation_tickets/:id/reopen`
- Status: `200 OK`
- Body: updated ticket details.

### `GET /api/v1/escalation_tickets/:escalation_ticket_id/messages`
- Status: `200 OK`
- Body: array of messages.

### `POST /api/v1/escalation_tickets/:escalation_ticket_id/messages`
- Status: `201 Created`
- Body: created message.

## Error Responses
### `401 Unauthorized`
- Returned when user is not signed in.

### `403 Forbidden`
- Returned when a non-staff user attempts close/reopen.
- Returned when non-student attempts ticket create.

### `404 Not Found`
- Returned when ticket is outside scoped access (for example, student accessing another student's ticket).

### `422 Unprocessable Entity`
- Returned when validations fail (for example, missing `subject`, missing `document_request_id`, missing `body`, student sending message to closed ticket).

## Serialization (Current)
### Ticket Summary (`index`)
- `id`
- `ticket_code`
- `subject`
- `document_request` (`id`, `request_id`)
- `status`
- `student` (`id`, `full_name`)
- `latest_message_preview`
- `latest_message_at`
- `closed_at`
- `created_at`
- `updated_at`

### Ticket Detail (`show` / create / close / reopen)
- `id`
- `ticket_code`
- `subject`
- `document_request` (`id`, `request_id`)
- `status`
- `student` (`id`, `full_name`, `auth_id`)
- `can_chat`
- `closed_at`
- `closed_by` (`id`, `full_name`) or `null`
- `created_at`
- `updated_at`
- `messages[]`

### Message
- `id`
- `body`
- `sender` (`id`, `type`, `full_name`, `avatar_url`)
- `created_at`
- `updated_at`
