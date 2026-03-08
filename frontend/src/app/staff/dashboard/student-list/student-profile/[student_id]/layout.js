"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

const menuItems = [
  { label: "Personal Info", key: "personal_info" },
  { label: "Family Info", key: "family_info" },
  { label: "Academic Info", key: "academic_info" },
  { label: "Deficiencies", key: "deficiencies" },
  { label: "Account", key: "account" },
];

export default function StaffStudentProfileLayout({ children }) {
  const pathname = usePathname();
  const { student_id: studentId } = useParams();
  const basePath = `/staff/dashboard/student-list/student-profile/${studentId}`;

  return (
    <div style={{ backgroundColor: "#eef0f6", minHeight: "100%" }}>
      <div className="container-fluid px-0">
        <div className="d-flex">
          <aside
            style={{ width: "220px", minHeight: "calc(100vh - 64px)", backgroundColor: "#9bb2e7", borderRight: "1px solid #8da3d4" }}
          >
            <nav>
              {menuItems.map((item) => {
                const href = `${basePath}/${item.key}`;
                const isActive = pathname === href;

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

            <Link
              href="/staff/dashboard/student-list"
              className="d-inline-flex align-items-center gap-2 text-dark text-decoration-none px-3 py-2 mt-3"
            >
              <span className="small">X</span>
              <span className="small">Close</span>
            </Link>
          </aside>

          <main className="flex-grow-1 px-4 py-3">
            <div className="pb-4">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
