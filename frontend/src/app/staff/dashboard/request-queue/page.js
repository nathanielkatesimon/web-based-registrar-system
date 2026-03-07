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
              ? "text-success"
              : value === "On Hold"
                ? "text-warning"
                : value === "Closed"
                  ? "text-danger" 
                  : "text-info";
          return `<span class="fw-semibold ${tone}">${value}</span>`;
        },
      },
      { title: "Paid or Not", data: "payment" },
      {
        title: "",
        data: "id",
        orderable: false,
        searchable: false,
        render: (id) =>
          `<a class="rq-check-btn" href="/staff/dashboard/request-queue/${id}">Check</a>`,
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
    <div className="px-12 flex-grow-1 py-4 request-queue-page">
      <div className="p-4 rounded-4">
        <div className="rq-toolbar d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div className="rq-filters d-flex flex-wrap align-items-center gap-2">
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
          <div className="input-group input-group-merge rq-search-wrap rounded-pill">
            <span className="input-group-text" id="basic-addon-search31"><i className="bx bx-search"></i></span>
            <input
              type="text"
              className="form-control"
              placeholder="Search..."
              aria-label="Search..."
              aria-describedby="basic-addon-search31"
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="rq-state">Loading requests...</div>
        ) : error ? (
          <div className="rq-state rq-state-error">{error}</div>
        ) : (
          <div className="rq-table-wrap rounded-3 overflow-hidden">
            <DataTable
              ref={tableRef}
              data={requests}
              columns={columns}
              className="table align-middle w-100 request-queue-table"
              options={{
                paging: true,
                pageLength: 15,
                info: false,
                ordering: false,
                searching: true,
                lengthChange: false,
                dom: "tp",
                language: {
                  emptyTable: "No requests found.",
                  zeroRecords: "No requests match your filters.",
                },
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
