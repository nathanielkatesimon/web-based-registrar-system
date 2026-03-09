"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import formatMoney from "@/lib/formatMoney";
import ShowAlert from "@/lib/show-alert";
import InitBootstrapSelect from "@/components/initializer/init-bootstrap-select";

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
  "request_forwarded_to_head_office",
  "waiting_for_approval",
  "approved_by_head_office",
  "declined_by_head_office",
  "ready_for_shipping",
  "ready_for_pick_up",
  "document_shipped",
];

const STATUS_SELECT_OPTIONS = [
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On Hold" },
  { value: "closed", label: "Closed" },
];
const DEFAULT_STATUS = STATUS_SELECT_OPTIONS[0].value;

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
  const [selectedStatus, setSelectedStatus] = useState(DEFAULT_STATUS);
  const [reasonUnpaidBill, setReasonUnpaidBill] = useState(false);
  const [reasonMissingRequirements, setReasonMissingRequirements] = useState(false);
  const [reasonInactivity, setReasonInactivity] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [updatingPaymentStatus, setUpdatingPaymentStatus] = useState(false);
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

  useEffect(() => {
    if (!request) return;
    setSelectedStatus(request.status || DEFAULT_STATUS);
    setReasonUnpaidBill(Boolean(request.unpaid_bill));
    setReasonMissingRequirements(Boolean(request.missing_requirements));
    setReasonInactivity(Boolean(request.inactivity));
  }, [request]);

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

  const items = Array.isArray(request?.request_items) ? request.request_items : [];
  const subtotalCents = items.reduce((sum, item) => {
    const lineTotal = item.line_total_cents ?? Number(item.quantity || 0) * Number(item.unit_price_cents || 0);
    return sum + Number(lineTotal || 0);
  }, 0);
  const totalCents = Number(request?.total_cents ?? subtotalCents + Number(request?.shipping_fee_cents || 0));

  const isOnlinePayment = request?.payment_method === "online";
  const verificationPhotoUrl = findFileUrl(request, [
    "id_verification_photo_url",
    "id_verification_photo",
    "verification_photo_url",
  ]);
  const receiptUrl = findFileUrl(request, ["payment_receipt_url", "payment_receipt", "receipt_url"]);
  const requiresReason = selectedStatus === "on_hold" || selectedStatus === "closed";
  const isClosedStatus = selectedStatus === "closed";
  const hasAtLeastOneReason =
    reasonUnpaidBill || reasonMissingRequirements || (isClosedStatus && reasonInactivity);

  const handleAddTimeline = async () => {
    if (!requestId || !request) return;

    if (!newTimelineType) {
      await ShowAlert({
        icon: "error",
        title: "No Changes Selected",
        text: "Choose a timeline update.",
      });
      return;
    }

    const confirmation = await ShowAlert({
      icon: "question",
      title: "Confirm Timeline Update",
      text: "Add this timeline update?",
      showCancelButton: true,
      confirmButtonText: "Yes, add",
      cancelButtonText: "Cancel",
    });

    if (!confirmation?.isConfirmed) return;

    try {
      setSubmitting(true);

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

      setNewTimelineType("");
      await fetchRequest();
      await ShowAlert({
        icon: "success",
        title: "Timeline Updated",
        text: "Timeline entry has been added.",
      });
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

  const handleSaveStatus = async () => {
    if (!requestId || !request) return;

    if (requiresReason && !hasAtLeastOneReason) {
      await ShowAlert({
        icon: "error",
        title: "Reason Required",
        text: "Select at least one reason.",
      });
      return;
    }
    
    const swal_title = selectedStatus == "closed" ? "Confirm Request Closure" : "Confirm Status Update";
    const swal_desc = selectedStatus == "closed" ? "You are about to close this request. This action will end the process and notify the student that the request has been closed." : "Save this status update?";

    const confirmation = await ShowAlert({
      icon: "question",
      title: swal_title,
      text: swal_desc,
      showCancelButton: true,
      confirmButtonText: selectedStatus == "closed" ? "Close request" : "Yes, save",
      cancelButtonText: "Cancel",
    });

    if (!confirmation?.isConfirmed) return;

    try {
      setStatusSubmitting(true);
      const statusResponse = await api(`/api/v1/document_requests/${requestId}`, {
        method: "PATCH",
        body: JSON.stringify({
          document_request: {
            status: selectedStatus,
            unpaid_bill: requiresReason ? reasonUnpaidBill : false,
            missing_requirements: requiresReason ? reasonMissingRequirements : false,
            inactivity: isClosedStatus ? reasonInactivity : false,
          },
        }),
      });

      const responsePayload = await statusResponse.json();
      
      if (!statusResponse.ok) {
        throw new Error(responsePayload?.error || "Failed to update request status.");
      }
      
      
      const swal_title = responsePayload.status == "on_hold" ? "Request On Hold!" : "Status Updated";
      const swal_desc = responsePayload.status == "on_hold" ? "The request has been placed on hold. The student has been automatically notified to review the issue and complete the required action before processing can continue." : "Request status has been saved.";
      
      await fetchRequest();
      await ShowAlert({
        icon: "info",
        title: swal_title,
        text: swal_desc,
        confirmButtonText: "Okay!",
        customClass: {
          confirmButton: "btn btn-primary w-100",
        }
      });
    } catch (saveError) {
      await ShowAlert({
        icon: "error",
        title: "Update Failed",
        text: saveError?.message || "Unable to update request status.",
      });
    } finally {
      setStatusSubmitting(false);
    }
  };

  const openFileModal = (title, url) => {
    setModalFile({
      title,
      url,
    });
  };

  const handlePaymentStatusUpdate = async (nextPaymentStatus) => {
    if (!requestId || !request || updatingPaymentStatus) return;

    const statusLabel = nextPaymentStatus.replaceAll("_", " ");
    const confirmation = await ShowAlert({
      icon: "question",
      title: "Confirm Payment Status Update",
      text: `Set payment status to ${statusLabel}?`,
      showCancelButton: true,
      confirmButtonText: "Yes, update",
      cancelButtonText: "Cancel",
    });

    if (!confirmation?.isConfirmed) return;

    try {
      setUpdatingPaymentStatus(true);
      const response = await api(`/api/v1/document_requests/${requestId}`, {
        method: "PATCH",
        body: JSON.stringify({
          document_request: { payment_status: nextPaymentStatus },
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error || "Failed to update payment status.");
      }

      await fetchRequest();
      await ShowAlert({
        icon: "success",
        title: "Payment Status Updated",
        text: `Payment status is now ${statusLabel}.`,
      });
    } catch (updateError) {
      await ShowAlert({
        icon: "error",
        title: "Update Failed",
        text: updateError?.message || "Unable to update payment status.",
      });
    } finally {
      setUpdatingPaymentStatus(false);
    }
  };

  const selectInitKey = `${request?.id || "new"}-${newTimelineType}-${selectedStatus}-${loading}`;

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
                    Request ID: <span className="fw-normal">{request.request_id}</span>
                  </p>
                    <span className={
                      "fw-semibold " + (request.status === "on_hold"
                        ? "text-warning"
                        : request.status === "closed"
                          ? "text-danger"
                          : request.status === "completed"
                            ? "text-success"
                            : "text-info")
                    }>{request.status?.replaceAll("_", " ")}</span>
                </div>

                <div className="rqd-timeline">
                  {timelineEntries.map((entry, index) => (
                    <div className="rqd-timeline-row" key={entry.id || `${entry.type}-${index}`}>
                      <div className="rqd-timeline-date">{formatTimelineDate(entry.created_at)}</div>
                      <div className={`rqd-timeline-marker ${request.status == "closed" || request.status == "completed" ? "timeline-end" : ""} ${index === timelineEntries.length - 1 ? "last" : ""}`}></div>
                      <div className="rqd-timeline-label">{entry.label}</div>
                      <div className="rqd-timeline-time text-end">{formatTimelineTime(entry.created_at)}</div>
                    </div>
                  ))}

                  {request.status != "closed" && request.status != "completed" ? (
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
                <p className="rqd-section-title text-info">Add timeline</p>
                <InitBootstrapSelect key={selectInitKey} selector=".rqd-selectpicker" />

                <div className="d-flex gap-2 mb-4">
                  <select
                    className="selectpicker w-100 rqd-selectpicker"
                    value={newTimelineType}
                    onChange={(event) => setNewTimelineType(event.target.value)}
                    data-style="bg-light border"
                    data-width="100%"
                    title="Please Select..."
                  >
                    <option value="">Please Select...</option>
                    {TIMELINE_SELECT_OPTIONS.map((type) => (
                      <option key={type} value={type}>
                        {TIMELINE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-info rounded-pill fw-bold shadow-none"
                    onClick={handleAddTimeline}
                    disabled={submitting || statusSubmitting}
                  >
                    {submitting ? "Saving..." : "Add"}
                  </button>
                </div>

                <hr className="my-4" />
                <p className="rqd-section-title text-info">Status</p>

                {request.status === "closed" && request.inactivity ? (
                  <div className="small mt-2 mb-3 p-3 d-flex align-items-start" style={{ backgroundColor: "#F3F3F3", color: "#122787" }}>
                    <i className="bx bx-info-circle fs-5 me-1 text-danger"></i>
                    <p className="mb-0 text-primary">
                      <strong className="text-danger">Note: </strong>
                      This request was closed due to inactivity after more than 3 weeks without updates.
                    </p>
                  </div>
                ) : null}

                <div className="d-flex gap-3">
                  <select
                    className="selectpicker w-100 rqd-selectpicker"
                    value={selectedStatus}
                    onChange={(event) => {
                      const nextStatus = event.target.value;
                      setSelectedStatus(nextStatus);
                      if (nextStatus !== "on_hold" && nextStatus !== "closed") {
                        setReasonUnpaidBill(false);
                        setReasonMissingRequirements(false);
                      }
                      if (nextStatus !== "closed") setReasonInactivity(false);
                    }}
                    data-style="bg-light border"
                    data-width="100%"
                  >
                    {STATUS_SELECT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="btn btn-info rounded-pill fw-bold shadow-none mb-2 ms-auto"
                    onClick={handleSaveStatus}
                    disabled={submitting || statusSubmitting}
                  >
                    {statusSubmitting ? "Saving..." : "Save"}
                  </button>
                </div>

                {requiresReason ? (
                  <div className="mb-4">
                    <p className="small text-muted mb-2">Reason (select at least one)</p>
                    <label className="rqd-check-row">
                      <input
                        type="checkbox"
                        checked={reasonUnpaidBill}
                        className="form-check-input"
                        onChange={(event) => setReasonUnpaidBill(event.target.checked)}
                        disabled={submitting || statusSubmitting}
                      />
                      <span>Unpaid bill</span>
                    </label>
                    <label className="rqd-check-row">
                      <input
                        type="checkbox"
                        checked={reasonMissingRequirements}
                        className="form-check-input"
                        onChange={(event) => setReasonMissingRequirements(event.target.checked)}
                        disabled={submitting || statusSubmitting}
                      />
                      <span>Missing requirements</span>
                    </label>
                    {isClosedStatus ? (
                      <label className="rqd-check-row">
                        <input
                          type="checkbox"
                          checked={reasonInactivity}
                          className="form-check-input"
                          onChange={(event) => setReasonInactivity(event.target.checked)}
                          disabled={submitting || statusSubmitting}
                        />
                        <span>Inactivity (3+ weeks no updates)</span>
                      </label>
                    ) : null}
                  </div>
                ) : (
                  <div className="mb-4"></div>
                )}
                <hr className="my-4" />
                <p className="rqd-section-title text-info">Payment</p>

                <div className="rqd-info-list">
                  <p>
                    <strong>Payment Status:</strong>{" "}
                  </p>
                  <div className="rqd-payment-actions">
                    <button
                      type="button"
                      className={`btn btn-sm btn-outline-secondary rounded-pill ${request.payment_status === "paid" ? "btn-outline-success active" : ""}`}
                      disabled={updatingPaymentStatus}
                      onClick={() => handlePaymentStatusUpdate("paid")}
                    >
                      Paid
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm btn-outline-secondary rounded-pill ${request.payment_status === "not_paid" ? "btn-outline-danger active" : ""}`}
                      disabled={updatingPaymentStatus}
                      onClick={() => handlePaymentStatusUpdate("not_paid")}
                    >
                      Not Paid
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm btn-outline-secondary rounded-pill ${request.payment_status === "under_review" ? "btn-outline-warning active" : ""}`}
                      disabled={updatingPaymentStatus}
                      onClick={() => handlePaymentStatusUpdate("under_review")}
                    >
                      Under Review
                    </button>
                  </div>

                  <p><strong>Payment Method:</strong> {formatPaymentMethod(request.payment_method)}</p>
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
                // eslint-disable-next-line @next/next/no-img-element
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
