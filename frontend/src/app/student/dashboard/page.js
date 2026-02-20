import AuthRequiredGuard from "@/components/features/auth/auth-required-guard";
import LogoutButton from "@/components/features/auth/logout-button";

export default function StudentDashboardPage() {
  return (
    <AuthRequiredGuard requiredType="Student">
    <div className="layout-wrapper layout-content-navbar">
          <div className="layout-container">
            <aside id="layout-menu" className="layout-menu menu-vertical menu bg-menu-theme" data-bg-class="bg-menu-theme">
              <div className="app-brand demo">
                <a href="index.html" className="app-brand-link">
                  <span className="app-brand-text demo menu-text fw-bold ms-2 fs-1 my-8">BRAND</span>
                </a>
              </div>
    
              <div className="menu-inner-shadow"></div>
    
              <ul className="menu-inner py-1 overflow-auto">
                <li className="menu-item">
                  <a href="javascript:void(0);" className="menu-link menu-toggle">
                    <i className="menu-icon tf-icons bx bx-home-smile"></i>
                    <div className="text-truncate" data-i18n="Dashboards">Dashboards</div>
                    <span className="badge rounded-pill bg-danger ms-auto">5</span>
                  </a>
              </li>
              <li className="menu-item">
                <LogoutButton className="btn btn-danger"/>
              </li>
              </ul>
            </aside>
    
            <div className="layout-page">
    
              <nav className="layout-navbar container-fluid navbar navbar-expand-xl w-100 py-12 align-items-center bg-navbar-theme mt-0 mb-0 mx-0 rounded-0" id="layout-navbar">
                <div className="layout-menu-toggle navbar-nav align-items-xl-center me-4 me-xl-0 d-xl-none">
                  <a className="nav-item nav-link px-0 me-xl-6" href="javascript:void(0)">
                    <i className="bx bx-menu bx-md"></i>
                  </a>
                </div>
    
                <div className="navbar-nav-right d-flex align-items-center" id="navbar-collapse">
                  <div className="d-none d-md-block">
                    <h3 className="m-0 p-0 text-info fw-bold">Hello Stephanie!</h3>
                    <p className="m-0 p-0">How can we help you today?</p>
                  </div>
    
                  <ul className="navbar-nav flex-row align-items-center ms-auto">
                    <li className="nav-item dropdown-notifications navbar-dropdown dropdown btn-label-info rounded-circle p-1 px-3 px-xl-1 me-4 w-100">
                      <a className="nav-link dropdown-toggle hide-arrow" href="javascript:void(0);" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false">
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
                          <img src="../../assets/img/avatars/1.png" alt="" className="w-px-52 h-auto rounded-circle" />
                        </div>
                      </a>
                      <ul className="dropdown-menu dropdown-menu-end">
                        <li>
                          <a className="dropdown-item" href="pages-account-settings-account.html">
                            <div className="d-flex">
                              <div className="flex-shrink-0 me-3">
                                <div className="avatar avatar-online">
                                  <img src="../../assets/img/avatars/1.png" alt="" className="w-px-40 h-auto rounded-circle" />
                                </div>
                              </div>
                              <div className="flex-grow-1">
                                <h6 className="mb-0">John Doe</h6>
                                <small className="text-muted">Admin</small>
                              </div>
                            </div>
                          </a>
                        </li>
                        <li>
                          <div className="dropdown-divider my-1"></div>
                        </li>
                        <li>
                          <a className="dropdown-item" href="pages-profile-user.html">
                            <i className="bx bx-user bx-md me-3"></i><span>My Profile</span>
                          </a>
                        </li>
                        <li>
                          <a className="dropdown-item" href="pages-account-settings-account.html">
                            <i className="bx bx-cog bx-md me-3"></i><span>Settings</span>
                          </a>
                        </li>
                        <li>
                          <a className="dropdown-item" href="pages-account-settings-billing.html">
                            <span className="d-flex align-items-center align-middle">
                              <i className="flex-shrink-0 bx bx-credit-card bx-md me-3"></i><span className="flex-grow-1 align-middle">Billing Plan</span>
                              <span className="flex-shrink-0 badge rounded-pill bg-danger">4</span>
                            </span>
                          </a>
                        </li>
                        <li>
                          <div className="dropdown-divider my-1"></div>
                        </li>
                        <li>
                          <a className="dropdown-item" href="pages-pricing.html">
                            <i className="bx bx-dollar bx-md me-3"></i><span>Pricing</span>
                          </a>
                        </li>
                        <li>
                          <a className="dropdown-item" href="pages-faq.html">
                            <i className="bx bx-help-circle bx-md me-3"></i><span>FAQ</span>
                          </a>
                        </li>
                        <li>
                          <div className="dropdown-divider my-1"></div>
                        </li>
                        <li>
                          <a className="dropdown-item" href="auth-login-cover.html" target="_blank">
                            <i className="bx bx-power-off bx-md me-3"></i><span>Log Out</span>
                          </a>
                        </li>
                      </ul>
                    </li>
                  </ul>
                </div>
              </nav>
    
              <div className="content-wrapper">
    
                <div className="container-fluid flex-grow-1 container-p-y">
                  <div className="layout-demo-wrapper">
                    <div className="layout-demo-placeholder">
                      <img src="../../assets/img/layouts/layout-fluid-light.png" className="img-fluid" alt="Layout fluid" data-app-light-img="layouts/layout-fluid-light.png" data-app-dark-img="layouts/layout-fluid-dark.png" />
                    </div>
                    <div className="layout-demo-info">
                      <h4>Layout fluid</h4>
                      <p>
                        Fluid layout sets a <code>100% width</code> at each
                        responsive breakpoint.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </AuthRequiredGuard>
  );
}
