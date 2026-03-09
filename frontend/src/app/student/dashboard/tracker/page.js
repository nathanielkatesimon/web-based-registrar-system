"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import formatMoney from "@/lib/formatMoney";

const ESCALATION_AGE_DAYS = 21;

const STATUS_META = {
  processing: { label: "Processing", color: "#1F2AA2" },
  completed: { label: "Completed", color: "#33A000" },
  on_hold: { label: "On Hold", color: "#A88900" },
  closed: { label: "Closed", color: "#E40000" },
};

const TIMELINE_LABELS = {
  request_submitted: "Request Submitted",
  request_opened: "Request Opened",
  request_processed: "Request Processed",
  request_forwarded_to_head_office: "Forwarded to Head Office",
  waiting_for_approval: "Waiting for Approval",
  approved_by_head_office: "Approved by Head Office",
  declined_by_head_office: "Declined by Head Office",
  ready_for_shipping: "Ready for Shipping",
  ready_for_pick_up: "Ready for Pick-up",
  document_shipped: "Document Shipped",
  completed: "Completed",
  request_on_hold: "Request on Hold",
  request_closed: "Request Closed",
};

const FILTER_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On Hold" },
  { value: "closed", label: "Closed" },
];

function formatRequestDate(value) {
  if (!value) return "Date unavailable";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatTimelineDate(value) {
  if (!value) return "--/--/--";
  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
  }).format(new Date(value));
}

function formatStatus(status) {
  return STATUS_META[status] || { label: "On Hold", color: "#A88900" };
}

function formatPaymentMethod(value) {
  if (value === "online") return "Online Payment";
  return "Cash";
}

function formatPaymentStatus(value) {
  if (value === "paid") return { label: "Paid", className: "text-success" };
  if (value === "under_review") return { label: "Under Review", className: "text-warning" };
  return { label: "Not Paid", className: "text-danger" };
}

function formatDeliveryMethod(value) {
  if (value === "courier_delivery") return "Courier Delivery";
  return "Office Visit / Self Pick-up";
}

function buildTimeline(timeLines = []) {
  return [...timeLines]
    .sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())
    .map((entry) => ({
      key: `${entry.id || entry.type}-${entry.created_at || "na"}`,
      type: entry.type,
      label: TIMELINE_LABELS[entry.type] || entry.type?.replaceAll("_", " ") || "Update",
      createdAt: entry.created_at,
    }));
}

function getStatusReasonNote(request) {
  if (!request) return "";

  if (request.inactivity) {
    if (request.status === "closed") {
      return "Your request was closed due to inactivity after more than 3 weeks without updates. Please submit a new request if you still need this document.";
    }

    return "This request is flagged for inactivity because it has no updates for more than 3 weeks. Please coordinate with your Registrar for the next steps.";
  }

  if (request.status !== "on_hold" && request.status !== "closed") return "";

  const hasUnpaidBill = Boolean(request.unpaid_bill);
  const hasMissingRequirements = Boolean(request.missing_requirements);

  if (hasUnpaidBill && hasMissingRequirements) {
    return "Your request cannot be processed at this time due to an unpaid bill and missing requirements. Please settle your payment and coordinate with your Registrar.";
  }

  if (hasUnpaidBill) {
    return "Your request cannot be processed at this time due to an unpaid bill. Please settle your payment first.";
  }

  if (hasMissingRequirements) {
    return "Your request cannot be processed at this time due to a missing requirement or a deficiency. Please settle and coordinate with your Registrar.";
  }

  return "";
}

