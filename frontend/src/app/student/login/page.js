import AuthLayout from "@/components/features/auth/auth-layout";
import AuthCard from "@/components/features/auth/auth-card";
import CopyrightNotice from "@/components/ui/copyright-notice";
import InitPasswordToggler from "@/components/initializer/init-password-toggler";
import GuestOnlyGuard from "@/components/features/auth/guest-only-guard";
import Link from "next/link";

export default function StudentLogin() {
  return (
    <GuestOnlyGuard>
      <AuthLayout>
        <div className="ms-auto me-12 my-9">
          <Link href="/student/register" className="text-white me-10 fs-5">Create Account</Link>
          <Link href="/staff/login" className="btn btn-info rounded-pill fs-5">Staff login</Link>
        </div>
        <AuthCard>
          <form
            id="formAuthentication"
            className="mb-6 fv-plugins-bootstrap5 fv-plugins-framework px-8"
            action="index.html"
            method="GET"
            noValidate
          >
            <div className="mb-6 fv-plugins-icon-container">
              <input
                type="text"
                className="form-control form-control-lg"
                id="email"
                name="email"
                placeholder="USN"
              />
              <div className="fv-plugins-message-container fv-plugins-message-container--enabled invalid-feedback"></div>
            </div>
            <div className="mb-6 form-password-toggle fv-plugins-icon-container fv-plugins-bootstrap5-row-valid">
              <div className="input-group input-group-merge has-validation">
                <input
                  type="password"
                  id="password"
                  className="form-control form-control-lg"
                  name="password"
                  placeholder="Password"
                  aria-describedby="password"
                />
                <span className="input-group-text cursor-pointer">
                  <i className="bx bx-hide"></i>
                </span>
              </div>
              <div className="fv-plugins-message-container fv-plugins-message-container--enabled invalid-feedback"></div>
            </div>
            <div className="mb-6">
              <button className="btn btn-lg btn-primary d-grid w-100" type="submit">
                Sign in
              </button>
            </div>
            <div className="w-100 text-center">
              <a href="#" className="fw-semibold">
                Forgot Password?
              </a>
            </div>
            <input type="hidden" />
          </form>
        </AuthCard>
        <CopyrightNotice />
        <InitPasswordToggler/>
      </AuthLayout>
    </GuestOnlyGuard>
  );
}
