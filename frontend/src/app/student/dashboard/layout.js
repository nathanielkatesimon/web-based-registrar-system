"use client";

import AuthRequiredGuard from "@/components/features/auth/auth-required-guard";
import LogoutButton from "@/components/features/auth/logout-button";
import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import useSessionStore from "@/store/session-store";
import useStudentDocumentRequestStore from "@/store/student/requests/document_request_store";

export default function StudentDashboardLayout({children}) {
  const { currentUser } = useSessionStore();
  const pathname = usePathname();
  const requestStep = useStudentDocumentRequestStore((state) => state.step);
  const resetRequestFlow = useStudentDocumentRequestStore((state) => state.resetRequestFlow);

  const avatarSrc = useMemo(() => {
    const source = currentUser?.avatar_url;
    if (!source) return "/avatar_placeholder.webp";
    if (source.startsWith("http")) return source;
    return `${process.env.NEXT_PUBLIC_API_URL || ""}${source}`;
  }, [currentUser?.avatar_url]);

  const displayName = currentUser?.full_name || "Student";
  const showProfileBadge = Boolean(
    currentUser?.incomplete_personal_info ||
    currentUser?.incomplete_family_info ||
    currentUser?.incomplete_academic_info
  );
  const isExactMatch = (route) => pathname === route;
  const isRoutePrefix = (route) => pathname?.startsWith(route);

  return (
    <AuthRequiredGuard requiredType="Student">
    <div className="layout-wrapper layout-content-navbar">
          <div className="layout-container">
            <aside id="layout-menu" className="layout-menu menu-vertical menu bg-menu-theme" data-bg-class="bg-menu-theme">
              <div className="app-brand px-3 py-5">
                <Image src="/icon.png" width={84} height={84} alt="icon" />
                <div>
                  <div className="app-brand-text text-primary demo menu-text fw-bold ms-2 fs-3">E-Regis</div>
                  <div className="app-brand-text demo menu-text fw-bold ms-2 fs-6">Online System</div>
                </div>
              </div>
    
              <div className="menu-inner-shadow"></div>
    
              <ul className="menu-inner py-1 overflow-auto">
                <li className={`menu-item ${isExactMatch("/student/dashboard") ? "active" : ""}`}>
                  <Link href="/student/dashboard" className="menu-link fs-5">
                    <i className="menu-icon tf-icons pb-1 bx bx-dashboard"></i>
                    <div className="text-truncate" data-i18n="Dashboards">Dashboard</div>
                  </Link>
                </li>
                <li className={`menu-item ${isRoutePrefix("/student/dashboard/requests") ? "active" : ""}`}>
                  <Link
                    href="/student/dashboard/requests"
                    className="menu-link fs-5"
                    onClick={() => {
                      if (requestStep === 5) resetRequestFlow();
                    }}
                  >
                    <i className="menu-icon tf-icons pb-1 bx bx-file-detail"></i>
                    <div className="text-truncate" data-i18n="Dashboards">Requests</div>
                  </Link>
                </li>
                <li className={`menu-item ${isRoutePrefix("/student/dashboard/tracker") ? "active" : ""}`}>
                  <Link href="/student/dashboard/tracker" className="menu-link fs-5">
                    <i className="menu-icon tf-icons pb-1 bx bx-chart-bar-rows"></i>
                    <div className="text-truncate" data-i18n="Dashboards">Tracker</div>
                  </Link>
                </li>
                <li className={`menu-item ${isRoutePrefix("/student/dashboard/escalations") ? "active" : ""}`}>
                  <Link href="/student/dashboard/escalations" className="menu-link fs-5">
                    <i className="menu-icon tf-icons pb-1 bx bx-message-circle-exclamation"></i>
                    <div className="text-truncate" data-i18n="Dashboards">Escalations</div>
                  </Link>
                </li>
                <li className={`menu-item ${isRoutePrefix("/student/dashboard/profile") ? "active" : ""}`}>
                  <Link href="/student/dashboard/profile/personal_info" className="menu-link fs-5">
                    <i className="menu-icon tf-icons pb-1 bx bx-user"></i>
                    <div className="text-truncate" data-i18n="Dashboards">Profile</div>
                    {showProfileBadge ? (
                      <span
                        className="d-inline-flex align-items-center justify-content-center text-white ms-auto"
                        style={{ width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "#ef1f23", fontSize: "11px" }}
                      >
                        !
                      </span>
                    ) : null}
                  </Link>
                </li>
              </ul>
            </aside>
    
            <div className="layout-page">
    
              <nav className="layout-navbar container-fluid navbar navbar-expand-xl navbar-detached align-items-center bg-navbar-theme mt-0 mb-0 rounded-0" id="layout-navbar">
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
                    <li className="nav-item dropdown-notifications navbar-dropdown dropdown btn-label-info rounded-circle me-4 d-flex" style={{width: 40, height: 40}}>
                      <a className="nav-link dropdown-toggle hide-arrow mx-auto" href="javascript:void(0);" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false">
                        <span className="position-relative">
                          <i className="bx bx-bell bx-md"></i>
                          <span className="badge rounded-pill bg-danger badge-dot badge-notifications border"></span>
                        </span>
                      </a>
                      <ul className="dropdown-menu dropdown-menu-end p-0">
                        <li className="dropdown-menu-header border-bottom">
                          <div className="dropdown-header d-flex align-items-center py-3">
                            <h6 className="mb-0 me-auto">Notification</h6>
                            <div className="d-flex align-items-center h6 mb-0">
                              <span className="badge bg-label-primary me-2">8 New</span>
                              <a href="javascript:void(0)" className="dropdown-notifications-all p-2" data-bs-toggle="tooltip" data-bs-placement="top" aria-label="Mark all as read" data-bs-original-title="Mark all as read"><i className="bx bx-envelope-open text-heading"></i></a>
                            </div>
                          </div>
                        </li>
                      </ul>
                    </li>
                    <li className="nav-item navbar-dropdown dropdown-user dropdown">
                      <a className="nav-link dropdown-toggle hide-arrow p-0" href="javascript:void(0);" data-bs-toggle="dropdown">
                        <div className="avatar" style={{bottom: "0.4rem"}}>
                          <img src={avatarSrc} alt="User avatar" className="w-px-52 h-auto rounded-circle" />
                        </div>
                      </a>
                      <ul className="dropdown-menu dropdown-menu-end">
                        <li>
                          <a className="dropdown-item" href="pages-account-settings-account.html">
                            <div className="d-flex">
                              <div className="flex-shrink-0 me-3">
                                <div className="avatar avatar-online">
                                  <img src={avatarSrc} alt="User avatar" />
                                </div>
                              </div>
                              <div className="flex-grow-1">
                                <h6 className="mb-0">{displayName}</h6>
                                <small className="text-muted">{currentUser?.type || "Student"}</small>
                              </div>
                            </div>
                          </a>
                        </li>
                        <li>
                          <div className="dropdown-divider my-1"></div>
                        </li>
                        <li>
                          <Link className="dropdown-item d-flex align-items-end" href="/student/dashboard/profile/personal_info">
                            <i className="bx bx-user bx-md me-3"></i><span>My Profile</span>
                          </Link>
                        </li>
                        <li>
                          <div className="dropdown-divider my-1"></div>
                        </li>
                        <li>
                          <LogoutButton/>
                        </li>
                      </ul>
                    </li>
                  </ul>
                </div>
              </nav>
    
              <div className="content-wrapper">
                {children}
              </div>
            </div>
          </div>
        </div>
    </AuthRequiredGuard>
  );
}
