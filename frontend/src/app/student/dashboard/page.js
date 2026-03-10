"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

const STATUS_FILTERS = [
  { label: "All Requests", value: "all" },
  { label: "Processing", value: "processing" },
  { label: "Completed", value: "completed" },
  { label: "On Hold", value: "on_hold" },
];

const DEFICIENCY_FIELDS = [
  { key: "enrollment_form", label: "Enrollment Form" },
  { key: "form_138", label: "Form 138" },
  { key: "form_137", label: "Form 137" },
  { key: "certificate_of_good_moral_character", label: "Certificate of Good Moral Character" },
  { key: "id_pictures", label: "ID Pictures" },
  { key: "birth_certificate", label: "NSO/PSA Birth Certificate" },
  { key: "senior_high_school_diploma", label: "Senior High School Diploma" },
  { key: "honorable_dismissal", label: "Honorable Dismissal" },
  { key: "transcript_of_records", label: "Transcript of Records" },
];

const STATUS_META = {
  processing: { label: "Processing", tone: "info" },
  completed: { label: "Completed", tone: "success" },
  on_hold: { label: "On Hold", tone: "warning" },
  closed: { label: "Closed", tone: "danger" },
};

const PAYMENT_LABELS = {
  paid: "Paid",
  not_paid: "Not Paid",
  under_review: "Under Review",
};

