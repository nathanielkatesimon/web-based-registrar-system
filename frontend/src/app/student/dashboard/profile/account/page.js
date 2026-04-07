"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import InitPasswordToggler from "@/components/initializer/init-password-toggler";
import { api } from "@/lib/api";
import ShowAlert from "@/lib/show-alert";

const INITIAL_FORM = {
  auth_id: "",
  email: "",
  claimed: true,
  current_password: "",
  password: "",
  password_confirmation: "",
};

export default function AccountPage() {
  const { student_id: studentId } = useParams();
  const isStaffMode = Boolean(studentId);
  const studentEndpoint = isStaffMode ? `/api/v1/students/${studentId}` : "/api/v1/students/personal_info";

  const formRef = useRef(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [initialFormData, setInitialFormData] = useState(INITIAL_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadCurrentStudent = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await api(studentEndpoint);
        let payload = null;

        try {
          payload = await response.json();
        } catch {
          payload = null;
        }

        if (!response.ok) {
          const message = payload?.error || "Failed to load account information.";
          throw new Error(message);
        }

        if (!isMounted) return;

        const nextFormData = {
          auth_id: payload?.auth_id || "",
          email: payload?.email || "",
          claimed: payload?.claimed ?? true,
          current_password: "",
          password: "",
          password_confirmation: "",
        };

        setFormData(nextFormData);
        setInitialFormData(nextFormData);
      } catch (err) {
        if (!isMounted) return;
        setError(err?.message || "Failed to load account information.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadCurrentStudent();

    return () => {
      isMounted = false;
    };
  }, [studentEndpoint]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setSaveMessage("");
    setSaveError("");
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const hasChanges = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(initialFormData),
    [formData, initialFormData]
  );

  const handleDiscard = () => {
    setFormData(initialFormData);
    setIsValidated(false);
    setSaveError("");
    setSaveMessage("");
  };

  const handleSave = async () => {
    try {
      const form = formRef.current;
      if (form && !form.checkValidity()) {
        setIsValidated(true);
        setSaveError("");
        setSaveMessage("");
        await ShowAlert({
          icon: "error",
          title: "Invalid Form",
          text: "Please complete required fields with valid formats.",
        });
        return;
      }

      const isEmailChanged = formData.email.trim() !== initialFormData.email.trim();
      const isAuthIdChanged = formData.auth_id.trim() !== initialFormData.auth_id.trim();
      const isPasswordChanged = !isStaffMode && Boolean(formData.password || formData.password_confirmation);

      if (!isEmailChanged && !isAuthIdChanged && !isPasswordChanged) {
        return;
      }

      if (isPasswordChanged && formData.password !== formData.password_confirmation) {
        throw new Error("New password and re-entered password must match.");
      }

      if (!isStaffMode && (isEmailChanged || isPasswordChanged) && !formData.current_password) {
        throw new Error("Current password is required before changing email or password.");
      }

      setIsValidated(false);
      setIsSaving(true);
      setSaveError("");
      setSaveMessage("");

      const payload = {
        student: {
          auth_id: formData.auth_id.trim(),
          ...(isStaffMode ? {} : { email: formData.email.trim() }),
          ...(!isStaffMode && isPasswordChanged
            ? {
                password: formData.password,
                password_confirmation: formData.password_confirmation,
              }
            : {}),
        },
      };

      const response = await api(studentEndpoint, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      let responseJson = null;
      try {
        responseJson = await response.json();
      } catch {
        responseJson = null;
      }

      if (!response.ok) {
        if (!isStaffMode && response.status === 401) {
          throw new Error("Current password is incorrect. Please try again.");
        }

        const rawBackendError =
          (responseJson?.errors instanceof Array && responseJson.errors[0]) ||
          responseJson?.error ||
          "Failed to save changes.";
        const normalizedError = String(rawBackendError).toLowerCase();
        if (
          normalizedError.includes("current password") ||
          normalizedError.includes("invalid password") ||
          normalizedError.includes("password is invalid")
        ) {
          throw new Error("Current password is incorrect. Please try again.");
        }
        throw new Error(rawBackendError);
      }

      const nextFormData = {
        auth_id: responseJson?.auth_id || formData.auth_id.trim(),
        email: responseJson?.email || formData.email.trim(),
        claimed: responseJson?.claimed ?? formData.claimed,
        current_password: "",
        password: "",
        password_confirmation: "",
      };

      setFormData(nextFormData);
      setInitialFormData(nextFormData);
      setSaveMessage("Changes saved.");
      await ShowAlert({
        icon: "success",
        title: "Successfully Updated",
        text: "Successfully updated account details.",
      });
    } catch (err) {
      setSaveError(err?.message || "Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-vh-100 py-4">
      <div className="container" style={{ maxWidth: "760px" }}>
        <div className="d-flex justify-content-between align-items-center">
          <h3 className="fw-bold m-0">Account</h3>
          {!isLoading && hasChanges && (
            <div className="mb-3 d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-outline-danger rounded-pill px-4"
                onClick={handleDiscard}
                disabled={isSaving}
              >
                Discard
              </button>
              <button
                type="button"
                className="btn btn-primary rounded-pill px-4"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </div>
        <hr />

        {isLoading && <p className="small text-muted mb-3">Loading account information...</p>}
        {error && <p className="small text-danger mb-3">{error}</p>}
        {saveError && <p className="small text-danger mb-3">{saveError}</p>}
        {saveMessage && <p className="small text-success mb-3">{saveMessage}</p>}

        <form
          ref={formRef}
          className={isValidated ? "needs-validation was-validated" : "needs-validation"}
          noValidate
        >
          <div className="row g-3">
            <div className="col-md-6 mb-3">
              <label className="form-label fw-bold mb-1 small">
                USN<span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="auth_id"
                value={formData.auth_id}
                onChange={handleInputChange}
                className="form-control form-control-lg shadow-none"
                placeholder="USN"
                required
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label fw-bold mb-1 small">
                Email Address<span className="text-danger">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-control form-control-lg shadow-none"
                placeholder="Email Address"
                required
                readOnly={isStaffMode}
              />
            </div>

            {!isStaffMode ? (
            <div className="col-md-8 mb-3">
              <label className="form-label fw-bold mb-1 small">
                Enter Current Password<span className="text-danger">*</span>
              </label>
              <div className="form-password-toggle fv-plugins-icon-container fv-plugins-bootstrap5-row-valid">
                <div className="input-group input-group-merge has-validation">
                  <input
                    type="password"
                    id="current_password"
                    className="form-control form-control-lg shadow-none"
                    name="current_password"
                    placeholder="Enter Current Password"
                    aria-describedby="current_password"
                    value={formData.current_password}
                    onChange={handleInputChange}
                    required={Boolean(
                      formData.password ||
                        formData.password_confirmation ||
                        formData.email.trim() !== initialFormData.email.trim()
                    )}
                  />
                  <span className="input-group-text cursor-pointer">
                    <i className="bx bx-eye-slash"></i>
                  </span>
                </div>
                <div className="fv-plugins-message-container fv-plugins-message-container--enabled invalid-feedback"></div>
              </div>
            </div>
            ) : null}

            {!isStaffMode ? (
            <div className="col-md-8 mb-3">
              <label className="form-label fw-bold mb-1 small">
                Create New Password<span className="text-danger">*</span>
              </label>
              <div className="form-password-toggle fv-plugins-icon-container fv-plugins-bootstrap5-row-valid">
                <div className="input-group input-group-merge has-validation">
                  <input
                    type="password"
                    id="password"
                    className="form-control form-control-lg shadow-none"
                    name="password"
                    placeholder="Create New Password"
                    aria-describedby="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    minLength={8}
                  />
                  <span className="input-group-text cursor-pointer">
                    <i className="bx bx-eye-slash"></i>
                  </span>
                </div>
                <div className="fv-plugins-message-container fv-plugins-message-container--enabled invalid-feedback"></div>
              </div>
            </div>
            ) : null}

            {!isStaffMode ? (
            <div className="col-md-8 mb-3">
              <label className="form-label fw-bold mb-1 small">
                Re-enter Password<span className="text-danger">*</span>
              </label>
              <div className="form-password-toggle fv-plugins-icon-container fv-plugins-bootstrap5-row-valid">
                <div className="input-group input-group-merge has-validation">
                  <input
                    type="password"
                    id="password_confirmation"
                    className="form-control form-control-lg shadow-none"
                    name="password_confirmation"
                    placeholder="Re-enter Password"
                    aria-describedby="password_confirmation"
                    value={formData.password_confirmation}
                    onChange={handleInputChange}
                    minLength={8}
                  />
                  <span className="input-group-text cursor-pointer">
                    <i className="bx bx-eye-slash"></i>
                  </span>
                </div>
                <div className="fv-plugins-message-container fv-plugins-message-container--enabled invalid-feedback"></div>
              </div>
            </div>
            ) : null}
          </div>
          <input type="hidden" />
          {!isStaffMode ? <InitPasswordToggler /> : null}
        </form>
      </div>
    </div>
  );
}
