"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import InitPasswordToggler from "@/components/initializer/init-password-toggler";
import { api, parseError } from "@/lib/api";
import ShowAlert from "@/lib/show-alert";

const FORM_BASE_CLASS = "mb-6 fv-plugins-bootstrap5 fv-plugins-framework px-8 needs-validation";

export default function ResetPasswordForm() {
  const formRef = useRef(null);
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValues, setFormValues] = useState({
    password: "",
    password_confirmation: ""
  });

  const resetPasswordToken = searchParams.get("reset_password_token") || "";
  const type = searchParams.get("type") || "";
  const mode = searchParams.get("mode") || "";
  const loginPath = type === "staff" ? "/staff/login" : "/student/login";
  const isClaimMode = mode === "claim";

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const form = formRef.current;
    if (!form.checkValidity() || !resetPasswordToken) {
      form.className = `${FORM_BASE_CLASS} was-validated`;

      if (!resetPasswordToken) {
        await ShowAlert({
          icon: "error",
          title: "Invalid Reset Link",
          text: "The password reset token is missing or invalid."
        });
      }
      return;
    }

    form.className = FORM_BASE_CLASS;

    try {
      setIsSubmitting(true);

      const response = await api("/api/v1/users/password", {
        method: "PUT",
        body: JSON.stringify({
          user: {
            reset_password_token: resetPasswordToken,
            password: formValues.password,
            password_confirmation: formValues.password_confirmation
          }
        })
      });
      const responseJson = await response.json();

      if (response.ok) {
        await ShowAlert({
          icon: "success",
          title: isClaimMode ? "Account Claimed" : "Password Updated",
          text: isClaimMode
            ? "Your password has been created successfully."
            : (responseJson.message || "Your password has been changed successfully.")
        });
        window.location.href = loginPath;
        return;
      }

      await ShowAlert({
        icon: "error",
        title: "Reset Failed",
        text: parseError(responseJson) || responseJson.message || "Unable to update your password."
      });
    } catch (error) {
      await ShowAlert({
        icon: "error",
        title: "Reset Failed",
        text: "Something went wrong. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      ref={formRef}
      className={FORM_BASE_CLASS}
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="mb-8">
        <h4 className="mb-2 text-black">{isClaimMode ? "Create your password" : "Set a new password"}</h4>
        <p className="mb-0 text-muted">
          {isClaimMode
            ? "This account was already created by a staff. Create your password to claim it."
            : "Choose a new password for your E-Registrar account."}
        </p>
      </div>
      <div className="mb-6 form-password-toggle fv-plugins-icon-container">
        <div className="input-group input-group-merge has-validation">
          <input
            type="password"
            id="password"
            className="form-control form-control-lg"
            name="password"
            placeholder={isClaimMode ? "Create password" : "New password"}
            value={formValues.password}
            onChange={handleInputChange}
            minLength={6}
            required
          />
          <span className="input-group-text cursor-pointer">
            <i className="bx bx-eye-slash"></i>
          </span>
        </div>
        <div className="fv-plugins-message-container fv-plugins-message-container--enabled invalid-feedback"></div>
      </div>
      <div className="mb-6 form-password-toggle fv-plugins-icon-container">
        <div className="input-group input-group-merge has-validation">
          <input
            type="password"
            id="password_confirmation"
            className="form-control form-control-lg"
            name="password_confirmation"
            placeholder={isClaimMode ? "Confirm password" : "Confirm new password"}
            value={formValues.password_confirmation}
            onChange={handleInputChange}
            minLength={6}
            required
          />
          <span className="input-group-text cursor-pointer">
            <i className="bx bx-eye-slash"></i>
          </span>
        </div>
        <div className="fv-plugins-message-container fv-plugins-message-container--enabled invalid-feedback"></div>
      </div>
      <div className="mb-6">
        <button className="btn btn-lg btn-primary d-grid w-100" type="submit" disabled={isSubmitting}>
          {isSubmitting ? (isClaimMode ? "Creating..." : "Updating...") : (isClaimMode ? "Create password" : "Update password")}
        </button>
      </div>
      <div className="text-center">
        <Link href={loginPath} className="fw-semibold">Back to login</Link>
      </div>
      <InitPasswordToggler />
    </form>
  );
}
