"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { PROGRAM_OPTIONS } from "@/app/staff/dashboard/student-list/program-options";

const menuItems = [
  { label: "Personal Info", key: "personal_info" },
  { label: "Family Info", key: "family_info" },
  { label: "Academic Info", key: "academic_info" },
  { label: "Deficiencies", key: "deficiencies" },
  { label: "Account", key: "account" },
];

export default function StaffStudentProfileLayout({ children }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { student_id: studentId } = useParams();
  const basePath = `/staff/dashboard/student-list/student-profile/${studentId}`;
  const category = searchParams.get("category") || "";
  const programId = searchParams.get("program_id") || "";
  const [studentFullName, setStudentFullName] = useState("");

  const selectedProgram = useMemo(
    () => PROGRAM_OPTIONS.find((item) => item.id === programId && item.category === category),
    [category, programId]
  );

  const categoryLabel = category === "college" ? "College" : category === "shs" ? "Senior High School" : "Category";
  const programLabel = selectedProgram?.label || "Program";

  useEffect(() => {
    let isMounted = true;

    const loadStudent = async () => {
      try {
        const response = await api(`/api/v1/students/${studentId}`);
        const payload = await response.json();
        if (!response.ok || !isMounted) return;
        console.log(payload)
        setStudentFullName(payload?.full_name || "");
      } catch {
        if (!isMounted) return;
        setStudentFullName("");
      }
    };

    if (studentId) loadStudent();

    return () => {
      isMounted = false;
    };
  }, [studentId]);

  return (
    <div style={{ backgroundColor: "#eef0f6", minHeight: "100%" }}>
      <div className="d-flex align-items-center flex-wrap gap-2 p-2 px-4 position-fixed w-100 shadow-sm" style={{backdropFilter: "saturate(200%) blur(6px)", backgroundColor: "#fffefee0", zIndex: 999}}>
        <Link href="/staff/dashboard/student-list" className="text-decoration-none text-info fw-semibold">
          Student List
        </Link>
        <i className="bx bx-chevron-right text-muted"></i>
        <Link
          href={category && programId ? `/staff/dashboard/student-list/${category}/${programId}` : "/staff/dashboard/student-list"}
          className="text-decoration-none text-info fw-semibold"
        >
          {categoryLabel} - {programLabel}
        </Link>
        <i className="bx bx-chevron-right text-muted"></i>
        <span className="text-info fw-semibold">{studentFullName || "Student"}</span>
      </div>
      <div className="container-fluid px-0"  style={{marginTop: 38.63}}>
        <div className="d-flex">
          <aside
            // style={{ width: "220px", minHeight: "calc(100vh - 64px)", backgroundColor: "#9bb2e7", borderRight: "1px solid #8da3d4" }}
            className="position-fixed"
            style={{ width: "220px", minHeight: "100vh", backgroundColor: "#9bb2e7", borderRight: "1px solid #8da3d4" }}
          >
            <nav>
              {menuItems.map((item) => {
                const tabPath = `${basePath}/${item.key}`;
                const href = `${tabPath}?category=${category}&program_id=${programId}`;
                const isActive = pathname === tabPath;

                return (
                  <Link
                    key={item.key}
                    href={href}
                    className={`d-flex align-items-center text-decoration-none px-3 py-2 mb-1 ${
                      isActive ? "text-white fw-semibold" : "text-dark"
                    }`}
                    style={isActive ? { backgroundColor: "#102f95" } : {}}
                  >
                    <span>{isActive ? `\u2192 ${item.label}` : item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          <main className="flex-grow-1 px-4 py-3" style={{marginLeft: "220px"}}>
            <div className="pb-4">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
