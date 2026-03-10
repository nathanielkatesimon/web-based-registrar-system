"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

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

function formatDateTime(value) {
  if (!value) return "No recent activity";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "No recent activity";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function formatStatusMeta(status) {
  return STATUS_META[status] || { label: "Unknown", tone: "muted" };
}

function summarizeRequestItems(items = []) {
  if (!Array.isArray(items) || items.length === 0) return "Document request";
  if (items.length === 1) return items[0]?.name || "Document request";
  return `${items[0]?.name || "Document"} +${items.length - 1} more`;
}

export default function StaffDashboardPage() {
  const [requests, setRequests] = useState([]);
  const [students, setStudents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const [requestsResponse, studentsResponse, ticketsResponse] = await Promise.all([
          api("/api/v1/document_requests"),
          api("/api/v1/students"),
          api("/api/v1/escalation_tickets"),
        ]);

        const [requestsPayload, studentsPayload, ticketsPayload] = await Promise.all([
          requestsResponse.json().catch(() => []),
          studentsResponse.json().catch(() => []),
          ticketsResponse.json().catch(() => []),
        ]);

        if (!requestsResponse.ok) {
          throw new Error(requestsPayload?.error || "Failed to load staff dashboard.");
        }
        if (!studentsResponse.ok) {
          throw new Error(studentsPayload?.error || "Failed to load students.");
        }
        if (!ticketsResponse.ok) {
          throw new Error(ticketsPayload?.error || "Failed to load escalations.");
        }

        if (!isMounted) return;

        setRequests(Array.isArray(requestsPayload) ? requestsPayload : []);
        setStudents(Array.isArray(studentsPayload) ? studentsPayload : []);
        setTickets(Array.isArray(ticketsPayload) ? ticketsPayload : []);
      } catch (fetchError) {
        if (!isMounted) return;
        setError(fetchError?.message || "Failed to load staff dashboard.");
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

  const recentRequests = sortedRequests.slice(0, 6);
  const latestRequest = recentRequests[0] || null;
  const latestTicket = tickets[0] || null;
  const totalStudents = students.length;
  const processingCount = requests.filter((request) => request.status === "processing").length;
  const onHoldCount = requests.filter((request) => request.status === "on_hold").length;
  const completedCount = requests.filter((request) => request.status === "completed").length;
  const openEscalationsCount = tickets.filter((ticket) => ticket.status === "open").length;

  return (
    <div className="staff-dashboard-page px-8 flex-grow-1 py-4">
      {loading ? (
        <div className="dashboard-state">Loading dashboard...</div>
      ) : error ? (
        <div className="dashboard-state dashboard-state-error">{error}</div>
      ) : (
        <>
          <section className="top-board">
            <div className="overview-panel">
              <div className="overview-header">
                <div>
                  <span className="section-kicker">Operations Board</span>
                  <h1 className="overview-title">A tighter daily view for registrar work.</h1>
                </div>
                <div className="overview-actions">
                  <Link href="/staff/dashboard/request-queue" className="primary-action">
                    Open Queue
                  </Link>
                  <Link href="/staff/dashboard/student-list" className="secondary-action">
                    Students
                  </Link>
                </div>
              </div>

              <p className="overview-copy">
                Scan active demand, surface stalled requests, and move directly into the queue or
                escalation inbox without hunting through the sidebar.
              </p>

              <div className="overview-grid">
                <div className="overview-tile overview-tile-main">
                  <span className="tile-label">Student Records</span>
                  <strong className="tile-value">{totalStudents}</strong>
                  <span className="tile-note">Total students currently managed by the system</span>
                </div>
                <div className="overview-tile">
                  <span className="tile-label">Newest Request</span>
                  <strong className="tile-value tile-value-compact">
                    {latestRequest?.request_id || "None yet"}
                  </strong>
                  <span className="tile-note">
                    {latestRequest ? summarizeRequestItems(latestRequest.request_items) : "Waiting for request activity"}
                  </span>
                </div>
                <div className="overview-tile">
                  <span className="tile-label">Escalation Pressure</span>
                  <strong className="tile-value">{openEscalationsCount}</strong>
                  <span className="tile-note">Open tickets still waiting on a staff response</span>
                </div>
              </div>
            </div>

            <div className="side-stack">
              <div className="focus-card">
                <div className="focus-top">
                  <span className="focus-chip">Escalation Focus</span>
                  <span className={`focus-badge ${latestTicket?.status === "open" ? "danger" : "calm"}`}>
                    {latestTicket?.status === "open" ? "Open" : "Closed"}
                  </span>
                </div>

                {latestTicket ? (
                  <>
                    <p className="focus-code">{latestTicket.ticket_code}</p>
                    <p className="focus-text">
                      <strong>{latestTicket.student?.full_name || "Student"}</strong> raised{" "}
                      {latestTicket.subject || "an escalation"} linked to{" "}
                      {latestTicket.document_request?.request_id || "a request"}.
                    </p>
                    <div className="focus-bottom">
                      <span className="focus-time">{formatDateTime(latestTicket.latest_message_at || latestTicket.created_at)}</span>
                      <Link href={`/staff/dashboard/escalations?ticket=${latestTicket.id}`} className="focus-link">
                        Open Ticket
                      </Link>
                    </div>
                  </>
                ) : (
                  <p className="focus-text">No escalation needs immediate review right now.</p>
                )}
              </div>
            </div>
          </section>

          <section className="metrics-grid">
            <article className="metric-card metric-card-primary">
              <span className="metric-label">Processing</span>
              <strong className="metric-value">{processingCount}</strong>
              <span className="metric-note">Requests actively moving through validation and fulfillment</span>
            </article>
            <article className="metric-card">
              <span className="metric-label">On Hold</span>
              <strong className="metric-value">{onHoldCount}</strong>
              <span className="metric-note">Requests blocked by requirements, payment, or staff review</span>
            </article>
            <article className="metric-card">
              <span className="metric-label">Completed</span>
              <strong className="metric-value">{completedCount}</strong>
              <span className="metric-note">Requests finalized in the current queue snapshot</span>
            </article>
            <article className="metric-card">
              <span className="metric-label">Open Escalations</span>
              <strong className="metric-value">{openEscalationsCount}</strong>
              <span className="metric-note">Student concerns still awaiting closure or follow-up</span>
            </article>
          </section>

          <section className="panel recent-requests-panel">
            <div className="panel-header">
              <div>
                <span className="section-kicker">Live Queue Snapshot</span>
                <h3 className="panel-title">Recent Requests</h3>
              </div>
              <Link href="/staff/dashboard/request-queue" className="panel-link">
                Open Request Queue
              </Link>
            </div>

            <div className="requests-table-wrap">
              <table className="requests-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Document Type</th>
                    <th>Request ID</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Paid or Not</th>
                    <th aria-label="Action"></th>
                  </tr>
                </thead>
                <tbody>
                  {recentRequests.length > 0 ? (
                    recentRequests.map((request) => {
                      const statusMeta = formatStatusMeta(request.status);
                      const studentName =
                        request.student_name || request.student?.full_name || request.user?.full_name || "Student unavailable";

                      return (
                        <tr key={request.id}>
                          <td>{studentName}</td>
                          <td>{summarizeRequestItems(request.request_items)}</td>
                          <td>{request.request_id || "-"}</td>
                          <td>{formatDate(request.created_at)}</td>
                          <td>
                            <span className={`status-tone ${statusMeta.tone}`}>{statusMeta.label}</span>
                          </td>
                          <td>{PAYMENT_LABELS[request.payment_status] || "Not Paid"}</td>
                          <td>
                            <Link href={`/staff/dashboard/request-queue/${request.id}`} className="btn btn-sm btn-outline-info rounded-pill">
                              Check
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="table-empty-state">
                        No requests found.
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
        .staff-dashboard-page {
          color: #25304f;
        }

        .dashboard-state {
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.96);
          padding: 40px 28px;
          text-align: center;
          box-shadow: 0 18px 44px rgba(19, 50, 136, 0.08);
        }

        .dashboard-state-error {
          color: #a52828;
        }

        .top-board {
          display: grid;
          grid-template-columns: minmax(0, 1.7fr) minmax(320px, 0.95fr);
          gap: 20px;
          margin-bottom: 20px;
        }

        .overview-panel,
        .focus-card,
        .metric-card,
        .panel {
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid rgba(19, 50, 136, 0.08);
          box-shadow: 0 18px 44px rgba(19, 50, 136, 0.08);
        }

        .overview-panel {
          padding: 24px;
          background:
            radial-gradient(circle at top right, rgba(115, 148, 255, 0.15), transparent 34%),
            linear-gradient(135deg, #ffffff 0%, #f2f6ff 56%, #f8fbff 100%);
        }

        .overview-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
        }

        .section-kicker {
          display: inline-block;
          font-size: 0.74rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #6b7697;
        }

        .overview-title,
        .panel-title {
          color: #1b2753;
          font-weight: 800;
        }

        .overview-title {
          margin: 10px 0 0;
          font-size: clamp(1.55rem, 2.8vw, 2.1rem);
          line-height: 1.08;
          max-width: 560px;
        }

        .overview-copy,
        .metric-note,
        .panel-empty-state,
        .student-program,
        .priority-subtitle,
        .tile-note,
        .focus-text {
          color: #667390;
          line-height: 1.6;
        }

        .overview-copy {
          margin: 14px 0 0;
          max-width: 620px;
        }

        .overview-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .primary-action,
        .secondary-action,
        .focus-link,
        .panel-link,
        .table-action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: 160ms ease;
        }

        .primary-action {
          min-height: 46px;
          padding: 0 18px;
          border-radius: 999px;
          background: #133288;
          color: #fff;
          font-weight: 700;
        }

        .secondary-action {
          min-height: 46px;
          padding: 0 18px;
          border-radius: 999px;
          border: 1px solid rgba(19, 50, 136, 0.14);
          background: rgba(255, 255, 255, 0.92);
          color: #133288;
          font-weight: 700;
        }

        .overview-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-top: 20px;
        }

        .overview-tile {
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(19, 50, 136, 0.08);
          padding: 16px;
          min-height: 126px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .overview-tile-main {
          background: linear-gradient(160deg, #133288 0%, #3154be 100%);
        }

        .tile-label {
          display: block;
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #7080a4;
        }

        .overview-tile-main .tile-label,
        .overview-tile-main .tile-value,
        .overview-tile-main .tile-note {
          color: #fff;
        }

        .tile-value {
          display: block;
          font-size: 1.9rem;
          line-height: 1;
          color: #1a2553;
          font-weight: 800;
        }

        .tile-value-compact {
          font-size: 1.02rem;
          line-height: 1.25;
        }

        .tile-note {
          font-size: 0.9rem;
        }

        .side-stack {
          display: block;
        }

        .focus-card {
          padding: 22px;
        }

        .focus-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 240px;
          background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
        }

        .focus-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .focus-chip,
        .focus-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 30px;
          padding: 0 11px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .focus-chip {
          background: #edf2ff;
          color: #486091;
        }

        .focus-badge.danger {
          background: #ffe0de;
          color: #b22c2c;
        }

        .focus-badge.calm {
          background: #dff5da;
          color: #2f7f31;
        }

        .focus-code {
          margin: 22px 0 0;
          font-size: 0.92rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #7b87a8;
          text-transform: uppercase;
        }

        .focus-text {
          margin: 14px 0 0;
          font-size: 1.05rem;
          color: #1b2753;
        }

        .focus-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-top: 24px;
        }

        .focus-time {
          color: #7a86a5;
          font-size: 0.92rem;
        }

        .focus-link,
        .panel-link {
          color: #133288;
          font-weight: 700;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .metric-card {
          padding: 20px;
          min-height: 150px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .metric-card-primary {
          background: linear-gradient(160deg, #133288 0%, #3154be 100%);
        }

        .metric-label {
          font-size: 0.74rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #7280a1;
        }

        .metric-value {
          font-size: clamp(1.8rem, 2.5vw, 2.2rem);
          line-height: 1;
          font-weight: 800;
          color: #1b2753;
          margin: 10px 0;
        }

        .metric-card-primary .metric-label,
        .metric-card-primary .metric-value,
        .metric-card-primary .metric-note {
          color: #fff;
        }

        .panel {
          padding: 22px;
        }

        .panel-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 16px;
        }

        .requests-table-wrap {
          overflow-x: auto;
          border-radius: 15px;
          border: 1px solid rgba(19, 50, 136, 0.08);
          background: #fff;
        }

        .requests-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 860px;
        }

        .requests-table th,
        .requests-table td {
          padding: 16px 18px;
          border-bottom: 1px solid #edf1f7;
          font-size: 0.92rem;
          color: #394466;
          vertical-align: middle;
        }

        .requests-table th {
          background: #fbfcff;
          font-size: 0.76rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 800;
          color: #7d88a6;
        }

        .status-tone {
          font-weight: 700;
        }

        .status-tone.info {
          color: #133288;
        }

        .status-tone.success {
          color: #33a000;
        }

        .status-tone.warning {
          color: #a88900;
        }

        .status-tone.danger {
          color: #d12626;
        }

        .status-tone.muted {
          color: #6f7c99;
        }

        .table-action-btn {
          min-width: 88px;
          min-height: 38px;
          border-radius: 999px;
          border: 1.5px solid #133288;
          color: #133288;
          background: #fff;
          font-weight: 700;
        }

        .table-empty-state,
        .panel-empty-state {
          text-align: center;
          padding: 32px 16px;
        }

        @media (max-width: 1199px) {
          .top-board {
            grid-template-columns: 1fr;
          }

          .metrics-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .overview-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 767px) {
          .overview-panel,
          .focus-card,
          .metric-card,
          .panel {
            padding: 18px;
          }

          .overview-header,
          .focus-top,
          .focus-bottom,
          .panel-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .metrics-grid,
          .overview-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
