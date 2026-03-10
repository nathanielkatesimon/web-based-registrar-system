"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, parseError } from "@/lib/api";
import ShowAlert from "@/lib/show-alert";

const FORM_BASE_CLASS = "mb-6 fv-plugins-bootstrap5 fv-plugins-framework px-8 needs-validation";

export default function ForgotPasswordForm() {
  const formRef = useRef(null);
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const type = searchParams.get("type") || "";
  const loginPath = type === "staff" ? "/staff/login" : "/student/login";

  const handleSubmit = async (event) => {
    event.preventDefault();

    const form = formRef.current;
    if (!form.checkValidity()) {
      form.className = `${FORM_BASE_CLASS} was-validated`;
      return;
    }

    form.className = FORM_BASE_CLASS;

    try {
      setIsSubmitting(true);

      const response = await api("/api/v1/users/password", {
        method: "POST",
        body: JSON.stringify({
          user: {
            email: email.trim()
          }
        })
      });
      const responseJson = await response.json();

      if (response.ok) {
        await ShowAlert({
          icon: "success",
          title: "Reset Link Sent",
          text: responseJson.message || "Check your email for reset instructions."
        });
        window.location.href = loginPath;
        return;
      }

      await ShowAlert({
        icon: "error",
        title: "Request Failed",
        text: parseError(responseJson) || responseJson.message || "Unable to send reset instructions."
      });
    } catch (error) {
      await ShowAlert({
        icon: "error",
        title: "Request Failed",
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
        <h4 className="mb-2 text-black">Forgot your password?</h4>
        <p className="mb-0 text-muted">
          Enter your account email and we will send you a password reset link.
        </p>
      </div>
      <div className="mb-6 fv-plugins-icon-container">
        <input
          type="email"
          className="form-control form-control-lg"
          id="email"
          name="email"
          placeholder="Email address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <div className="fv-plugins-message-container fv-plugins-message-container--enabled invalid-feedback"></div>
      </div>
      <div className="mb-6">
        <button className="btn btn-lg btn-primary d-grid w-100" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send reset link"}
        </button>
      </div>
      <div className="text-center d-flex flex-column gap-2">
        <Link href="/student/login" className="fw-semibold">Back to student login</Link>
        <Link href="/staff/login" className="fw-semibold">Back to staff login</Link>
      </div>
    </form>
  );
}
