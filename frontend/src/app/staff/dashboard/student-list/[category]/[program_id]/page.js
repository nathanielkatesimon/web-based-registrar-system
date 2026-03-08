"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import { api } from "@/lib/api";
import { PROGRAM_OPTIONS } from "../../program-options";

DataTable.use(DT);

const STATUS_LABELS = {
  currently_enrolled: "Regular",
  transferee: "Transferee",
  returnee: "Returnee",
  graduated: "Graduate",
};
const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "currently_enrolled", label: "Currently Enrolled" },
  { value: "transferee", label: "Transferee" },
  { value: "returnee", label: "Returnee" },
  { value: "graduated", label: "Graduated" },
];

const PROGRAM_FILTERS = {
  "diploma-in-web-application-development-technology": {
    courseOrTrack: "diploma_in_web_application_technology",
    courseCode: "WADT",
  },
  "diploma-in-office-administration-technology": {
    courseOrTrack: "diploma_in_office_administration_technology",
    courseCode: "DOAT",
  },
  "diploma-in-office-management-technology": {
    courseOrTrack: "diploma_in_office_management_technology",
    courseCode: "DOMT",
  },
  "diploma-in-hotel-and-restaurant-technology": {
    courseOrTrack: "diploma_in_hotel_and_restaurant_technology",
    courseCode: "DHRT",
  },
  "bachelor-of-science-in-information-technology": {
    courseOrTrack: "bachelor_of_science_in_information_technology",
    courseCode: "BSIT",
  },
  "bachelor-of-science-in-computer-science": {
    courseOrTrack: "bachelor_of_science_in_computer_science",
    courseCode: "BSCS",
  },
  "bachelor-of-science-in-business-administration": {
    courseOrTrack: "bachelor_of_science_in_business_administration",
    courseCode: "BSBA",
  },
  "bachelor-of-science-in-hospitality-management": {
    courseOrTrack: "bachelor_of_science_in_hospitality_management",
    courseCode: "BSHM",
  },
  "science-technology-engineering-and-mathematics": {
    courseOrTrack: "academic_track",
    strand: "STEM",
    courseCode: "STEM",
  },
  "humanities-and-social-sciences": {
    courseOrTrack: "academic_track",
    strand: "HUMSS",
    courseCode: "HUMSS",
  },
  "accountancy-business-and-management": {
    courseOrTrack: "academic_track",
    strand: "ABM",
    courseCode: "ABM",
  },
  "general-academics": {
    courseOrTrack: "academic_track",
    strand: "GA",
    courseCode: "GA",
  },
  "tvl-computer-systems-servicing": {
    courseOrTrack: "technical_vocational_livelihood",
    strand: "TVL - CSS",
    courseCode: "TVL - CSS",
  },
  "tvl-programming": {
    courseOrTrack: "technical_vocational_livelihood",
    strand: "TVL - Programming",
    courseCode: "TVL - Programming",
  },
  "tvl-animation": {
    courseOrTrack: "technical_vocational_livelihood",
    strand: "TVL - Animation",
    courseCode: "TVL - Animation",
  },
  "tvl-home-economics": {
    courseOrTrack: "technical_vocational_livelihood",
    strand: "TVL - HE",
    courseCode: "TVL - HE",
  },
};

const COLLEGE_YEAR_FILTERS = ["All Students", "1st Year", "2nd Year", "3rd Year", "4th Year"];
const SHS_YEAR_FILTERS = ["All Students", "Grade 11", "Grade 12"];

function canonicalCategory(value) {
  if (value === "college") return "college";
  if (value === "senior-high-school" || value === "senior_high" || value === "shs") return "shs";
  return null;
}

function statusToneClass(label) {
  if (label === "Regular") return "text-success";
  if (label === "Transferee") return "text-warning";
  if (label === "Graduate") return "text-danger";
  return "text-primary";
}

function buildName(student) {
  if (student?.full_name) return student.full_name;
  const first = student?.first_name || "";
  const middle = student?.middle_name || "";
  const last = student?.last_name || "";
  const extension = student?.extension || "";
  const combined = [first, middle, last, extension].filter(Boolean).join(" ").trim();
  return combined || "Student unavailable";
}

function toYearDisplay(yearLevel, category) {
  if (!yearLevel) return "-";
  const normalized = String(yearLevel);
  if (category === "shs") return `Grade ${normalized}`;
  return `${normalized} Year`;
}

function matchesProgram(profile, category, filter) {
  if (!profile) return false;

  if (category === "college") {
    return profile.course === filter.courseOrTrack;
  }

  if (!filter.strand) return profile.track === filter.courseOrTrack;
  return profile.strand === filter.strand || profile.current_senior_high_program === filter.strand;
}

