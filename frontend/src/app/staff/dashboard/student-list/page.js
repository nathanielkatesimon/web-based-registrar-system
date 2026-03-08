"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { COLLEGE_PROGRAMS, SHS_PROGRAMS } from "./program-options";

function CategoryButton({ active, href, label }) {
  return (
    <Link
      href={href}
      className="btn d-flex align-items-center justify-content-center"
      style={{
        width: "min(100%, 240px)",
        height: "72px",
        borderRadius: "10px",
        backgroundColor: active ? "#b7bce6" : "#ffffff",
        border: `2px solid ${active ? "#1d2ec2" : "#e7e7e7"}`,
        boxShadow: active ? "none" : "0 8px 18px rgba(17, 26, 104, 0.07)",
        color: "#2d2d2d",
        fontWeight: 500,
      }}
    >
      {label}
    </Link>
  );
}

export default function StaffStudentListPage() {
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get("category") === "shs" ? "shs" : "college";

  const isCollege = selectedCategory === "college";
  const sectionTitle = isCollege ? "Courses" : "Strands";
  const entries = isCollege ? COLLEGE_PROGRAMS : SHS_PROGRAMS;

  return (
    <div className="flex-grow-1 p-4">
      <div className="card border-0 bg-transparent shadow-none">
        <div className="card-body p-4 p-md-5">
          <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap mb-4">
            <h4 className="fw-bold text-dark m-0">Category</h4>

            <Link
              href={`/staff/dashboard/student-list/new?category=${selectedCategory}`}
              className="btn p-0 d-flex align-items-center gap-2"
              style={{ color: "#1d2ec2", fontWeight: 500 }}
            >
              <span
                className="d-inline-flex align-items-center justify-content-center rounded-circle"
                style={{ width: "22px", height: "22px", backgroundColor: "#1d2ec2", color: "#fff", lineHeight: 1 }}
              >
                +
              </span>
              Add New Student
            </Link>
          </div>

          <div className="d-flex flex-wrap gap-3 mb-5">
            <CategoryButton active={isCollege} href="/staff/dashboard/student-list?category=college" label="College" />
            <CategoryButton active={!isCollege} href="/staff/dashboard/student-list?category=shs" label="Senior High School" />
          </div>

          <h4 className="fw-bold text-dark mb-4">{sectionTitle}</h4>

          <div className="d-flex flex-column gap-3">
            {entries.map((item) => (
              <Link
                key={item.id}
                href={`/staff/dashboard/student-list/${selectedCategory}/${item.id}`}
                className="text-decoration-none"
                style={{ color: "#2f2f35", fontSize: "24px", lineHeight: 1.15 }}
              >
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
