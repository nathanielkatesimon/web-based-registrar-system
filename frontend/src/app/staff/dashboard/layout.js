"use client";

import AuthRequiredGuard from "@/components/features/auth/auth-required-guard";
import LogoutButton from "@/components/features/auth/logout-button";
import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import useSessionStore from "@/store/session-store";

export default function StaffDashboardLayout({ children }) {
  const { currentUser } = useSessionStore();
  const pathname = usePathname();

  const avatarSrc = useMemo(() => {
    const source = currentUser?.avatar_url;
    if (!source) return "/avatar_placeholder.webp";
    if (source.startsWith("http")) return source;
    return `${process.env.NEXT_PUBLIC_API_URL || ""}${source}`;
  }, [currentUser?.avatar_url]);

  const displayName = currentUser?.full_name || "Staff";
  const isExactMatch = (route) => pathname === route;
  const isRoutePrefix = (route) => pathname?.startsWith(route);

  return (
    <AuthRequiredGuard requiredType="Staff">
      <div className="layout-wrapper layout-content-navbar">
        <div className="layout-container">
          <aside
            id="layout-menu"
            className="layout-menu menu-vertical menu bg-menu-theme"
            data-bg-class="bg-menu-theme"
          >
            <div className="app-brand px-3 py-5">
              <Image src="/icon.png" width={84} height={84} alt="icon" />
              <div>
                <div className="app-brand-text text-primary demo menu-text fw-bold ms-2 fs-3">E-Regis</div>
                <div className="app-brand-text demo menu-text fw-bold ms-2 fs-6">Online System</div>
              </div>
            </div>

            <div className="menu-inner-shadow"></div>

            <ul className="menu-inner py-1 overflow-auto">
              <li className={`menu-item ${isExactMatch("/staff/dashboard") ? "active" : ""}`}>
                <Link href="/staff/dashboard" className="menu-link fs-5">
                  <i className="menu-icon tf-icons pb-1 bx bx-dashboard"></i>
                  <div className="text-truncate">Dashboard</div>
                </Link>
              </li>
              <li className={`menu-item ${isRoutePrefix("/staff/dashboard/request-queue") ? "active" : ""}`}>
                <Link href="/staff/dashboard/request-queue" className="menu-link fs-5">
                  <i className="menu-icon tf-icons bx bx-inbox"></i>
                  <div className="text-truncate">Request Queue</div>
                </Link>
              </li>
              <li className={`menu-item ${isRoutePrefix("/staff/dashboard/student-list") ? "active" : ""}`}>
                <Link href="/staff/dashboard/student-list" className="menu-link fs-5">
                  <i className="menu-icon tf-icons bx bx-community"></i>
                  <div className="text-truncate">Student List</div>
                </Link>
              </li>
              <li className={`menu-item ${isRoutePrefix("/staff/dashboard/escalations") ? "active" : ""}`}>
                <Link href="/staff/dashboard/escalations" className="menu-link fs-5">
                  <i className="menu-icon tf-icons pb-1 bx bx-message-circle-exclamation"></i>
                  <div className="text-truncate">Escalations</div>
                </Link>
              </li>
              <li className={`menu-item ${isRoutePrefix("/staff/dashboard/documents") ? "active" : ""}`}>
                <Link href="/staff/dashboard/documents" className="menu-link fs-5">
                  <i className="menu-icon tf-icons pb-1 bx bx-file"></i>
                  <div className="text-truncate">Documents</div>
                </Link>
              </li>
              <li className={`menu-item ${isRoutePrefix("/staff/dashboard/profile") ? "active" : ""}`}>
                <Link href="/staff/dashboard/profile" className="menu-link fs-5">
                  <i className="menu-icon tf-icons pb-1 bx bx-user"></i>
                  <div className="text-truncate">Profile</div>
                </Link>
              </li>
            </ul>
          </aside>

          <div className="layout-page">
            <nav
              className="layout-navbar container-fluid navbar navbar-expand-xl navbar-detached align-items-center bg-navbar-theme mt-0 mb-0 rounded-0"
              id="layout-navbar"
            >
              <div className="layout-menu-toggle navbar-nav align-items-xl-center me-4 me-xl-0 d-xl-none">
                <a className="nav-item nav-link px-0 me-xl-6" href="javascript:void(0)">
                  <i className="bx bx-menu bx-md"></i>
                </a>
              </div>

              <div className="navbar-nav-right d-flex align-items-center" id="navbar-collapse">
                <div className="d-none d-md-block">
                  <h3 className="m-0 p-0 text-info fw-bold">Hello {displayName}!</h3>
                  <p className="m-0 p-0">How can we help you today?</p>
                </div>

                <ul className="navbar-nav flex-row align-items-center ms-auto">
                  <li className="nav-item navbar-dropdown dropdown-user dropdown">
                    <a className="nav-link dropdown-toggle hide-arrow p-0" href="javascript:void(0);" data-bs-toggle="dropdown">
                      <div className="avatar" style={{ bottom: "0.4rem" }}>
                        <img src={avatarSrc} alt="User avatar" className="w-px-52 h-auto rounded-circle" />
                      </div>
                    </a>
                    <ul className="dropdown-menu dropdown-menu-end">
                      <li>
                        <div className="dropdown-item bg-white user-select-none">
                          <div className="d-flex">
                            <div className="flex-shrink-0 me-3">
                              <div className="avatar avatar-online">
                                <img src={avatarSrc} alt="User avatar" />
                              </div>
                            </div>
                            <div className="flex-grow-1">
                              <h6 className="mb-0">{displayName}</h6>
                              <small className="text-muted">{currentUser?.type || "Staff"}</small>
                            </div>
                          </div>
                        </div>
                      </li>
                      <li>
                        <div className="dropdown-divider my-1"></div>
                      </li>
                      <li>
                        <Link className="dropdown-item d-flex align-items-end" href="/staff/dashboard/profile">
                          <i className="bx bx-user bx-md me-3"></i>
                          <span>My Profile</span>
                        </Link>
                      </li>
                      <li>
                        <div className="dropdown-divider my-1"></div>
                      </li>
                      <li>
                        <LogoutButton />
                      </li>
                    </ul>
                  </li>
                </ul>
              </div>
            </nav>

            <div className="content-wrapper">{children}</div>
          </div>
        </div>
      </div>
    </AuthRequiredGuard>
  );
}
