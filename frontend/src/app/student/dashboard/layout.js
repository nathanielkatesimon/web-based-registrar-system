"use client";

import AuthRequiredGuard from "@/components/features/auth/auth-required-guard";
import LogoutButton from "@/components/features/auth/logout-button";
import { getCableConsumer } from "@/lib/action-cable";
import { api } from "@/lib/api";
import ShowAlert from "@/lib/show-alert";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import useSessionStore from "@/store/session-store";
import useStudentDocumentRequestStore from "@/store/student/requests/document_request_store";

export default function StudentDashboardLayout({children}) {
  const { currentUser, csrfToken } = useSessionStore();
  const pathname = usePathname();
  const router = useRouter();
  const requestStep = useStudentDocumentRequestStore((state) => state.step);
  const resetRequestFlow = useStudentDocumentRequestStore((state) => state.resetRequestFlow);
  const [notifications, setNotifications] = useState([]);

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

  useEffect(() => {
    let isMounted = true;

    const loadNotifications = async () => {
      try {
        const response = await api("/api/v1/notifications");

        let payload = null;
        try {
          payload = await response.json();
        } catch {
          payload = null;
        }

        if (!response.ok || !isMounted) return;

        setNotifications(Array.isArray(payload) ? payload : []);
      } catch {
        if (isMounted) setNotifications([]);
      }
    };

    if (currentUser?.id) loadNotifications();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return undefined;

    const consumer = getCableConsumer();
    const subscription = consumer.subscriptions.create(
      { channel: "NotificationsChannel" },
      {
        received: (payload) => {
          if (payload?.event !== "notification_created" || !payload.notification) return;

          setNotifications((currentNotifications) => {
            const withoutDuplicate = currentNotifications.filter(
              (notification) => notification.id !== payload.notification.id
            );

            return [payload.notification, ...withoutDuplicate].slice(0, 10);
          });
        },
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id || !csrfToken || !showProfileBadge) return;

    const promptKey = `student-profile-incomplete-prompt:${currentUser.id}`;
    if (typeof window === "undefined" || window.sessionStorage.getItem(promptKey)) return;

    window.sessionStorage.setItem(promptKey, "shown");

    const showPrompt = async () => {
      const result = await ShowAlert({
        title: "Welcome!",
        html: `
          <div class="text-start px-8 pb-2">
            <h4 class="mb-3 text-dark fw-semibold">Complete Your Profile First</h4>
            <p class="mb-0 text-muted">
              Please take a moment to update and complete your profile information. This is required to ensure your records are accurate and up to date.
            </p>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: "Go to Profile",
        cancelButtonText: "Later",
        allowOutsideClick: false,
        customClass: {
          title: "m-0 px-8 pt-4 text-start text-info",
          htmlContainer: "m-0",
          confirmButton: "btn btn-primary w-100",
          cancelButton: "btn btn-outline-secondary w-100 mt-2 ms-0",
          actions: "w-100 px-8"
        },
      });

      if (result?.isConfirmed) {
        router.push("/student/dashboard/profile/personal_info");
      }
    };

    showPrompt();
  }, [currentUser?.id, showProfileBadge, router]);

  const isExactMatch = (route) => pathname === route;
  const isRoutePrefix = (route) => pathname?.startsWith(route);
  const unreadNotificationsCount = notifications.filter((notification) => !notification.read_at).length;
  const hasNotifications = notifications.length > 0;

  const handleNotificationClick = async (notificationId) => {
    try {
      await api(`/api/v1/notifications/${notificationId}/read`, {
        method: "PATCH",
      });

      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) =>
          notification.id === notificationId && !notification.read_at
            ? { ...notification, read_at: new Date().toISOString() }
            : notification
        )
      );
    } catch {}
  };

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
                    <li className="nav-item me-4 d-flex">
                      <button
                        type="button"
                        className="student-notifications-trigger nav-link hide-arrow bg-light text-info mx-auto border-0 rounded-circle btn-label-info d-flex align-items-center justify-content-center"
                        style={{ width: 40, height: 40 }}
                        data-bs-toggle="offcanvas"
                        data-bs-target="#studentNotificationsOffcanvas"
                        aria-controls="studentNotificationsOffcanvas"
                      >
                        <span className="position-relative">
                          <i className="bx bx-bell bx-md"></i>
                          {unreadNotificationsCount > 0 ? (
                            <span className="badge rounded-pill bg-danger badge-dot badge-notifications border mt-1 me-1"></span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                    <li className="nav-item navbar-dropdown dropdown-user dropdown">
                      <a className="nav-link dropdown-toggle hide-arrow p-0" href="javascript:void(0);" data-bs-toggle="dropdown">
                        <div className="avatar" style={{bottom: "0.4rem"}}>
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
                                <small className="text-muted">{currentUser?.type || "Student"}</small>
                              </div>
                            </div>
                          </div>
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

              <div
                className="offcanvas offcanvas-end"
                tabIndex="-1"
                id="studentNotificationsOffcanvas"
                aria-labelledby="studentNotificationsOffcanvasLabel"
                style={{ width: "360px", maxWidth: "100%" }}
              >
                <div className="offcanvas-header align-items-start px-4 pt-4 pb-3 border-bottom">
                  <div>
                    <h5 className="offcanvas-title fw-bold text-dark" id="studentNotificationsOffcanvasLabel">
                      Notifications
                    </h5>
                    <p className="mb-0 text-muted small">
                      {unreadNotificationsCount > 0
                        ? `${unreadNotificationsCount} unread update${unreadNotificationsCount > 1 ? "s" : ""}`
                        : "Document request updates"}
                    </p>
                  </div>
                </div>
                <div className="offcanvas-body px-4 py-4">
                  <div className="rounded-4 bg-white">
                    {hasNotifications ? (
                      <div className="d-flex flex-column gap-2">
                        {notifications.map((notification) => (
                          <Link
                            key={notification.id}
                            href={notification.link_url || "/student/dashboard/tracker"}
                            className="text-decoration-none"
                            onClick={() => handleNotificationClick(notification.id)}
                          >
                            <div
                              className="rounded-4 border p-3"
                              style={{
                                backgroundColor: notification.read_at ? "#f8f9fb" : "#eef2ff",
                                borderColor: notification.read_at ? "#e2e6ea" : "#cfd8ff",
                              }}
                            >
                              <div className="d-flex align-items-start gap-3">
                                <span
                                  className="d-inline-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                                  style={{
                                    width: "18px",
                                    height: "18px",
                                    borderRadius: "50%",
                                    backgroundColor: notification.read_at ? "#98a2b3" : "#133288",
                                    fontSize: "11px",
                                    marginTop: "2px"
                                  }}
                                >
                                  !
                                </span>
                                <div className="min-w-0">
                                  <p className="mb-1 text-dark fw-semibold small">{notification.title}</p>
                                  <p className="mb-2 text-muted small">{notification.message}</p>
                                  <p className="mb-0 text-info small">
                                    View request
                                    {notification.document_request?.request_id ? ` ${notification.document_request.request_id}` : ""}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="mb-0 text-muted small">No document request notifications yet.</p>
                    )}
                  </div>
                </div>
              </div>
    
              <div className="content-wrapper">
                {children}
              </div>
            </div>
          </div>
          <style jsx>{`
            .student-notifications-trigger,
            .student-notifications-trigger:hover,
            .student-notifications-trigger:focus,
            .student-notifications-trigger:active,
            .student-notifications-trigger.show {
              background-color: #e9ecef !important;
              color: #133288 !important;
              box-shadow: none !important;
            }

            .min-w-0 {
              min-width: 0;
            }
          `}</style>
        </div>
    </AuthRequiredGuard>
  );
}
