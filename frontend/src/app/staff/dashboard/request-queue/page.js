"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import { api } from "@/lib/api";

DataTable["use"](DT);

const STATUS_FILTERS = ["All Requests", "Processing", "On Hold", "Completed"];

const STATUS_LABELS = {
  on_hold: "On Hold",
  processing: "Processing",
  completed: "Completed",
  closed: "Closed",
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

function normalizeRequestRow(request) {
  const statusLabel = STATUS_LABELS[request?.status] || "On Hold";
  const paymentLabel = PAYMENT_LABELS[request?.payment_status] || "Not Paid";
  const studentName =
    request?.student_name || request?.student?.full_name || request?.user?.full_name || "Student unavailable";

  return {
    id: request?.id,
    studentName,
    requestId: request?.request_id || "-",
    date: formatDate(request?.created_at),
    status: statusLabel,
    payment: paymentLabel,
  };
}

export default function StaffRequestQueuePage() {
  const tableRef = useRef(null);
  const [activeFilter, setActiveFilter] = useState("All Requests");
  const [searchTerm, setSearchTerm] = useState("");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const columns = useMemo(
    () => [
      { title: "Student Name", data: "studentName" },
      { title: "Request ID", data: "requestId" },
      { title: "Date", data: "date" },
      {
        title: "Status",
        data: "status",
        render: (value) => {
          const tone =
            value === "Completed"
              ? "rq-status-completed"
              : value === "On Hold"
                ? "rq-status-hold"
                : "rq-status-processing";
          return `<span class="rq-status ${tone}">${value}</span>`;
        },
      },
      { title: "Paid or Not", data: "payment" },
      {
        title: "",
        data: null,
        orderable: false,
        searchable: false,
        render: () => '<button type="button" class="rq-check-btn" disabled>Check</button>',
      },
    ],
    [],
  );

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api("/api/v1/document_requests");
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Failed to load request queue.");
        }

        const list = Array.isArray(payload) ? payload : [];
        setRequests(list.map(normalizeRequestRow));
      } catch (fetchError) {
        setError(fetchError?.message || "Failed to load request queue.");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  useEffect(() => {
    if (!tableRef.current?.dt) return;
    const api = tableRef.current.dt();

    if (activeFilter === "All Requests") {
      api.column(3).search("");
    } else {
      api.column(3).search(`^${activeFilter}$`, true, false);
    }

    api.search(searchTerm).draw();
  }, [activeFilter, searchTerm]);

  return (
    <div className="container-xxl flex-grow-1 py-4 request-queue-page">
      <div className="rq-card">
        <div className="rq-toolbar">
          <div className="rq-filters">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                className={`rq-filter-btn ${activeFilter === filter ? "active" : ""}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="rq-search-wrap">
            <i className="bx bx-search"></i>
            <input
              type="text"
              className="rq-search-input"
              placeholder="Search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="rq-state">Loading requests...</div>
        ) : error ? (
          <div className="rq-state rq-state-error">{error}</div>
        ) : (
          <div className="rq-table-wrap">
            <DataTable
              ref={tableRef}
              data={requests}
              columns={columns}
              className="table align-middle w-100 request-queue-table"
              options={{
                paging: false,
                info: false,
                ordering: false,
                searching: true,
                lengthChange: false,
                dom: "t",
                language: {
                  emptyTable: "No requests found.",
                  zeroRecords: "No requests match your filters.",
                },
              }}
            />
          </div>
        )}
      </div>

      <style jsx global>{`
        .request-queue-page .rq-card {
          background: #e8edff;
          border-radius: 24px;
          padding: 1.1rem 1.1rem 1.2rem;
        }

        .request-queue-page .rq-toolbar {
          display: flex;
          gap: 1rem;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .request-queue-page .rq-filters {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .request-queue-page .rq-filter-btn {
          border: 0;
          background: transparent;
          color: #6480b3;
          font-size: 1rem;
          font-weight: 500;
          padding: 0.45rem 0.65rem;
          border-radius: 10px;
          transition: color 0.2s ease;
        }

        .request-queue-page .rq-filter-btn.active {
          color: #001fbb;
          font-weight: 600;
        }

        .request-queue-page .rq-search-wrap {
          width: min(100%, 300px);
          background: #f7f7f8;
          border-radius: 999px;
          display: flex;
          align-items: center;
          padding: 0 0.95rem;
          color: #717376;
        }

        .request-queue-page .rq-search-wrap i {
          font-size: 1.1rem;
        }

        .request-queue-page .rq-search-input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: #45484e;
          padding: 0.62rem 0.55rem;
        }

        .request-queue-page .rq-table-wrap {
          background: #ffffff;
          border-radius: 20px;
          overflow: hidden;
          padding: 0 1rem;
        }

        .request-queue-page .rq-state {
          background: #ffffff;
          border-radius: 20px;
          min-height: 170px;
          display: grid;
          place-items: center;
          color: #55607c;
          font-weight: 500;
          padding: 1rem;
        }

        .request-queue-page .rq-state-error {
          color: #bf2d2d;
        }

        .request-queue-page .dt-container .dt-layout-row {
          margin: 0;
          display: none;
        }

        .request-queue-page .request-queue-table thead th {
          border-bottom: 1px solid #dbe2ef;
          color: #121f44;
          font-weight: 700;
          font-size: 1rem;
          padding: 1rem 1.15rem;
          white-space: nowrap;
        }

        .request-queue-page .request-queue-table tbody td {
          border-bottom: 1px solid #dbe2ef;
          padding: 0.86rem 1.15rem;
          color: #34373f;
          vertical-align: middle;
        }

        .request-queue-page .rq-status {
          font-weight: 500;
        }

        .request-queue-page .rq-status-processing {
          color: #1f30ff;
        }

        .request-queue-page .rq-status-completed {
          color: #31b215;
        }

        .request-queue-page .rq-status-hold {
          color: #c59800;
        }

        .request-queue-page .rq-check-btn {
          border: 2px solid #0f318e;
          border-radius: 999px;
          background: #ffffff;
          color: #0f318e;
          font-weight: 600;
          font-size: 1rem;
          padding: 0.23rem 1.2rem;
          min-width: 82px;
          opacity: 1;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .request-queue-page .rq-card {
            border-radius: 18px;
            padding: 0.85rem;
          }

          .request-queue-page .rq-table-wrap {
            border-radius: 14px;
            padding: 0 0.6rem;
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  );
}
