"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { getCableConsumer } from "@/lib/action-cable";
import useSessionStore from "@/store/session-store";

const toDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleString();
};

const normalizeAvatarUrl = (value) => {
  if (!value) return "/avatar_placeholder.webp";
  if (String(value).startsWith("http")) return value;
  return `${process.env.NEXT_PUBLIC_API_URL || ""}${value}`;
};

const sortTickets = (items) =>
  [...items].sort((a, b) => {
    const aTime = new Date(a.latest_message_at || a.updated_at || a.created_at || 0).getTime();
    const bTime = new Date(b.latest_message_at || b.updated_at || b.created_at || 0).getTime();
    return bTime - aTime;
  });

export default function EscalationBoard({ role }) {
  const { currentUser } = useSessionStore();
  const isStaff = role === "Staff";

  const [tickets, setTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeSubject, setComposeSubject] = useState("");
  const [composeMessage, setComposeMessage] = useState("");
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);

  const selectedTicketIdRef = useRef(null);
  selectedTicketIdRef.current = selectedTicketId;

  const upsertTicket = useCallback((nextTicket) => {
    setTickets((prev) => {
      const index = prev.findIndex((ticket) => ticket.id === nextTicket.id);
      if (index < 0) return sortTickets([nextTicket, ...prev]);

      const cloned = [...prev];
      cloned[index] = { ...cloned[index], ...nextTicket };
      return sortTickets(cloned);
    });
  }, []);

  const fetchTicketDetail = useCallback(async (ticketId) => {
    if (!ticketId) {
      setSelectedDetail(null);
      return;
    }

    const response = await api(`/api/v1/escalation_tickets/${ticketId}`);
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error || "Failed to load escalation details.");
    }

    setSelectedDetail(payload);
  }, []);

  const fetchTickets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await api("/api/v1/escalation_tickets");
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to load escalations.");
      }

      const nextTickets = sortTickets(payload || []);
      setTickets(nextTickets);

      const candidateId = selectedTicketIdRef.current;
      const stillExists = nextTickets.some((item) => item.id === candidateId);
      const nextSelected = stillExists ? candidateId : nextTickets[0]?.id || null;
      setSelectedTicketId(nextSelected);
    } catch (err) {
      setError(err?.message || "Failed to load escalations.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRealtimePayload = useCallback(
    (payload) => {
      if (!payload || !payload.event) return;

      if (payload.ticket) {
        upsertTicket(payload.ticket);
      }

      if (payload.event === "message_created" && payload.message) {
        setSelectedDetail((prev) => {
          if (!prev || prev.id !== payload.ticket?.id) return prev;
          const exists = prev.messages?.some((message) => message.id === payload.message.id);
          if (exists) return prev;
          return { ...prev, messages: [...(prev.messages || []), payload.message] };
        });
      }

      if (payload.event === "ticket_updated" && payload.ticket?.id === selectedTicketIdRef.current) {
        setSelectedDetail((prev) => {
          if (!prev) return prev;
          return { ...prev, status: payload.ticket.status, closed_at: payload.ticket.closed_at };
        });
      }
    },
    [upsertTicket]
  );

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (!selectedTicketId) {
      setSelectedDetail(null);
      return;
    }

    fetchTicketDetail(selectedTicketId).catch((err) => {
      setError(err?.message || "Failed to load escalation details.");
    });
  }, [selectedTicketId, fetchTicketDetail]);

  useEffect(() => {
    const consumer = getCableConsumer();

    const inboxSubscription = consumer.subscriptions.create(
      { channel: "EscalationInboxChannel" },
      {
        received: (payload) => handleRealtimePayload(payload),
      }
    );

    return () => {
      inboxSubscription.unsubscribe();
    };
  }, [handleRealtimePayload]);

  useEffect(() => {
    if (!selectedTicketId) return undefined;

    const consumer = getCableConsumer();
    const ticketSubscription = consumer.subscriptions.create(
      { channel: "EscalationTicketChannel", ticket_id: selectedTicketId },
      {
        received: (payload) => handleRealtimePayload(payload),
      }
    );

    return () => {
      ticketSubscription.unsubscribe();
    };
  }, [selectedTicketId, handleRealtimePayload]);

  const filteredTickets = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();
    if (!keyword) return tickets;

    return tickets.filter((ticket) => {
      const haystack = [
        ticket.ticket_code,
        ticket.subject,
        ticket.student?.full_name,
        ticket.latest_message_preview,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(keyword);
    });
  }, [tickets, searchValue]);

  const canSend = useMemo(() => {
    if (!selectedDetail) return false;
    if (isStaff) return true;
    return selectedDetail.status === "open";
  }, [selectedDetail, isStaff]);

  const handleSendMessage = async () => {
    if (!selectedDetail || !newMessage.trim() || isSending) return;

    try {
      setIsSending(true);
      setError("");

      const response = await api(`/api/v1/escalation_tickets/${selectedDetail.id}/messages`, {
        method: "POST",
        body: JSON.stringify({
          escalation_message: {
            body: newMessage.trim(),
          },
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          (payload?.errors instanceof Array && payload.errors[0]) || payload?.error || "Failed to send message."
        );
      }

      setSelectedDetail((prev) => {
        if (!prev) return prev;
        const exists = prev.messages?.some((message) => message.id === payload.id);
        if (exists) return prev;
        return { ...prev, messages: [...(prev.messages || []), payload] };
      });
      setNewMessage("");
    } catch (err) {
      setError(err?.message || "Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };

  const handleToggleTicketStatus = async () => {
    if (!selectedDetail || !isStaff || isTogglingStatus) return;

    const action = selectedDetail.status === "open" ? "close" : "reopen";

    try {
      setIsTogglingStatus(true);
      setError("");

      const response = await api(`/api/v1/escalation_tickets/${selectedDetail.id}/${action}`, {
        method: "PATCH",
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to update ticket status.");
      }

      setSelectedDetail(payload);
      upsertTicket({
        id: payload.id,
        ticket_code: payload.ticket_code,
        subject: payload.subject,
        status: payload.status,
        student: payload.student,
        latest_message_preview: payload.messages?.[payload.messages.length - 1]?.body || "",
        latest_message_at: payload.messages?.[payload.messages.length - 1]?.created_at || payload.updated_at,
        closed_at: payload.closed_at,
        created_at: payload.created_at,
        updated_at: payload.updated_at,
      });
    } catch (err) {
      setError(err?.message || "Failed to update ticket status.");
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!composeSubject.trim() || isCreatingTicket) return;

    try {
      setIsCreatingTicket(true);
      setError("");

      const response = await api("/api/v1/escalation_tickets", {
        method: "POST",
        body: JSON.stringify({
          escalation_ticket: {
            subject: composeSubject.trim(),
            message: composeMessage.trim(),
          },
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(
          (payload?.errors instanceof Array && payload.errors[0]) || payload?.error || "Failed to create ticket."
        );
      }

      setIsComposeOpen(false);
      setComposeSubject("");
      setComposeMessage("");
      setSelectedTicketId(payload.id);
      setSelectedDetail(payload);
      upsertTicket({
        id: payload.id,
        ticket_code: payload.ticket_code,
        subject: payload.subject,
        status: payload.status,
        student: payload.student,
        latest_message_preview: payload.messages?.[payload.messages.length - 1]?.body || "",
        latest_message_at: payload.messages?.[payload.messages.length - 1]?.created_at || payload.updated_at,
        closed_at: payload.closed_at,
        created_at: payload.created_at,
        updated_at: payload.updated_at,
      });
    } catch (err) {
      setError(err?.message || "Failed to create ticket.");
    } finally {
      setIsCreatingTicket(false);
    }
  };

  return (
    <div className="container-xxl flex-grow-1 py-4">
      <div className="row g-3">
        <div className="col-12 col-xl-5">
          <div className="panel h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="m-0 fw-bold">{isStaff ? "Escalation Queue" : "My Escalations"}</h5>
            </div>

            <div className="d-flex gap-2 mb-3">
              <input
                type="text"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                className="form-control shadow-none"
                placeholder="Search ticket, subject, student..."
              />
              <button type="button" className="btn btn-outline-secondary" onClick={fetchTickets}>
                <i className="bx bx-refresh"></i>
              </button>
            </div>

            {isLoading ? <p className="small text-muted">Loading escalations...</p> : null}
            {!isLoading && filteredTickets.length === 0 ? <p className="small text-muted">No escalations found.</p> : null}

            <div className="d-flex flex-column gap-2 ticket-list">
              {filteredTickets.map((ticket) => {
                const isActive = selectedTicketId === ticket.id;
                return (
                  <button
                    key={ticket.id}
                    type="button"
                    className={`ticket-item text-start ${isActive ? "active" : ""}`}
                    onClick={() => setSelectedTicketId(ticket.id)}
                  >
                    <div className="d-flex justify-content-between gap-2">
                      <div className="small fw-semibold">{ticket.ticket_code}</div>
                      <span className={`badge rounded-pill ${ticket.status === "open" ? "text-bg-primary" : "text-bg-secondary"}`}>
                        {ticket.status === "open" ? "Open" : "Closed"}
                      </span>
                    </div>
                    <div className="mt-1 fw-semibold text-truncate">{ticket.subject}</div>
                    {isStaff && <div className="small text-muted">{ticket.student?.full_name || "Student"}</div>}
                    <div className="small text-muted text-truncate">{ticket.latest_message_preview || "No messages yet."}</div>
                    <div className="small text-muted">{toDateTime(ticket.latest_message_at || ticket.created_at)}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-7">
          <div className="panel h-100">
            {!selectedDetail ? (
              <div className="h-100 d-flex align-items-center justify-content-center text-muted">Select a ticket to view messages.</div>
            ) : (
              <>
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                  <div>
                    <div className="small fw-semibold text-primary">{selectedDetail.ticket_code}</div>
                    <h5 className="m-0">{selectedDetail.subject}</h5>
                    {isStaff && <div className="small text-muted">{selectedDetail.student?.full_name}</div>}
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className={`badge rounded-pill ${selectedDetail.status === "open" ? "text-bg-primary" : "text-bg-secondary"}`}>
                      {selectedDetail.status === "open" ? "Ticket Open" : "Ticket Closed"}
                    </span>
                    {isStaff && (
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={handleToggleTicketStatus}
                        disabled={isTogglingStatus}
                      >
                        {selectedDetail.status === "open" ? "Close Ticket" : "Reopen Ticket"}
                      </button>
                    )}
                  </div>
                </div>

                <hr />

                <div className="messages-area mb-3">
                  {(selectedDetail.messages || []).map((message) => {
                    const isMine = message.sender?.id === currentUser?.id;
                    return (
                      <div key={message.id} className={`message-row ${isMine ? "mine" : ""}`}>
                        {!isMine && (
                          <img
                            src={normalizeAvatarUrl(message.sender?.avatar_url)}
                            alt={message.sender?.full_name || "User avatar"}
                            className="message-avatar"
                          />
                        )}
                        <div className={`message-bubble ${isMine ? "mine" : ""}`}>
                          <div className="d-flex justify-content-between align-items-center gap-3 mb-1">
                            <strong className="small">{isMine ? "You" : message.sender?.full_name}</strong>
                            <span className="small text-muted">{toDateTime(message.created_at)}</span>
                          </div>
                          <div className="small text-wrap">{message.body}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!canSend && !isStaff ? (
                  <div className="alert alert-warning py-2 small">
                    This ticket is closed. You can no longer send messages unless staff reopens it.
                  </div>
                ) : null}

                <div className="d-flex gap-2">
                  <input
                    type="text"
                    className="form-control shadow-none"
                    placeholder={canSend ? "Reply..." : "Messaging disabled"}
                    value={newMessage}
                    onChange={(event) => setNewMessage(event.target.value)}
                    disabled={!canSend || isSending}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <button type="button" className="btn btn-primary" onClick={handleSendMessage} disabled={!canSend || isSending}>
                    <i className="bx bxs-send"></i>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {error ? <div className="alert alert-danger mt-3 py-2">{error}</div> : null}

      {isComposeOpen && !isStaff && (
        <div className="compose-overlay">
          <div className="compose-card">
            <h5 className="fw-bold mb-3">Create Escalation Ticket</h5>
            <div className="mb-2">
              <label className="form-label small fw-semibold mb-1">Subject</label>
              <input
                type="text"
                className="form-control"
                value={composeSubject}
                onChange={(event) => setComposeSubject(event.target.value)}
                placeholder="Urgent deadline requirement"
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold mb-1">Initial Message</label>
              <textarea
                className="form-control"
                rows={4}
                value={composeMessage}
                onChange={(event) => setComposeMessage(event.target.value)}
                placeholder="Explain your concern..."
              />
            </div>
            <div className="d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-outline-secondary" onClick={() => setIsComposeOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleCreateTicket} disabled={isCreatingTicket}>
                {isCreatingTicket ? "Creating..." : "Create Ticket"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .panel {
          background: #e9edf8;
          border-radius: 14px;
          padding: 1rem;
          min-height: 560px;
        }
        .ticket-list {
          max-height: 520px;
          overflow: auto;
          padding-right: 0.2rem;
        }
        .ticket-item {
          border: 1px solid #dbe1f5;
          border-radius: 12px;
          background: #fff;
          padding: 0.75rem;
          transition: 0.15s ease;
        }
        .ticket-item.active {
          border-color: #1f47b7;
          box-shadow: 0 0 0 1px #1f47b7 inset;
          background: #eef2ff;
        }
        .messages-area {
          max-height: 380px;
          overflow: auto;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .message-row {
          display: flex;
          gap: 0.5rem;
          align-items: flex-start;
        }
        .message-row.mine {
          justify-content: flex-end;
        }
        .message-avatar {
          width: 32px;
          height: 32px;
          border-radius: 999px;
          object-fit: cover;
        }
        .message-bubble {
          background: #f4f6ff;
          border-radius: 12px;
          padding: 0.6rem 0.75rem;
          max-width: 80%;
        }
        .message-bubble.mine {
          background: #e1ecff;
        }
        .compose-overlay {
          position: fixed;
          inset: 0;
          background: rgba(17, 24, 39, 0.55);
          z-index: 1080;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        .compose-card {
          width: 100%;
          max-width: 520px;
          background: #fff;
          border-radius: 12px;
          padding: 1rem;
        }
      `}</style>
    </div>
  );
}