function normalizeStudentRow(student, category, filter) {
  const profile = student?.student_profile || {};
  const statusLabel = STATUS_LABELS[profile?.status] || "Regular";

  return {
    id: student?.id,
    studentName: buildName(student),
    usn: student?.auth_id || student?.usn || "-",
    yearLevel: toYearDisplay(profile?.year_level, category),
    status: statusLabel,
    course: filter.courseCode,
  };
}

export default function StudentListProgramPage() {
  const { category: rawCategory, program_id: programId } = useParams();

  const tableRef = useRef(null);
  const [activeFilter, setActiveFilter] = useState("All Students");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const category = canonicalCategory(rawCategory);
  const program = useMemo(
    () => PROGRAM_OPTIONS.find((item) => item.id === programId && item.category === category),
    [programId, category],
  );
  const statusFilterLabel =
  STATUS_FILTER_OPTIONS.find((option) => option.value === statusFilter)?.label || "All Statuses";
  const programFilter = programId ? PROGRAM_FILTERS[programId] : null;
  const yearFilters = category === "college" ? COLLEGE_YEAR_FILTERS : SHS_YEAR_FILTERS;

  const columns = useMemo(
    () => [
      { title: "Student Name", data: "studentName" },
      { title: "USN", data: "usn" },
      { title: "Year Level", data: "yearLevel" },
      {
        title: "Status",
        data: "status",
        render: (value) => `<span class="fw-semibold ${statusToneClass(value)}">${value}</span>`,
      },
      { title: "Course", data: "course" },
      {
        title: "",
        data: "id",
        orderable: false,
        searchable: false,
        render: (id) =>
          `<a class="rq-check-btn" href="/staff/dashboard/student-list/student-profile/${id}/personal_info?category=${category}&program_id=${programId}">Check</a>`,
      },
    ],
    [category, programId],
  );

  useEffect(() => {
    if (!program || !category || !programFilter) {
      setLoading(false);
      setRows([]);
      setError("Invalid category or program.");
      return;
    }

    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError("");

        const schoolLevel = category === "college" ? "college" : "senior_high";
        const query = new URLSearchParams({
          school_level: schoolLevel,
          course_or_track: programFilter.courseOrTrack,
        });

        const response = await api(`/api/v1/students?${query.toString()}`);
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Failed to load student list.");
        }

        const list = Array.isArray(payload) ? payload : [];
        const filtered = list.filter((student) => matchesProgram(student?.student_profile, category, programFilter));
        setRows(filtered.map((student) => normalizeStudentRow(student, category, programFilter)));
      } catch (fetchError) {
        setError(fetchError?.message || "Failed to load student list.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [program, category, programFilter]);

  useEffect(() => {
    if (!tableRef.current?.dt) return;
    const dtApi = tableRef.current.dt();

    if (activeFilter === "All Students") {
      dtApi.column(2).search("");
    } else {
      dtApi.column(2).search(`^${activeFilter}$`, true, false);
    }

    if (statusFilter === "all") {
      dtApi.column(3).search("");
    } else {
      dtApi.column(3).search(`^${STATUS_LABELS[statusFilter] || ""}$`, true, false);
    }

    dtApi.search(searchTerm).draw();
  }, [activeFilter, statusFilter, searchTerm]);

  if (!program || !category || !programFilter) {
    return (
      <div className="px-12 flex-grow-1 py-4 request-queue-page">
        <div className="rq-state rq-state-error">Invalid category or program.</div>
      </div>
    );
  }

  return (
    <div className="px-12 flex-grow-1 py-4 request-queue-page student-list-program-page">
      <div className="p-4 rounded-4">
        <div className="d-flex align-items-center gap-2">
          <Link href={`/staff/dashboard/student-list?category=${category}`} className="text-decoration-none text-dark p-0 m-0">
            <i className="bx bx-chevron-left fs-3 pt-1"></i>
          </Link>
          <h5 className="fw-semibold m-0 p-0 text-dark">{program.label}</h5>
        </div>

        <div className="rq-toolbar d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div className="rq-filters d-flex flex-wrap align-items-center gap-2">
            {yearFilters.map((filter) => (
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

          <div className="d-flex align-items-center gap-2">
            <div className="input-group input-group-merge rq-search-wrap rounded-pill">
              <span className="input-group-text"><i className="bx bx-search"></i></span>
              <input
                type="text"
                className="form-control"
                placeholder="Search"
                aria-label="Search"
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <div className="position-relative">
              <button
                type="button"
                className="btn bg-white text-primary d-flex align-items-center justify-content-center"
                style={{ width: 37, height: 37, borderRadius: 10 }}
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
                  {STATUS_FILTER_OPTIONS.map((option) => (
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
        </div>

        {loading ? (
          <div className="rq-state">Loading students...</div>
        ) : error ? (
          <div className="rq-state rq-state-error">{error}</div>
        ) : (
          <div className="rq-table-wrap rounded-3 overflow-hidden">
            <DataTable
              ref={tableRef}
              data={rows}
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
                  emptyTable: "No students found.",
                  zeroRecords: "No students match your filters.",
                },
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
