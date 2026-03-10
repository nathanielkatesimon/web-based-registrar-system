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

function studentProgram(student) {
  const profile = student?.student_profile || {};
  return profile.course || profile.track || "Program not set";
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
  const processingCount = requests.filter((request) => request.status === "processing").length;
  const onHoldCount = requests.filter((request) => request.status === "on_hold").length;
  const completedCount = requests.filter((request) => request.status === "completed").length;
  const openEscalationsCount = tickets.filter((ticket) => ticket.status === "open").length;
  const latestTicket = tickets[0] || null;

  const urgentRequests = useMemo(() => {
    const heldRequests = requests
      .filter((request) => request.status === "on_hold")
      .slice(0, 3)
      .map((request) => ({
        key: `hold-${request.id}`,
        title: request.request_id || `Request #${request.id}`,
        subtitle: request.student?.full_name || request.student_name || "Student unavailable",
        meta: "On hold request",
        href: `/staff/dashboard/request-queue/${request.id}`,
        tone: "warning",
      }));

    const openTickets = tickets
      .filter((ticket) => ticket.status === "open")
      .slice(0, 3)
      .map((ticket) => ({
        key: `ticket-${ticket.id}`,
        title: ticket.ticket_code || `Ticket #${ticket.id}`,
        subtitle: ticket.student?.full_name || "Student unavailable",
        meta: "Open escalation",
        href: `/staff/dashboard/escalations?ticket=${ticket.id}`,
        tone: "danger",
      }));

    return [...heldRequests, ...openTickets].slice(0, 5);
  }, [requests, tickets]);

  const latestStudents = useMemo(
    () =>
      [...students]
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
        .slice(0, 4),
    [students]
  );

  return (
    <div className="staff-dashboard-page container-xxl flex-grow-1 py-4">
      {loading ? (
        <div className="dashboard-state">Loading dashboard...</div>
      ) : error ? (
        <div className="dashboard-state dashboard-state-error">{error}</div>
      ) : (
        <>
          <section className="operations-hero">
            <div className="operations-copy">
              <span className="section-kicker">Operations Overview</span>
              <h1 className="operations-title">Run the registrar queue with clearer priorities.</h1>
              <p className="operations-description">
                Monitor requests in flight, catch hold cases early, and keep escalation handling visible
                without bouncing between multiple staff pages.
              </p>

              <div className="operations-actions">
                <Link href="/staff/dashboard/request-queue" className="hero-primary-btn">
                  Open Request Queue
                </Link>
                <Link href="/staff/dashboard/student-list" className="hero-secondary-btn">
                  Manage Students
                </Link>
              </div>
            </div>

            <div className="hero-focus-card">
              <span className="focus-label">Escalation Focus</span>
              <h3 className="focus-title">
                {latestTicket?.ticket_code || "No active escalation spotlight"}
              </h3>
              <p className="focus-description">
                {latestTicket
                  ? `${latestTicket.student?.full_name || "Student"} raised ${latestTicket.subject || "an escalation"}`
                  : "The escalation inbox is currently quiet."}
              </p>
              <div className="focus-meta">
                <span>{latestTicket ? formatDateTime(latestTicket.latest_message_at || latestTicket.created_at) : "Up to date"}</span>
                {latestTicket ? (
                  <Link href={`/staff/dashboard/escalations?ticket=${latestTicket.id}`} className="focus-link">
                    Open Ticket
                  </Link>
                ) : null}
              </div>
            </div>
          </section>

          <section className="metrics-grid">
            <article className="metric-card metric-card-primary">
              <span className="metric-label">Processing</span>
              <strong className="metric-value">{processingCount}</strong>
              <span className="metric-note">Requests actively moving through verification and fulfillment</span>
            </article>
            <article className="metric-card">
              <span className="metric-label">On Hold</span>
              <strong className="metric-value">{onHoldCount}</strong>
              <span className="metric-note">Requests needing staff follow-up or missing requirement review</span>
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

          <section className="dashboard-grid">
            <div className="panel panel-wide">
              <div className="panel-header">
                <div>
                  <span className="section-kicker">Immediate Attention</span>
                  <h3 className="panel-title">Priority Queue</h3>
                </div>
                <Link href="/staff/dashboard/request-queue" className="panel-link">
                  View Full Queue
                </Link>
              </div>

              {urgentRequests.length > 0 ? (
                <div className="priority-list">
                  {urgentRequests.map((item) => (
                    <Link key={item.key} href={item.href} className="priority-item">
                      <span className={`priority-indicator ${item.tone}`}></span>
                      <div className="priority-body">
                        <p className="priority-title">{item.title}</p>
                        <p className="priority-subtitle">{item.subtitle}</p>
                      </div>
                      <span className="priority-meta">{item.meta}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="panel-empty-state">No urgent hold requests or open escalations right now.</div>
              )}
            </div>

            <div className="panel">
              <div className="panel-header">
                <div>
                  <span className="section-kicker">Newly Added</span>
                  <h3 className="panel-title">Recent Students</h3>
                </div>
                <Link href="/staff/dashboard/student-list" className="panel-link">
                  Student List
                </Link>
              </div>

              {latestStudents.length > 0 ? (
                <div className="student-stack">
                  {latestStudents.map((student) => (
                    <div className="student-item" key={student.id}>
                      <div className="student-avatar">
                        {(student.first_name || "S").charAt(0)}
                      </div>
                      <div className="student-body">
                        <p className="student-name">{student.full_name || `${student.first_name || ""} ${student.last_name || ""}`.trim() || "Student"}</p>
                        <p className="student-program">{studentProgram(student)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="panel-empty-state">No student records available.</div>
              )}
            </div>
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
                            <Link className="btn btn-sm btn-outline-info rounded-pill" href={`/staff/dashboard/request-queue/${request.id}`}>
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

        .operations-hero {
          display: grid;
          grid-template-columns: minmax(0, 1.8fr) minmax(300px, 0.9fr);
          gap: 20px;
          margin-bottom: 20px;
        }

        .operations-copy,
        .hero-focus-card,
        .metric-card,
        .panel {
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid rgba(19, 50, 136, 0.08);
          box-shadow: 0 18px 44px rgba(19, 50, 136, 0.08);
        }

        .operations-copy {
          padding: 28px;
          background:
            radial-gradient(circle at top right, rgba(115, 148, 255, 0.18), transparent 36%),
            linear-gradient(135deg, #ffffff 0%, #eef3ff 55%, #f7f9ff 100%);
        }

        .section-kicker {
          display: inline-block;
          font-size: 0.74rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #6b7697;
        }

        .operations-title,
        .panel-title,
        .focus-title {
          color: #1b2753;
          font-weight: 800;
        }

        .operations-title {
          margin: 12px 0;
          font-size: clamp(1.8rem, 3vw, 2.7rem);
          line-height: 1.04;
          max-width: 640px;
        }

        .operations-description,
        .focus-description,
        .metric-note,
        .panel-empty-state,
        .student-program,
        .priority-subtitle {
          color: #667390;
          line-height: 1.6;
        }

        .operations-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 22px;
        }

        .hero-primary-btn,
        .hero-secondary-btn,
        .focus-link,
        .panel-link,
        .table-action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: 160ms ease;
        }

        .hero-primary-btn {
          min-height: 46px;
          padding: 0 18px;
          border-radius: 999px;
          background: #133288;
          color: #fff;
          font-weight: 700;
        }

        .hero-secondary-btn {
          min-height: 46px;
          padding: 0 18px;
          border-radius: 999px;
          border: 1px solid rgba(19, 50, 136, 0.14);
          background: rgba(255, 255, 255, 0.9);
          color: #133288;
          font-weight: 700;
        }

        .hero-focus-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
        }

        .focus-label,
        .metric-label {
          font-size: 0.74rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #7280a1;
        }

        .focus-title {
          margin: 12px 0 10px;
          font-size: 1.3rem;
        }

        .focus-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
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

        .dashboard-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.5fr) minmax(280px, 0.9fr);
          gap: 20px;
          margin-bottom: 20px;
        }

        .panel {
          padding: 22px;
        }

        .panel-wide {
          min-height: 100%;
        }

        .panel-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 16px;
        }

        .priority-list,
        .student-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .priority-item {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 12px;
          align-items: center;
          padding: 14px 16px;
          border-radius: 15px;
          background: #f8faff;
          border: 1px solid rgba(19, 50, 136, 0.07);
          text-decoration: none;
        }

        .priority-indicator {
          width: 10px;
          height: 10px;
          border-radius: 999px;
        }

        .priority-indicator.warning {
          background: #c79511;
        }

        .priority-indicator.danger {
          background: #da3b3b;
        }

        .priority-title,
        .student-name {
          margin: 0;
          color: #1d2955;
          font-weight: 700;
        }

        .priority-subtitle,
        .student-program {
          margin: 2px 0 0;
          font-size: 0.9rem;
        }

        .priority-meta {
          font-size: 0.82rem;
          font-weight: 700;
          color: #7380a2;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .student-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid #edf1f7;
        }

        .student-item:last-child {
          border-bottom: 0;
        }

        .student-avatar {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #dce5ff;
          color: #133288;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
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
          .operations-hero,
          .dashboard-grid {
            grid-template-columns: 1fr;
          }

          .metrics-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 767px) {
          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .operations-copy,
          .hero-focus-card,
          .metric-card,
          .panel {
            padding: 18px;
          }

          .panel-header,
          .focus-meta {
            flex-direction: column;
            align-items: flex-start;
          }

          .priority-item {
            grid-template-columns: auto minmax(0, 1fr);
          }

          .priority-meta {
            grid-column: 2;
          }
        }
      `}</style>
    </div>
  );
}
