"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import useSessionStore from "@/store/session-store";

const menuItems = [
  { label: "Personal Info", href: "/student/dashboard/profile/personal_info", alertKey: "incomplete_personal_info" },
  { label: "Family Info", href: "/student/dashboard/profile/family_info", alertKey: "incomplete_family_info" },
  { label: "Academic Info", href: "/student/dashboard/profile/academic_info", alertKey: "incomplete_academic_info" },
  { label: "Deficiencies", href: "/student/dashboard/profile/deficiencies" },
  { label: "Account", href: "/student/dashboard/profile/account" },
];

export default function ProfileLayout({ children }) {
  const pathname = usePathname();
  const { currentUser, saveCurrentUser } = useSessionStore();

  useEffect(() => {
    let isMounted = true;

    const loadProfileCompletion = async () => {
      try {
        const response = await api("/api/v1/students/personal_info");
        let payload = null;

        try {
          payload = await response.json();
        } catch {
          payload = null;
        }

        if (!response.ok || !isMounted || !payload) return;

        saveCurrentUser({
          id: payload?.id,
          auth_id: payload?.auth_id,
          type: payload?.type || "Student",
          first_name: payload?.first_name || "",
          middle_name: payload?.middle_name || "",
          last_name: payload?.last_name || "",
          extension: payload?.extension || "",
          full_name: payload?.full_name || "",
          avatar_url: payload?.avatar_url || null,
          incomplete_personal_info: Boolean(payload?.incomplete_personal_info),
          incomplete_family_info: Boolean(payload?.incomplete_family_info),
          incomplete_academic_info: Boolean(payload?.incomplete_academic_info),
        });
      } catch {
        // no-op: badge falls back to current store state
      }
    };

    loadProfileCompletion();

    return () => {
      isMounted = false;
    };
  }, [pathname, saveCurrentUser]);

  return (
    <div style={{ backgroundColor: "#eef0f6", minHeight: "100vh" }}>
      <div className="container-fluid px-0">
        <div className="d-flex">
          <aside
            className="position-fixed"
            style={{ width: "220px", minHeight: "100vh", backgroundColor: "#9bb2e7", borderRight: "1px solid #8da3d4" }}
          >
            <nav>
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                const showAlert = item.alertKey ? Boolean(currentUser?.[item.alertKey]) : false;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`d-flex align-items-center justify-content-between text-decoration-none px-3 py-2 mb-1 ${
                      isActive ? "text-white fw-semibold" : "text-dark"
                    }`}
                    style={isActive ? { backgroundColor: "#102f95" } : {}}
                  >
                    <span>{isActive ? `→ ${item.label}` : item.label}</span>
                    {showAlert ? (
                      <span
                        className="d-inline-flex align-items-center justify-content-center text-white"
                        style={{ width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "#ef1f23", fontSize: "11px" }}
                      >
                        !
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <main className="flex-grow-1 px-4 py-3" style={{marginLeft: 220}}>
            <div className="pb-4">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
