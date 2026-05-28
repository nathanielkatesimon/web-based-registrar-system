"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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

const FILTER_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

export default function EscalationBoard({ role }) {
  const searchParams = useSearchParams();
  const { currentUser } = useSessionStore();
  const isStaff = role === "Staff";
  const requestedTicketId = useMemo(() => {
    const rawValue = searchParams.get("ticket");
    if (!rawValue || !/^\d+$/.test(rawValue)) return null;
    return Number(rawValue);
  }, [searchParams]);

  const [tickets, setTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const [composeSubject, setComposeSubject] = useState("");
  const [composeMessage, setComposeMessage] = useState("");
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);

  const selectedTicketIdRef = useRef(null);
  const messagesAreaRef = useRef(null);
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

      const candidateId = selectedTicketIdRef.current || requestedTicketId;
      const stillExists = nextTickets.some((item) => item.id === candidateId);
      const nextSelected = stillExists ? candidateId : nextTickets[0]?.id || null;
      setSelectedTicketId(nextSelected);
    } catch (err) {
      setError(err?.message || "Failed to load escalations.");
    } finally {
      setIsLoading(false);
    }
  }, [requestedTicketId]);

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
          return {
            ...prev,
            status: payload.ticket.status,
            closed_at: payload.ticket.closed_at,
            assigned_staff: payload.ticket.assigned_staff !== undefined
              ? payload.ticket.assigned_staff
              : prev.assigned_staff,
          };
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

  useEffect(() => {
    if (!selectedDetail) return;
    if (!messagesAreaRef.current) return;

    messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
  }, [selectedTicketId, selectedDetail?.messages?.length]);

  const filteredTickets = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();

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

      const matchesSearch = !keyword || haystack.includes(keyword);
      const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchValue, statusFilter]);

  const statusFilterLabel =
    FILTER_OPTIONS.find((option) => option.value === statusFilter)?.label || "All Statuses";

  useEffect(() => {
    if (filteredTickets.length === 0) {
      setSelectedTicketId(null);
      return;
    }

    const stillExists = filteredTickets.some((ticket) => ticket.id === selectedTicketId);
    if (!stillExists) {
      setSelectedTicketId(filteredTickets[0].id);
    }
  }, [filteredTickets, selectedTicketId]);

  const isAssignedStaff = useMemo(
    () => isStaff && selectedDetail?.assigned_staff?.id === currentUser?.id,
    [isStaff, selectedDetail, currentUser]
  );

  const canSend = useMemo(() => {
    if (!selectedDetail) return false;
    if (isStaff) return isAssignedStaff;
    return selectedDetail.status === "open";
  }, [selectedDetail, isStaff, isAssignedStaff]);

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
    <div className="flex-grow-1 p-4">
      <div className="row g-3">
        <div className="col-12 col-xl-5">
          <div className="panel h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="m-0 fw-bold text-info">{isStaff ? "Escalation Queue" : "My Escalations"}</h5>
            </div>

            <div className="d-flex gap-2 mb-3">
              <div className="input-group flex-grow-1">
                <span className="input-group-text border-0 rounded-start-pill bg-white text-muted ps-4">
                  <i className="bx bx-search"></i>
                </span>
                <input
                  type="text"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  className="form-control border-0 rounded-end-pill py-3"
                  placeholder="Enter Escalation ID"
                  aria-label="Search escalation"
                />
              </div>

              <div className="position-relative">
                <button
                  type="button"
                  className="btn bg-white text-primary d-flex align-items-center justify-content-center"
                  style={{ width: 44, height: 44, borderRadius: 12 }}
                  onClick={() => setShowFilters((prev) => !prev)}
                >
                  <i className="bx bx-slider-alt"></i>
                </button>

                {showFilters ? (
                  <div
                    className="position-absolute end-0 mt-2 bg-white rounded-3 shadow-sm border p-2"
                    style={{ minWidth: 220, zIndex: 5 }}
                  >
                    <p className="small text-muted px-2 mb-2">Status</p>
                    {FILTER_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`dropdown-item rounded-2 ${statusFilter === option.value ? "active" : ""}`}
                        onClick={() => {
                          setStatusFilter(option.value);
                          setShowFilters(false);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="d-flex align-items-center flex-wrap gap-3 mb-3">
              {statusFilter !== "all" ? (
                <button
                  type="button"
                  className="btn btn-sm border-0 text-white fw-semibold d-flex align-items-center gap-3"
                  style={{ borderRadius: 999, backgroundColor: "#040F5F" }}
                  onClick={() => setStatusFilter("all")}
                >
                  <span>{statusFilterLabel}</span>
                  <i className="bx bx-x lh-1" />
                </button>
              ) : null}

            </div>

            {!isLoading ? (
              <p className="text-muted mb-3 px-2">
                {filteredTickets.length} result{filteredTickets.length === 1 ? "" : "s"} found
              </p>
            ) : null}

            {isLoading ? <p className="small text-muted">Loading escalations...</p> : null}
            {!isLoading && filteredTickets.length === 0 ? <p className="small text-muted my-12 text-center">No escalations found.</p> : null}

            <div className="d-flex flex-column gap-2 ticket-list">
              {filteredTickets.map((ticket) => {
                const isActive = selectedTicketId === ticket.id;
                return (
                  <button
                    key={ticket.id}
                    type="button"
                    className={`ticket-item border-0 bg-white text-start ${isActive ? "active" : ""}`}
                    onClick={() => setSelectedTicketId(ticket.id)}
                  >
                    <div className="d-flex justify-content-between gap-2">
                      <div className="fw-semibold"><strong>Escalation ID: </strong>{ticket.ticket_code}</div>
                      <span className={`badge rounded-pill ${ticket.status === "open" ? "text-bg-primary" : "text-bg-secondary"}`}>
                        {ticket.status === "open" ? "Open" : "Closed"}
                      </span>
                    </div>
                    <div className="small text-muted text-truncate">{ticket.subject}</div>
                    {isStaff && <div className="small text-muted">{ticket.student?.full_name || "Student"}</div>}
                    {isStaff && (
                      <div className="small text-muted">
                        {ticket.assigned_staff
                          ? `Handler: ${ticket.assigned_staff.full_name}`
                          : <span className="badge text-bg-warning fw-normal">Unassigned</span>}
                      </div>
                    )}
                    <div className="small text-muted">{toDateTime(ticket.created_at)}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-7">
          <div className="p-4 rounded-3 d-flex flex-column bg-white" style={{height: "80vh"}}>
            {!selectedDetail ? (
              <div className="h-100 d-flex align-items-center justify-content-center text-muted">Select a ticket to view messages.</div>
            ) : (
              <>
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                  <div>
                    <div className="small fw-semibold text-primary">Escalation ID: {selectedDetail.ticket_code}</div>
                      <h5 className="m-0">
                        {selectedDetail.document_request ? (
                          <>
                            <span>Follow-up on Request ID </span>
                            {!isStaff ? (
                              <Link
                                href={`/student/dashboard/tracker?request=${encodeURIComponent(String(selectedDetail.document_request.request_id || selectedDetail.document_request.id))}`}
                                className="text-decoration-underline"
                              >
                                {selectedDetail.document_request.request_id || `#${selectedDetail.document_request.id}`}
                              </Link>
                            ) : (
                              <span>{selectedDetail.document_request.request_id || `#${selectedDetail.document_request.id}`}</span>
                            )}
                          </>
                        ) : null}
                        
                      </h5>
                    {isStaff && <div className="small text-muted">{selectedDetail.student?.full_name}</div>}
                    {isStaff && (
                      <div className="small text-muted mt-1">
                        {selectedDetail.assigned_staff
                          ? <>Handler: <strong>{selectedDetail.assigned_staff.full_name}</strong></>
                          : <span className="text-warning fw-semibold">Unassigned</span>}
                      </div>
                    )}
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className={`badge rounded-pill ${selectedDetail.status === "open" ? "text-bg-primary" : "text-bg-secondary"}`}>
                      {selectedDetail.status === "open" ? "Ticket Open" : "Ticket Closed"}
                    </span>
                    {isAssignedStaff && (
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

                <div ref={messagesAreaRef} className="messages-area mb-3 h-100">
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
                        <div className={`message-bubble ${isMine ? "mine me-2" : "ms-2"}`}>
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

                {isStaff && selectedDetail.assigned_staff && !isAssignedStaff ? (
                  <div className="alert alert-info py-2 small mb-2">
                    This ticket is assigned to <strong>{selectedDetail.assigned_staff.full_name}</strong>. You can view but not interact.
                  </div>
                ) : null}
                {!canSend && !isStaff ? (
                  <div className="alert alert-warning py-2 small">
                    This ticket is closed. You can no longer send messages unless staff reopens it.
                  </div>
                ) : null}

                <div className="d-flex gap-2">
                  <input
                    type="text"
                    className="form-control bg-light border-0 rounded-pill py-3"
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
                  <button type="button" className="btn btn-info" style={{borderRadius: 12, width: 40, height: 40}} onClick={handleSendMessage} disabled={!canSend || isSending}>
                    <i className="bx bx-paper-plane"></i>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {error ? <div className="alert alert-danger mt-3 py-2">{error}</div> : null}

      <style jsx>{`
        .panel {
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
