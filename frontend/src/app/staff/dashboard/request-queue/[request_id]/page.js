"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import formatMoney from "@/lib/formatMoney";
import ShowAlert from "@/lib/show-alert";

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

const TIMELINE_SELECT_OPTIONS = [
  "request_processed",
  "request_forwarded_to_head_office",
  "waiting_for_approval",
  "approved_by_head_office",
  "declined_by_head_office",
  "ready_for_shipping",
  "ready_for_pick_up",
  "document_shipped",
  "completed",
];

function formatTimelineDate(value) {
  if (!value) return "--/--/--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--/--/--";
  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
  }).format(date);
}

function formatTimelineTime(value) {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function formatPaymentMethod(value) {
  return value === "online" ? "Online Payment" : "Cash";
}

function formatPaymentStatus(value) {
  if (value === "paid") return { label: "Paid", className: "text-success" };
  if (value === "under_review") return { label: "Under Review", className: "text-warning" };
  return { label: "Not Paid", className: "text-danger" };
}

function formatDeliveryMethod(value) {
  return value === "courier_delivery" ? "Courier Delivery" : "Self Pick-up";
}

function withApiBase(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
  return `${apiBase}${url}`;
}

function findFileUrl(payload, keys) {
  for (const key of keys) {
    const value = payload?.[key];
    if (!value) continue;

    if (typeof value === "string") return withApiBase(value);
    if (typeof value === "object" && typeof value.url === "string") return withApiBase(value.url);
  }

  return "";
}

export default function StaffRequestQueueDetailPage() {
  const params = useParams();
  const requestId = params?.request_id;

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newTimelineType, setNewTimelineType] = useState("");
  const [markOnHold, setMarkOnHold] = useState(false);
  const [markClosed, setMarkClosed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalFile, setModalFile] = useState({ title: "", url: "" });

  const fetchRequest = useCallback(async () => {
    if (!requestId) return;

    try {
      setLoading(true);
      setError("");
      const response = await api(`/api/v1/document_requests/${requestId}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to load request.");
      }

      setRequest(payload);
    } catch (fetchError) {
      setError(fetchError?.message || "Failed to load request.");
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  const timelineEntries = useMemo(() => {
    const list = Array.isArray(request?.request_time_lines) ? request.request_time_lines : [];
    const sorted = [...list].sort(
      (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime(),
    );

    return sorted.map((entry) => ({
      id: entry.id,
      type: entry.type,
      label: TIMELINE_LABELS[entry.type] || entry.type?.replaceAll("_", " ") || "Update",
      created_at: entry.created_at,
    }));
  }, [request?.request_time_lines]);

  const hasCompletedTimeline = timelineEntries.some((entry) => entry.type === "completed");

  const items = Array.isArray(request?.request_items) ? request.request_items : [];
  const subtotalCents = items.reduce((sum, item) => {
    const lineTotal = item.line_total_cents ?? Number(item.quantity || 0) * Number(item.unit_price_cents || 0);
    return sum + Number(lineTotal || 0);
  }, 0);
  const totalCents = Number(request?.total_cents ?? subtotalCents + Number(request?.shipping_fee_cents || 0));

  const paymentStatus = formatPaymentStatus(request?.payment_status);
  const isOnlinePayment = request?.payment_method === "online";
  const verificationPhotoUrl = findFileUrl(request, [
    "id_verification_photo_url",
    "id_verification_photo",
    "verification_photo_url",
  ]);
  const receiptUrl = findFileUrl(request, ["payment_receipt_url", "payment_receipt", "receipt_url"]);

  const handleAddTimeline = async () => {
    if (!requestId || !request) return;

    if (!newTimelineType && !markOnHold && !markClosed) {
      await ShowAlert({
        icon: "error",
        title: "No Changes Selected",
        text: "Choose a timeline update or mark the request on hold/closed.",
      });
      return;
    }

    try {
      setSubmitting(true);

      if (newTimelineType) {
        const timelineResponse = await api(`/api/v1/document_requests/${requestId}/request_time_lines`, {
          method: "POST",
          body: JSON.stringify({
            request_time_line: { type: newTimelineType },
          }),
        });

        if (!timelineResponse.ok) {
          const payload = await timelineResponse.json();
          throw new Error(payload?.error || "Failed to add timeline.");
        }
      }

      if (markOnHold) {
        const statusResponse = await api(`/api/v1/document_requests/${requestId}`, {
          method: "PATCH",
          body: JSON.stringify({
            document_request: { status: "on_hold" },
          }),
        });
        if (!statusResponse.ok) {
          const payload = await statusResponse.json();
          throw new Error(payload?.error || "Failed to set request on hold.");
        }

        const holdTimelineResponse = await api(`/api/v1/document_requests/${requestId}/request_time_lines`, {
          method: "POST",
          body: JSON.stringify({
            request_time_line: { type: "request_on_hold" },
          }),
        });
        if (!holdTimelineResponse.ok) {
          const payload = await holdTimelineResponse.json();
          throw new Error(payload?.error || "Failed to log on hold timeline.");
        }
      }

      if (markClosed) {
        const statusResponse = await api(`/api/v1/document_requests/${requestId}`, {
          method: "PATCH",
          body: JSON.stringify({
            document_request: { status: "closed" },
          }),
        });
        if (!statusResponse.ok) {
          const payload = await statusResponse.json();
          throw new Error(payload?.error || "Failed to close request.");
        }

        const closeTimelineResponse = await api(`/api/v1/document_requests/${requestId}/request_time_lines`, {
          method: "POST",
          body: JSON.stringify({
            request_time_line: { type: "request_closed" },
          }),
        });
        if (!closeTimelineResponse.ok) {
          const payload = await closeTimelineResponse.json();
          throw new Error(payload?.error || "Failed to log close timeline.");
        }
      }

      setNewTimelineType("");
      setMarkOnHold(false);
      setMarkClosed(false);
      await fetchRequest();
    } catch (submitError) {
      await ShowAlert({
        icon: "error",
        title: "Update Failed",
        text: submitError?.message || "Unable to update request timeline.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openFileModal = (title, url) => {
    setModalFile({
      title,
      url,
    });
  };

  return (
    <div className="px-12 flex-grow-1 py-4 request-queue-detail-page">
      <div>
        {loading ? (
          <div className="rqd-state">Loading request details...</div>
        ) : error ? (
          <div className="rqd-state rqd-state-error">{error}</div>
        ) : !request ? (
          <div className="rqd-state">Request not found.</div>
        ) : (
          <div className="row g-4">
            <div className="col-12 col-xl-6">
              <div className="rqd-left p-5">
                <Link href="/staff/dashboard/request-queue" className="rqd-back-link">
                  <i className="bx bx-left-arrow-alt" aria-hidden="true"></i>
                  Go back to Queue
                </Link>

                <div className="d-flex align-items-center justify-content-between mt-12 mb-4">
                  <p className="mb-0 fw-semibold text-dark">
                    Request ID: <span className="fw-normal">{request.request_id || `RID${request.id}`}</span>
                  </p>
                  <span className="rqd-status-chip">{request.status?.replaceAll("_", " ") || "processing"}</span>
                </div>

                <div className="rqd-timeline">
                  {timelineEntries.map((entry, index) => (
                    <div className="rqd-timeline-row" key={entry.id || `${entry.type}-${index}`}>
                      <div className="rqd-timeline-date">{formatTimelineDate(entry.created_at)}</div>
                      <div className={`rqd-timeline-marker ${index === timelineEntries.length - 1 ? "last" : ""}`}></div>
                      <div className="rqd-timeline-label">{entry.label}</div>
                      <div className="rqd-timeline-time text-end">{formatTimelineTime(entry.created_at)}</div>
                    </div>
                  ))}

                  {!hasCompletedTimeline ? (
                    <div className="rqd-timeline-row rqd-timeline-placeholder">
                      <div className="rqd-timeline-date"></div>
                      <div className="rqd-timeline-marker last pending"></div>
                      <div className="rqd-timeline-label">Completed</div>
                      <div className="rqd-timeline-time"></div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="col-12 col-xl-6">
              <div className="rqd-right bg-white rounded-3">
                <p className="rqd-section-title">Add timeline</p>

                <div className="d-flex gap-2 mb-4">
                  <select
                    className="form-select rqd-select"
                    value={newTimelineType}
                    onChange={(event) => setNewTimelineType(event.target.value)}
                    disabled={submitting}
                  >
                    <option value="">Please Select...</option>
                    {TIMELINE_SELECT_OPTIONS.map((type) => (
                      <option key={type} value={type}>
                        {TIMELINE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="rqd-add-btn" onClick={handleAddTimeline} disabled={submitting}>
                    {submitting ? "Saving..." : "Add"}
                  </button>
                </div>

                <hr className="my-4" />
                <p className="rqd-section-title text-info">Status</p>

                <label className="rqd-check-row">
                  <input
                    type="checkbox"
                    checked={markOnHold}
                    onChange={(event) => setMarkOnHold(event.target.checked)}
                    disabled={submitting}
                  />
                  <span>Put Request On Hold</span>
                </label>

                <label className="rqd-check-row mb-4">
                  <input
                    type="checkbox"
                    checked={markClosed}
                    onChange={(event) => setMarkClosed(event.target.checked)}
                    disabled={submitting}
                  />
                  <span>Close Request</span>
                </label>


                <hr className="my-4" />
                <p className="rqd-section-title text-info">Payment</p>

                <div className="rqd-info-list">

                  <p><strong>Payment Method:</strong> {formatPaymentMethod(request.payment_method)}</p>
                  <p>
                    <strong>Payment Status:</strong>{" "}
                    <span className={paymentStatus.className}>{paymentStatus.label}</span>
                  </p>

                  {isOnlinePayment ? (
                    <p>
                      <strong>Receipt:</strong>{" "}
                      {receiptUrl ? (
                        <button
                          type="button"
                          className="rqd-file-btn"
                          data-bs-toggle="modal"
                          data-bs-target="#request-file-preview-modal"
                          onClick={() => openFileModal("Receipt", receiptUrl)}
                        >
                          View file
                        </button>
                      ) : (
                        "Unavailable"
                      )}
                    </p>
                  ) : null}
                </div>

                <hr className="my-4" />
                <p className="rqd-section-title text-info">Request Details</p>

                <div className="rqd-items-card">
                  {items.length === 0 ? (
                    <p className="mb-0 text-muted small">No request items.</p>
                  ) : (
                    <>
                      {items.map((item) => (
                        <div className="rqd-item-row" key={item.id || `${item.name}-${item.quantity}`}>
                          <span>{`${item.quantity || 0} x ${item.name || "Document"}`}</span>
                          <span>{formatMoney(Number(item.line_total_cents || 0))}</span>
                        </div>
                      ))}
                      <div className="rqd-total-row">
                        <span>Total:</span>
                        <span>{formatMoney(totalCents)}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="rqd-info-list">
                  <p><strong>Delivery Method:</strong> {formatDeliveryMethod(request.delivery_method)}</p>
                  <p><strong>Courier:</strong> {request.courier_name || "-"}</p>
                  <p><strong>Name of Student:</strong> {request.student_name || "-"}</p>
                  <p>
                    <strong>Verification Photo:</strong>{" "}
                    {verificationPhotoUrl ? (
                      <button
                        type="button"
                        className="rqd-file-btn"
                        data-bs-toggle="modal"
                        data-bs-target="#request-file-preview-modal"
                        onClick={() => openFileModal("Verification Photo", verificationPhotoUrl)}
                      >
                        View file
                      </button>
                    ) : (
                      "Unavailable"
                    )}
                  </p>
                </div>

                <Link href="/staff/dashboard/student-list" className="rqd-student-btn">
                  View Student Info
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="modal fade" id="request-file-preview-modal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{modalFile.title || "File Preview"}</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              {modalFile.url ? (
                <img
                  src={modalFile.url}
                  alt={modalFile.title || "File preview"}
                  className="rqd-file-preview-img"
                />
              ) : (
                <p className="mb-0 text-muted">No file available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
