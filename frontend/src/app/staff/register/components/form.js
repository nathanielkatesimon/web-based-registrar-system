"use client"

import { useState, useRef } from "react"
import Link from "next/link";
import InitPasswordToggler from "@/components/initializer/init-password-toggler";
import PasswordValidator, { getPasswordValidationError } from "@/components/features/register/password-validator";
import { parseError, api } from "@/lib/api";
import ShowAlert from "@/lib/show-alert";

export default function StaffRegistrationForm() {
  const [step, setStep] = useState(1);
  const [hasNoMiddleName, setHasNoMiddleName] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef(null);
  const [formValues, setFormValues] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    employee_id: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleNoMiddleNameChange = (event) => {
    const checked = event.target.checked;
    setHasNoMiddleName(checked);
    if (checked) {
      setFormValues((prev) => ({ ...prev, middle_name: "" }));
    }
  };

  const prevStep = () => {
    formRef.current.className = "needs-validation";
    setStep(step - 1);
  };

  const submit = async () => {
    const form = formRef.current;
    const passwordError = getPasswordValidationError(
      formValues.password,
      formValues.password_confirmation
    );

    if (!form.checkValidity() || (step === 2 && passwordError)) {
      form.className = "needs-validation was-validated";
      return;
    }

    form.className = "needs-validation";
    if (step !== 2) {
      setStep(step + 1);
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        user: {
          auth_id: formValues.employee_id.trim(),
          email: formValues.email.trim(),
          password: formValues.password,
          password_confirmation: formValues.password_confirmation,
          first_name: formValues.first_name.trim(),
          middle_name: hasNoMiddleName ? "" : formValues.middle_name.trim(),
          last_name: formValues.last_name.trim(),
        },
      };

      const response = await api("/api/v1/staffs/registrations", { method: "POST", body: JSON.stringify(payload) });
      const response_json = await response.json()
      
      if (response.status == 200 || response.status == 201) {
        if (response_json.message) {
          await ShowAlert({icon: "info", title: "Already Signed In", text: ""  });
        } else {
          await ShowAlert({ icon: "success", title: "Registration Successful", text: "Account created successfully."  });
        }
        window.location.href = "/staff/dashboard";
      } else {
          await ShowAlert({ icon: "error", title: "Registration Failed", text: parseError(response_json)  });
      }
    } catch (error) {
      ShowAlert({ icon: "error", title: "Registration Failed", text: "Something went wrong. Please try again."  });
    } finally {
      setIsSubmitting(false);
    }
  };

  return <div className="p-5 p-lg-12 mx-lg-5 d-flex flex-column h-100 justify-content-center">
    <p className="text-black m-0">Step {step}/2</p>
    <h1 className="text-black fw-bolder">Create Account</h1>

    {/* ROLE SELECTOR START */}
    {step == 1 && <>
      <p className="text-black">Please choose your role: </p>
      <div className="d-flex gap-8 align-items-center">
        <Link href="/student/register" className="btn btn-xl btn-outline-primary rounded-pill" style={{ width: 150 }} >
          Student
        </Link>
        <Link href="#" className="btn btn-xl btn-primary rounded-pill" style={{ width: 150 }} >
          Staff
        </Link>
      </div>
    </>}
    {/* ROLE SELECTOR END */}

    <form ref={formRef} className="needs-validation" noValidate={true}>
      {/* STEP ONE START */}
      {step == 1 && <>
        <label htmlFor="first_name" className="mt-10">First Name</label>
        <input
          id="first_name"
          name="first_name"
          placeholder="First Name"
          type="text"
          className="form-control form-control-lg mb-5"
          value={formValues.first_name}
          onChange={handleInputChange}
          required
        />

        <label htmlFor="middle_name">Middle Name</label>
        <input
          id="middle_name"
          name="middle_name"
          placeholder="Middle Name"
          type="text"
          className="form-control form-control-lg mb-5"
          value={formValues.middle_name}
          onChange={handleInputChange}
          disabled={hasNoMiddleName}
          required={hasNoMiddleName ? false : true}
        />
        <div className="form-check form-check-primary mb-5">
          <input
            className="form-check-input"
            type="checkbox"
            value=""
            id="i_have_no_legal_middle_name"
            checked={hasNoMiddleName}
            onChange={handleNoMiddleNameChange}
          />
          <label className="form-check-label text-black" htmlFor="i_have_no_legal_middle_name">
            I have no legal middle name
          </label>
        </div>
        <label htmlFor="last_name">Last Name</label>
        <input
          id="last_name"
          name="last_name"
          placeholder="Last Name"
          type="text"
          className="form-control form-control-lg mb-12"
          value={formValues.last_name}
          onChange={handleInputChange}
          required
        />
        <button className="btn btn-lg btn-primary w-100" onClick={() => submit()} type="button"> Next </button>
      </>}
      {/* STEP ONE END*/}


      {/* STEP TWO START */}
      {step == 2 && <>
        <label htmlFor="employee_id">Employee ID</label>
        <input
          id="employee_id"
          name="employee_id"
          placeholder="Enter Employee ID"
          type="text"
          className="form-control form-control-lg mb-5"
          value={formValues.employee_id}
          onChange={handleInputChange}
          required
        />

        <label htmlFor="email">Email Address</label>
        <input
          id="email"
          name="email"
          placeholder="Email Address"
          type="email"
          className="form-control form-control-lg mb-5"
          value={formValues.email}
          onChange={handleInputChange}
          required
        />

        <label htmlFor="password">Create Password</label>
        <div className="form-password-toggle fv-plugins-icon-container fv-plugins-bootstrap5-row-valid mb-5">
          <div className="input-group input-group-merge has-validation">
            <input
              type="password"
              id="password"
              className="form-control form-control-lg"
              name="password"
              placeholder="Create Password"
              aria-describedby="password"
              value={formValues.password}
              onChange={handleInputChange}
              required
            />
            <span className="input-group-text cursor-pointer">
              <i className="bx bx-eye-slash"></i>
            </span>
          </div>
        </div>

        <label htmlFor="password">Re-enter Password</label>
        <div className="mb-12 form-password-toggle fv-plugins-icon-container fv-plugins-bootstrap5-row-valid">
          <div className="input-group input-group-merge has-validation">
            <input
              type="password"
              id="password_confirmation"
              className="form-control form-control-lg"
              name="password_confirmation"
              placeholder="Re-enter Password"
              aria-describedby="password_confirmation"
              value={formValues.password_confirmation}
              onChange={handleInputChange}
              required
            />
            <span className="input-group-text cursor-pointer">
              <i className="bx bx-eye-slash"></i>
            </span>
          </div>
          <PasswordValidator
            password={formValues.password}
            password_confirmation={formValues.password_confirmation}
          />
        </div>

        <button className="btn btn-lg btn-primary w-100" type="button" onClick={() => submit()} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
        <button className="btn btn-lg btn-secondary w-100 mt-5" onClick={() => prevStep()} type="button" disabled={isSubmitting}> Back </button>
        <InitPasswordToggler />
      </>}
      {/* STEP TWO END */}
    </form>
  </div>
}