export default function StudentDashboardTrackerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRequest = useMemo(() => searchParams.get("request")?.trim() || "", [searchParams]);
  const [requests, setRequests] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortByLatest, setSortByLatest] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEscalating, setIsEscalating] = useState(false);
  const [escalationMessage, setEscalationMessage] = useState("");
  const [escalationError, setEscalationError] = useState("");

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api("/api/v1/document_requests");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Failed to load requests.");
        }

        const list = Array.isArray(data) ? data : [];
        setRequests(list);
      } catch (fetchError) {
        setError(fetchError.message || "Failed to load requests.");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const sortedRequests = useMemo(
    () =>
      [...requests].sort((a, b) => {
        if (a.created_at && b.created_at) {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return (b.id || 0) - (a.id || 0);
      }),
    [requests]
  );

  const filteredRequests = useMemo(() => {
    const searchLower = search.trim().toLowerCase();
    const sourceRequests = sortByLatest ? sortedRequests : requests;

    return sourceRequests.filter((request) => {
      const requestId = (request.request_id || "").toLowerCase();
      const matchesSearch = requestId.includes(searchLower);
      const matchesStatus = statusFilter === "all" || request.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requests, search, sortedRequests, sortByLatest, statusFilter]);

  useEffect(() => {
    if (!requestedRequest || requests.length === 0) return;

    const normalizedRequestedValue = requestedRequest.toLowerCase();
    const matchedRequest = requests.find((request) => {
      const requestCode = String(request.request_id || "").toLowerCase();
      const requestNumericId = String(request.id || "");
      return requestCode === normalizedRequestedValue || requestNumericId === requestedRequest;
    });

    if (!matchedRequest) return;

    setStatusFilter("all");
    setSearch(matchedRequest.request_id || String(matchedRequest.id));
    setSelectedRequestId(matchedRequest.id);
  }, [requestedRequest, requests]);

  useEffect(() => {
    if (filteredRequests.length === 0) {
      setSelectedRequestId(null);
      return;
    }

    const stillExists = filteredRequests.some((request) => request.id === selectedRequestId);
    if (!stillExists) {
      setSelectedRequestId(filteredRequests[0].id);
    }
  }, [filteredRequests, selectedRequestId]);

  const selectedRequest = useMemo(
    () => filteredRequests.find((request) => request.id === selectedRequestId) || null,
    [filteredRequests, selectedRequestId]
  );

  const selectedTimeline = useMemo(
    () => buildTimeline(selectedRequest?.request_time_lines || []),
    [selectedRequest]
  );
  const showCompletionPlaceholder = !!selectedRequest && !["completed", "closed"].includes(selectedRequest.status);

  const selectedItems = selectedRequest?.request_items || [];
  const subtotalCents = selectedItems.reduce((sum, item) => {
    const lineTotal =
      item.line_total_cents ?? (Number(item.quantity || 0) * Number(item.unit_price_cents || 0));
    return sum + Number(lineTotal || 0);
  }, 0);
  const shippingFeeCents = Number(selectedRequest?.shipping_fee_cents || 0);
  const totalCents = Number(selectedRequest?.total_cents ?? subtotalCents + shippingFeeCents);
  const statusFilterLabel =
    FILTER_OPTIONS.find((option) => option.value === statusFilter)?.label || "All Statuses";
  const selectedRequestCreatedAt = selectedRequest?.created_at ? new Date(selectedRequest.created_at) : null;
  const selectedRequestAgeDays = selectedRequestCreatedAt
    ? Math.floor((Date.now() - selectedRequestCreatedAt.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const selectedStatusNote = getStatusReasonNote(selectedRequest);
  const canEscalateSelectedRequest = Boolean(
    selectedRequest &&
      selectedRequestCreatedAt &&
      !["completed", "closed"].includes(selectedRequest.status) &&
      selectedRequestAgeDays > ESCALATION_AGE_DAYS
  );

  useEffect(() => {
    setEscalationMessage("");
    setEscalationError("");
  }, [selectedRequestId]);

  const handleEscalate = async () => {
    if (!selectedRequest || !canEscalateSelectedRequest || isEscalating) return;

    try {
      setIsEscalating(true);
      setEscalationMessage("");
      setEscalationError("");

      const existingTicketId = selectedRequest.escalation_ticket?.id;
      if (existingTicketId) {
        router.push(`/student/dashboard/escalations?ticket=${existingTicketId}`);
        return;
      }

      const requestId = selectedRequest.request_id || `#${selectedRequest.id}`;
      const response = await api("/api/v1/escalation_tickets", {
        method: "POST",
        body: JSON.stringify({
          escalation_ticket: {
            subject: `Follow-up on Request ${requestId}`,
            message: `I am following up on request ${requestId}. This request has been pending for more than 3 weeks.`,
            document_request_id: selectedRequest.id,
          },
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(
          (payload?.errors instanceof Array && payload.errors[0]) ||
            payload?.error ||
            "Failed to create escalation ticket."
        );
      }

      if (payload?.id) {
        setRequests((prev) =>
          prev.map((request) =>
            request.id === selectedRequest.id
              ? {
                  ...request,
                  escalation_ticket: {
                    id: payload.id,
                    ticket_code: payload.ticket_code,
                    status: payload.status,
                  },
                }
              : request
          )
        );
        router.push(`/student/dashboard/escalations?ticket=${payload.id}`);
        return;
      }

      setEscalationMessage(`Escalation ticket created: ${payload?.ticket_code || "submitted"}.`);
    } catch (createError) {
      setEscalationError(createError?.message || "Failed to create escalation ticket.");
    } finally {
      setIsEscalating(false);
    }
  };

  return (
    <div className="container-fluid px-4 p-lg-12 py-4" style={{ backgroundColor: "#EEF0FA", minHeight: "calc(100vh - 90px)" }}>
      <div className="row g-4">
        <div className="col-12 col-xl-6">
          <h4 className="fw-bold text-info mb-4">Request Queue</h4>

          <div className="d-flex align-items-center gap-2 mb-4">
            <div className="input-group flex-grow-1">
              <span className="input-group-text border-0 rounded-start-pill bg-white text-muted ps-4">
                <i className="bx bx-search"></i>
              </span>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="form-control border-0 rounded-end-pill py-3"
                placeholder="Enter Request ID"
                aria-label="Search request ID"
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
                  <button
                    type="button"
                    className={`dropdown-item rounded-2 ${sortByLatest ? "active" : ""}`}
                    onClick={() => {
                      setSortByLatest((prev) => !prev);
                      setShowFilters(false);
                    }}
                  >
                    Latest
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="d-flex align-items-center flex-wrap gap-3 mb-4">
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

            {sortByLatest ? (
              <button
                type="button"
                className="btn btn-sm border-0 text-white fw-semibold d-flex align-items-center gap-3"
                style={{ borderRadius: 999, backgroundColor: "#040F5F" }}
                onClick={() => setSortByLatest(false)}
              >
                <span>Latest</span>
                <i className="bx bx-x lh-1" />
              </button>
            ) : null}
          </div>

          {!loading && !error ? (
            <p className="text-muted mb-4 px-2">
              {filteredRequests.length} result{filteredRequests.length === 1 ? "" : "s"} found
            </p>
          ) : null}

          {loading ? <p className="text-muted">Loading requests...</p> : null}
          {error ? <p className="text-danger mb-0">{error}</p> : null}

          {!loading && !error && requests.length === 0 ? (
            <p className="text-muted text-center mb-0">Empty queue..</p>
          ) : null}

          {!loading && !error && requests.length > 0 && filteredRequests.length === 0 ? (
            <p className="text-muted mb-0">No matching requests found.</p>
          ) : null}

          <div className="d-flex flex-column gap-3">
            {filteredRequests.map((request) => {
              const statusMeta = formatStatus(request.status);
              const isActive = request.id === selectedRequestId;

              return (
                <button
                  key={request.id}
                  type="button"
                  className="btn text-start bg-white w-100 p-4"
                  onClick={() => setSelectedRequestId(request.id)}
                  style={{
                    borderRadius: 14,
                    border: isActive ? "2px solid #2E3FA8" : "1px solid transparent",
                    boxShadow: isActive ? "0 3px 10px rgba(46, 63, 168, 0.15)" : "none",
                  }}
                >
                  <div className="d-flex align-items-start justify-content-between w-100 gap-3">
                    <div className="text-primary">
                      <p className="mb-1 fw-semibold">
                        Request ID: <span className="fw-normal">{request.request_id || "Pending ID"}</span>
                      </p>
                      <p className="mb-0 small text-muted">{formatRequestDate(request.created_at)}</p>
                    </div>
                    <span className="fw-semibold" style={{ color: statusMeta.color }}>
                      {statusMeta.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="col-12 col-xl-6">
          <div className="bg-white rounded-3 p-4 p-lg-5">
            {!selectedRequest ? (
              <div className="h-100 d-flex flex-column align-items-center justify-content-center text-center text-muted">
                <h3 className="fw-bold text-muted mb-2">Nothing to show here</h3>
                <p className="mb-0">Select a request first</p>
              </div>
            ) : (
              <>
                <div className="d-flex align-items-start justify-content-between mb-4">
                  <p className="mb-0 fw-semibold text-primary">
                    Request ID: <span className="fw-normal">{selectedRequest.request_id || "Pending ID"}</span>
                  </p>
                  <span className="fw-semibold" style={{ color: formatStatus(selectedRequest.status).color }}>
                    {formatStatus(selectedRequest.status).label}
                  </span>
                </div>

                <div className="mb-4">
                  {selectedTimeline.length > 0 ? (
                    selectedTimeline.map((entry, index) => {
                      const isLast = index === selectedTimeline.length - 1 && !showCompletionPlaceholder;

                      return (
                        <div key={entry.key} className="d-flex align-items-start">
                          <div className="text-muted small" style={{ width: 70, paddingTop: 2 }}>
                            <div>{formatTimelineDate(entry.createdAt)}</div>
                          </div>
                          <div className="d-flex flex-column align-items-center me-3" style={{ minWidth: 16 }}>
                            <span
                              className="rounded-circle"
                              style={{
                                width: 10,
                                height: 10,
                                backgroundColor: "#1E2DA0",
                                marginTop: 4,
                              }}
                            />
                            {!isLast ? (
                              <span
                                style={{
                                  width: showCompletionPlaceholder && index === selectedTimeline.length - 1 ? 0 : 1,
                                  height: 28,
                                  backgroundColor: showCompletionPlaceholder && index === selectedTimeline.length - 1 ? "transparent" : "#1E2DA0",
                                  borderLeft: showCompletionPlaceholder && index === selectedTimeline.length - 1 ? "1px dashed #1E2DA0" : "none",
                                }}
                              />
                            ) : null}
                          </div>
                          <p className="mb-0 small" style={{ color: "#122787", paddingTop: 1 }}>
                            {entry.label}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-muted small mb-0">No timeline updates yet.</p>
                  )}

                  {showCompletionPlaceholder ? (
                    <div className="d-flex align-items-start">
                      <div className="text-muted small" style={{ width: 70, paddingTop: 2 }} />
                      <div className="d-flex flex-column align-items-center me-3" style={{ minWidth: 16 }}>
                        <span
                          className="rounded-circle"
                          style={{
                            width: 10,
                            height: 10,
                            border: "1px dashed #1E2DA0",
                            backgroundColor: "transparent",
                            marginTop: 4,
                          }}
                        />
                      </div>
                      <p className="mb-0 small text-muted" style={{ color: "#8C8C8C", paddingTop: 1 }}>
                        Completed
                      </p>
                    </div>
                  ) : null}
                </div>

                <hr className="my-4" />

                {selectedStatusNote ? (
                  <div className="small mt-3 mb-4 p-3 d-flex align-items-start" style={{ backgroundColor: "#F3F3F3", color: "#122787" }}>
                    <i className="bx bx-info-circle fs-5 me-1 text-danger"></i>
                    <p className="mb-0 text-primary">
                      <strong className="text-danger">Note: </strong>
                      {selectedStatusNote}
                    </p>
                  </div>
                ) : null}

                <div className="rounded-3 p-3 p-lg-4 mb-4" style={{ backgroundColor: "#F3F3F3" }}>
                  {selectedItems.length > 0 ? (
                    selectedItems.map((item, index) => {
                      const lineTotal =
                        item.line_total_cents ??
                        Number(item.quantity || 0) * Number(item.unit_price_cents || 0);

                      return (
                        <div className="d-flex align-items-center text-primary mb-2" key={`item-${index}`}>
                          <span>
                            {item.quantity || 0} x {item.name || "Document"}
                          </span>
                          <span className="ms-auto fw-semibold">{formatMoney(lineTotal || 0)}</span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-muted small mb-2">No matching requests found.</p>
                  )}

                  {selectedRequest.delivery_method === "courier_delivery" ? (
                    <div className="d-flex align-items-center text-primary mb-2">
                      <span>Shipping Fee</span>
                      <span className="ms-auto fw-semibold">{formatMoney(shippingFeeCents)}</span>
                    </div>
                  ) : null}

                  <div className="d-flex align-items-center fw-bold text-primary mt-3">
                    <span>Total:</span>
                    <span className="ms-auto">{formatMoney(totalCents)}</span>
                  </div>
                </div>

                <div className="small text-primary">
                  <p className="mb-2">
                    <strong>Payment Method:</strong> {formatPaymentMethod(selectedRequest.payment_method)}
                  </p>
                  <p className="mb-2">
                    <strong>Payment Status:</strong>{" "}
                    <span className={formatPaymentStatus(selectedRequest.payment_status).className}>
                      {formatPaymentStatus(selectedRequest.payment_status).label}
                    </span>
                  </p>
                  <p className="mb-2">
                    <strong>Delivery Method:</strong> {formatDeliveryMethod(selectedRequest.delivery_method)}
                  </p>
                  {selectedRequest.delivery_method == "courier_delivery" &&
                    <p className="mb-2">
                      <strong>Courier:</strong> {selectedRequest.courier_name}
                    </p>
                  }
                  <p className="mb-0">
                    <strong>ETA:</strong> {selectedRequest.status === "completed" ? "Completed" : "2 - 3 weeks"}
                  </p>
                </div>

                {canEscalateSelectedRequest ? (
                  <>
                    <button
                      type="button"
                      className="btn w-100 text-white fw-semibold mt-4"
                      style={{ backgroundColor: "#040F5F", borderRadius: 4 }}
                      onClick={handleEscalate}
                      disabled={isEscalating}
                    >
                      {isEscalating ? "Escalating..." : "Escalate"}
                    </button>

                    <div className="small mt-3 p-3 d-flex align-items-start" style={{ backgroundColor: "#F3F3F3", color: "#122787" }}>
                      <i className="bx bx-info-circle fs-5 me-1 text-info"></i>
                      <p className="mb-0 text-primary">
                        <strong className="text-info">Note:</strong> This request has exceeded the estimated turnaround time. You may send
                        an escalation to the registrar staff regarding this matter.
                      </p>
                    </div>
                  </>
                ) : null}

                {escalationMessage ? <p className="small text-success mt-3 mb-0">{escalationMessage}</p> : null}
                {escalationError ? <p className="small text-danger mt-3 mb-0">{escalationError}</p> : null}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
