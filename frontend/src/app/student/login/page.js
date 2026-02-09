import AuthLayout from "@/components/features/auth/auth-layout";
import AuthCard from "@/components/features/auth/auth-card";
import CopyrightNotice from "@/components/ui/copyright-notice";

export default function StudentLogin() {
  return (
    <AuthLayout>
      <AuthCard>
        <form
          id="formAuthentication"
          className="mb-6 fv-plugins-bootstrap5 fv-plugins-framework px-11"
          action="index.html"
          method="GET"
          noValidate
        >
          <div className="mb-6 fv-plugins-icon-container">
            <input
              type="text"
              className="form-control bg-white"
              id="email"
              name="email"
              placeholder="USN"
            />
            <div className="fv-plugins-message-container fv-plugins-message-container--enabled invalid-feedback"></div>
          </div>
          <div className="mb-6 form-password-toggle fv-plugins-icon-container fv-plugins-bootstrap5-row-valid">
            <div className="input-group input-group-merge has-validation bg-white">
              <input
                type="password"
                id="password"
                className="form-control"
                name="password"
                placeholder="············"
                aria-describedby="password"
              />
              <span className="input-group-text cursor-pointer">
                <i className="bx bx-hide"></i>
              </span>
            </div>
            <div className="fv-plugins-message-container fv-plugins-message-container--enabled invalid-feedback"></div>
          </div>
          <div className="mb-6">
            <button className="btn btn-primary d-grid w-100" type="submit">
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
    </AuthLayout>
  );
}