function formatDate(value) {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function formatFriendlyDate(value) {
  if (!value) return "No date available";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "No date available";

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function formatDelivery(value) {
  return value === "courier_delivery" ? "Courier" : "For Pickup";
}

function formatStatusMeta(status) {
  return STATUS_META[status] || { label: "On Hold", tone: "warning" };
}

function summarizeRequestItems(items = []) {
  if (!Array.isArray(items) || items.length === 0) return "No documents listed";
  if (items.length === 1) return items[0]?.name || "Document request";
  return `${items[0]?.name || "Document"} +${items.length - 1} more`;
}

export default function StudentDashboardPage() {
  const [requests, setRequests] = useState([]);
  const [deficiencies, setDeficiencies] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const [requestsResponse, deficienciesResponse, notificationsResponse] = await Promise.all([
          api("/api/v1/document_requests"),
          api("/api/v1/deficiencies/personal_info"),
          api("/api/v1/notifications"),
        ]);

        const [requestsPayload, deficienciesPayload, notificationsPayload] = await Promise.all([
          requestsResponse.json().catch(() => []),
          deficienciesResponse.json().catch(() => ({})),
          notificationsResponse.json().catch(() => []),
        ]);

        if (!requestsResponse.ok) {
          throw new Error(requestsPayload?.error || "Failed to load dashboard.");
        }

        if (!isMounted) return;

        setRequests(Array.isArray(requestsPayload) ? requestsPayload : []);
        setNotifications(Array.isArray(notificationsPayload) ? notificationsPayload : []);
        setDeficiencies(
          DEFICIENCY_FIELDS.filter((field) => deficienciesPayload?.[field.key] === "lacking")
        );
      } catch (fetchError) {
        if (!isMounted) return;
        setError(fetchError?.message || "Failed to load dashboard.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const sortedRequests = useMemo(
    () =>
      [...requests].sort((a, b) => {
        const aTime = new Date(a.created_at || 0).getTime();
        const bTime = new Date(b.created_at || 0).getTime();
        return bTime - aTime;
      }),
    [requests]
  );

  const filteredRequests = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return sortedRequests.filter((request) => {
      const matchesFilter = activeFilter === "all" || request.status === activeFilter;
      const haystack = [
        request.request_id,
        summarizeRequestItems(request.request_items),
        formatDelivery(request.delivery_method),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !keyword || haystack.includes(keyword);
      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, searchTerm, sortedRequests]);

  const latestRequest = sortedRequests[0] || null;
  const activeRequestsCount = requests.filter((request) =>
    ["processing", "on_hold"].includes(request.status)
  ).length;
  const completedRequestsCount = requests.filter((request) => request.status === "completed").length;
  const onHoldRequestsCount = requests.filter((request) => request.status === "on_hold").length;
  const unreadNotificationsCount = notifications.filter((notification) => !notification.read_at).length;

  return (
    <div className="student-dashboard-page px-4 px-lg-5 py-4">
      {loading ? (
        <div className="dashboard-state">Loading dashboard...</div>
      ) : error ? (
        <div className="dashboard-state dashboard-state-error">{error}</div>
      ) : (
        <>
          <div className="dashboard-top-grid">
            <section className="pulse-panel">
              <div className="pulse-copy">
                <span className="pulse-kicker">Request Pulse</span>
                <h2 className="pulse-title">See what needs attention before it slows your request down.</h2>
                <p className="pulse-description">
                  Keep an eye on in-progress requests, hold statuses, unread updates, and recent activity
                  so you can act on registrar requirements faster.
                </p>

                <div className="pulse-actions">
                  <Link href="/student/dashboard/requests" className="pulse-primary-btn">
                    New Request
                  </Link>
                  <Link href="/student/dashboard/tracker" className="pulse-secondary-btn">
                    Open Tracker
                  </Link>
                </div>
              </div>

              <div className="pulse-stats-grid">
                <div className="metric-card metric-card-main">
                  <span className="metric-label">Active Requests</span>
                  <strong className="metric-value">{activeRequestsCount}</strong>
                  <span className="metric-note">Requests still in motion across processing and hold stages</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Completed</span>
                  <strong className="metric-value">{completedRequestsCount}</strong>
                  <span className="metric-note">Requests that have already been finalized</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Unread Updates</span>
                  <strong className="metric-value">{unreadNotificationsCount}</strong>
                  <span className="metric-note">Recent request notifications you have not opened yet</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">On Hold</span>
                  <strong className="metric-value">{onHoldRequestsCount}</strong>
                  <span className="metric-note">Requests currently blocked or waiting for action</span>
                </div>
              </div>

              <div className="spotlight-card">
                <div>
                  <span className="spotlight-label">Latest Request</span>
                  <p className="spotlight-title mb-1">
                    {latestRequest?.request_id || "No request submitted yet"}
                  </p>
                  <p className="spotlight-copy mb-0">
                    {latestRequest
                      ? `${summarizeRequestItems(latestRequest.request_items)} submitted on ${formatFriendlyDate(latestRequest.created_at)}.`
                      : "Start your first request to see it summarized here."}
                  </p>
                </div>
                {latestRequest ? (
                  <Link
                    href={`/student/dashboard/tracker?request=${encodeURIComponent(
                      String(latestRequest.request_id || latestRequest.id)
                    )}`}
                    className="spotlight-link"
                  >
                    Review
                  </Link>
                ) : null}
              </div>
            </section>
            
            
            <div><Link href="/student/dashboard/profile/deficiencies">
            <div className="deficiency-panel">
              <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                <div>
                  <p className="panel-eyebrow mb-1">Requirements</p>
                  <h3 className="panel-title mb-0">My Deficiencies</h3>
                </div>
              </div>

              {deficiencies.length > 0 ? (
                <>
                  <p className="panel-copy mb-0 p-0">Please comply the following:</p>
                  <div className="deficiency-list">
                    {deficiencies.map((item) => (
                      <div className="deficiency-item" key={item.key}>
                        <span className="deficiency-dot">
                          <i className="bx bx-x"></i>
                        </span>
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="deficiency-clear-state">
                  <div className="deficiency-clear-icon">
                    <i className="bx bx-check"></i>
                  </div>
                  <p className="mb-0">All listed enrollment requirements are currently complied.</p>
                </div>
              )}
            </div>
            </Link></div>
          </div>

          <section className="queue-panel">
            <div className="queue-header">
              <div>
                <p className="panel-eyebrow mb-1">Document Activity</p>
                <h3 className="panel-title mb-0">My Request Queue</h3>
              </div>

              <div className="queue-toolbar">
                <div className="queue-filters">
                  {STATUS_FILTERS.map((filter) => (
                    <button
                      key={filter.value}
                      type="button"
                      className={`queue-filter-btn ${activeFilter === filter.value ? "active" : ""}`}
                      onClick={() => setActiveFilter(filter.value)}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                <div className="queue-search-wrap">
                  <i className="bx bx-search"></i>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search request or document..."
                    aria-label="Search request queue"
                  />
                </div>
              </div>
            </div>

            <div className="queue-table-wrap">
              <table className="queue-table">
                <thead>
                  <tr>
                    <th>Document Type</th>
                    <th>Request ID</th>
                    <th>Delivery</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Paid or Not</th>
                    <th aria-label="Action"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.length > 0 ? (
                    filteredRequests.map((request) => {
                      const statusMeta = formatStatusMeta(request.status);

                      return (
                        <tr key={request.id}>
                          <td>{summarizeRequestItems(request.request_items)}</td>
                          <td>{request.request_id || "-"}</td>
                          <td>{formatDelivery(request.delivery_method)}</td>
                          <td>{formatDate(request.created_at)}</td>
                          <td>
                            <span className={`table-tone ${statusMeta.tone}`}>{statusMeta.label}</span>
                          </td>
                          <td>{PAYMENT_LABELS[request.payment_status] || "Not Paid"}</td>
                          <td>
                            <Link
                              href={`/student/dashboard/tracker?request=${encodeURIComponent(
                                String(request.request_id || request.id)
                              )}`}
                              className="btn btn-sm btn-outline-info rounded-pill"
                            >
                              {request.status === "processing" ? "Track" : "Check"}
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="queue-empty-state">
                        No requests match your current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <style jsx>{`
        .student-dashboard-page {
          min-height: calc(100vh - 72px);
        }

        .dashboard-state {
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.92);
          padding: 40px 28px;
          text-align: center;
          color: #44506f;
          box-shadow: 0 24px 60px rgba(20, 42, 132, 0.08);
        }

        .dashboard-state-error {
          color: #a52828;
        }

        .dashboard-top-grid {
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr);
          gap: 24px;
          align-items: stretch;
          margin-bottom: 24px;
        }

        .pulse-panel {
          position: relative;
          overflow: hidden;
          border-radius: 15px;
          padding: 28px;
          background:
            radial-gradient(circle at top right, rgba(104, 126, 255, 0.22), transparent 32%),
            linear-gradient(135deg, #ffffff 0%, #eef3ff 60%, #f8faff 100%);
          border: 1px solid rgba(19, 50, 136, 0.12);
          box-shadow: 0 26px 60px rgba(19, 50, 136, 0.1);
        }

        .pulse-kicker,
        .panel-eyebrow {
          display: inline-block;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          font-weight: 700;
          color: #5d6e9b;
        }

        .pulse-title,
        .panel-title {
          color: #1a2554;
          font-weight: 800;
        }

        .pulse-title {
          max-width: 560px;
          font-size: clamp(1.8rem, 3vw, 2.55rem);
          line-height: 1.05;
          margin: 12px 0 12px;
        }

        .pulse-description,
        .panel-copy,
        .spotlight-copy {
          color: #5b6788;
          line-height: 1.6;
        }

        .pulse-description {
          max-width: 560px;
          margin-bottom: 20px;
        }

        .pulse-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 26px;
        }

        .pulse-primary-btn,
        .pulse-secondary-btn,
        .spotlight-link,
        .view-all-link,
        .queue-action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: 160ms ease;
        }

        .pulse-primary-btn {
          background: #133288;
          color: #fff;
          padding: 12px 18px;
          border-radius: 999px;
          font-weight: 700;
        }

        .pulse-primary-btn:hover,
        .spotlight-link:hover,
        .view-all-link:hover,
        .queue-action-btn:hover {
          transform: translateY(-1px);
        }

        .pulse-secondary-btn {
          border: 1px solid rgba(19, 50, 136, 0.16);
          color: #133288;
          background: rgba(255, 255, 255, 0.84);
          padding: 12px 18px;
          border-radius: 999px;
          font-weight: 700;
        }

        .pulse-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .metric-card {
          min-height: 138px;
          border-radius: 24px;
          padding: 18px;
          background: rgba(255, 255, 255, 0.84);
          border: 1px solid rgba(19, 50, 136, 0.08);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
        }

        .metric-card-main {
          background: linear-gradient(160deg, #133288 0%, #284bb0 100%);
          color: #fff;
        }

        .metric-label {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: inherit;
          opacity: 0.78;
        }

        .metric-value {
          color: #162252;
          font-size: clamp(1.6rem, 2vw, 2rem);
          font-weight: 800;
          line-height: 1;
          margin: 10px 0;
        }

        .metric-card-main .metric-value,
        .metric-card-main .metric-note {
          color: #fff;
        }

        .metric-note {
          font-size: 0.86rem;
          color: #66738f;
          line-height: 1.4;
        }

        .spotlight-card {
          margin-top: 18px;
          border-radius: 26px;
          padding: 18px 20px;
          background: #fffdf7;
          border: 1px solid rgba(189, 161, 82, 0.22);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .spotlight-label {
          font-size: 0.74rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #8a7440;
          font-weight: 700;
        }

        .spotlight-title {
          font-size: 1.1rem;
          font-weight: 800;
          color: #1c285a;
        }

        .spotlight-link {
          flex-shrink: 0;
          min-width: 96px;
          padding: 12px 18px;
          border-radius: 999px;
          background: #133288;
          color: #fff;
          font-weight: 700;
        }

        .deficiency-panel,
        .queue-panel {
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid rgba(19, 50, 136, 0.08);
          box-shadow: 0 24px 60px rgba(19, 50, 136, 0.08);
        }

        .deficiency-panel {
          padding: 24px;
          display: flex;
          flex-direction: column;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 700;
        }

        .status-pill.warning {
          color: #875d00;
          background: #fff2cb;
        }

        .status-pill.success {
          color: #1f7a26;
          background: #dcf7d8;
        }

        .deficiency-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 18px;
        }

        .deficiency-item {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #2e385d;
          font-size: 0.94rem;
        }

        .deficiency-dot,
        .deficiency-clear-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .deficiency-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ef1f23;
          color: #fff;
          font-size: 0.88rem;
        }

        .deficiency-clear-state {
          min-height: 180px;
          border-radius: 24px;
          background: linear-gradient(180deg, #f4fbf2 0%, #fbfffa 100%);
          border: 1px dashed rgba(51, 160, 0, 0.28);
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          flex-direction: column;
          gap: 12px;
          color: #3d6b3e;
          padding: 24px;
        }

        .deficiency-clear-icon {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          background: #dff5da;
          color: #2d8a27;
          font-size: 1.5rem;
        }

        .view-all-link {
          margin-top: auto;
          align-self: flex-start;
          color: #133288;
          font-weight: 700;
          padding-top: 18px;
        }

        .queue-panel {
          padding: 24px;
        }

        .queue-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 18px;
          margin-bottom: 18px;
        }

        .queue-toolbar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
        }

        .queue-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .queue-filter-btn {
          border: 0;
          background: transparent;
          color: #7381a5;
          font-weight: 700;
          padding: 8px 6px;
          border-bottom: 2px solid transparent;
        }

        .queue-filter-btn.active {
          color: #133288;
          border-color: #133288;
        }

        .queue-search-wrap {
          min-width: min(100%, 290px);
          display: flex;
          align-items: center;
          gap: 10px;
          border-radius: 999px;
          background: #f5f7fc;
          border: 1px solid rgba(19, 50, 136, 0.08);
          padding: 10px 14px;
          color: #7885a6;
        }

        .queue-search-wrap input {
          border: 0;
          background: transparent;
          outline: 0;
          width: 100%;
          color: #22305f;
        }

        .queue-table-wrap {
          overflow-x: auto;
          border-radius: 24px;
          border: 1px solid rgba(19, 50, 136, 0.08);
          background: #fff;
        }

        .queue-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 780px;
        }

        .queue-table th,
        .queue-table td {
          padding: 16px 18px;
          font-size: 0.92rem;
          border-bottom: 1px solid #edf1f8;
          color: #394466;
          vertical-align: middle;
        }

        .queue-table th {
          font-size: 0.76rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 800;
          color: #7f89a7;
          background: #fbfcff;
        }

        .table-tone {
          font-weight: 700;
        }

        .table-tone.info {
          color: #133288;
        }

        .table-tone.success {
          color: #33a000;
        }

        .table-tone.warning {
          color: #a88900;
        }

        .table-tone.danger {
          color: #d12626;
        }

        .queue-action-btn {
          min-width: 92px;
          padding: 10px 16px;
          border-radius: 999px;
          border: 1.6px solid #133288;
          color: #133288;
          font-weight: 700;
          background: #fff;
        }

        .queue-empty-state {
          text-align: center;
          color: #7885a6;
          padding: 40px 24px !important;
        }

        @media (max-width: 1199px) {
          .dashboard-top-grid {
            grid-template-columns: 1fr;
          }

          .pulse-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 767px) {
          .student-dashboard-page {
            padding-left: 16px;
            padding-right: 16px;
          }

          .pulse-panel,
          .deficiency-panel,
          .queue-panel {
            padding: 20px;
            border-radius: 24px;
          }

          .pulse-title {
            font-size: 1.7rem;
          }

          .pulse-stats-grid {
            grid-template-columns: 1fr;
          }

          .spotlight-card,
          .queue-header {
            flex-direction: column;
            align-items: stretch;
          }

          .queue-toolbar {
            justify-content: flex-start;
          }

          .queue-search-wrap {
            min-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
