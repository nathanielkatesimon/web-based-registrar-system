"use client"

import { useRef, useState } from "react";
import InitPasswordToggler from "@/components/initializer/init-password-toggler";
import { api, parseError } from "@/lib/api";
import ShowAlert from "@/lib/show-alert";

const FORM_BASE_CLASS = "mb-6 fv-plugins-bootstrap5 fv-plugins-framework px-8 needs-validation";

export default function StaffLoginForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValues, setFormValues] = useState({
    auth_id: "",
    password: "",
  });
  const formRef = useRef(null);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

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
      const payload = {
        user: {
          auth_id: formValues.auth_id.trim(),
          password: formValues.password,
        },
      };

      const response = await api("/api/v1/users/sign_in", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const responseJson = await response.json();

      if (response.status === 200) {
        if (responseJson?.message) {
          await ShowAlert({ icon: "info", title: "Already Signed In", text: responseJson.message, customClass: { cancelButton: "d-none" }  });
        } else {
          await ShowAlert({ icon: "success", title: "Login Successful", text: "Welcome back.", customClass: { cancelButton: "d-none" } });
        }
        window.location.href = "/staff/dashboard";
        return;
      }

      await ShowAlert({
        icon: "error",
        title: "Login Failed",
        text: responseJson?.message || parseError(responseJson) || "Invalid ID or password.", customClass: { cancelButton: "d-none" } 
      });
    } catch (error) {
      await ShowAlert({
        icon: "error",
        title: "Login Failed",
        text: "Something went wrong. Please try again.", customClass: { cancelButton: "d-none" } 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return <form
    ref={formRef}
    id="formAuthentication"
    className={FORM_BASE_CLASS}
    onSubmit={handleSubmit}
    noValidate
  >
    <div className="mb-6 fv-plugins-icon-container">
      <input
        type="text"
        className="form-control form-control-lg"
        id="auth_id"
        name="auth_id"
        placeholder="Employee ID"
        value={formValues.auth_id}
        onChange={handleInputChange}
        required
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
          value={formValues.password}
          onChange={handleInputChange}
          required
        />
        <span className="input-group-text cursor-pointer">
          <i className="bx bx-hide"></i>
        </span>
      </div>
      <div className="fv-plugins-message-container fv-plugins-message-container--enabled invalid-feedback"></div>
    </div>
    <div className="mb-6">
      <button className="btn btn-lg btn-primary d-grid w-100" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </div>
    <div className="w-100 text-center">
      <a href="#" className="fw-semibold">
        Forgot Password?
      </a>
    </div>
    <input type="hidden" />
    <InitPasswordToggler />
  </form>
}
