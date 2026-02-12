"use client"

import { useState } from "react"
import InitPasswordToggler from "@/components/initializer/init-password-toggler";

export default function StaffRegistrationForm() {
  const [step, setStep] = useState(1);
  const [middleName, setMiddleName] = useState("");
  const [hasNoMiddleName, setHasNoMiddleName] = useState(false);

  const handleNoMiddleNameChange = (event) => {
    const checked = event.target.checked;
    setHasNoMiddleName(checked);
    if (checked) {
      setMiddleName("");
    }
  };

  return <div className="p-5 p-lg-12 mx-lg-5 d-flex flex-column h-100 justify-content-center">
    <p className="text-black m-0">Step {step}/2</p>
    <h1 className="text-black fw-bolder">Create Account</h1>
    
    {/* ROLE SELECTOR START */}
    {step != 2 && <>
      <p className="text-black">Please choose your role: </p>
      <div className="d-flex gap-8 align-items-center">
        <a href="#" className="btn btn-xl btn-outline-primary rounded-pill" style={{ width: 150 }} >
          Student
        </a>
        <a href="#" className="btn btn-xl btn-primary rounded-pill" style={{ width: 150 }} >
          Staff
        </a>
      </div>
    </>}
    {/* ROLE SELECTOR END */}
      
    <form>
      {/* STEP ONE START */}
      {step != 2 && <>
        <label htmlFor="first_name" className="mt-10">First Name</label>
        <input id="first_name" name="first_name" placeholder="First Name" type="text" className="form-control form-control-lg mb-5" />
    
        <label htmlFor="middle_name">Middle Name</label>
        <input
          id="middle_name"
          name="middle_name"
          placeholder="Middle Name"
          type="text"
          className="form-control form-control-lg mb-5"
          value={middleName}
          onChange={(event) => setMiddleName(event.target.value)}
          disabled={hasNoMiddleName}
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
          <label className="form-check-label" htmlFor="i_have_no_legal_middle_name">
            I have no legal middle name
          </label>
        </div>
        <label htmlFor="last_name">Last Name</label>
        <input id="last_name" name="last_name" placeholder="Last Name" type="text" className="form-control form-control-lg mb-12" />
        <button className="btn btn-lg btn-primary w-100" onClick={() => setStep(2)}> Next </button>
      </>}
      {/* STEP ONE END*/}
      
      
      {/* STEP TWO START */}
      {step == 2 && <>
        <label htmlFor="employee_id">Employee ID</label>
        <input id="employee_id" name="employee_id" placeholder="Enter Employee ID" type="text" className="form-control form-control-lg mb-5" />

        <label htmlFor="email">Email Address</label>
        <input id="email" name="email" placeholder="Email Address" type="email" className="form-control form-control-lg mb-5" />

        <label htmlFor="create_password">Create Password</label>
        <div className="form-password-toggle fv-plugins-icon-container fv-plugins-bootstrap5-row-valid mb-5">
          <div className="input-group input-group-merge has-validation">
            <input
              type="password"
              id="create_password"
              className="form-control form-control-lg"
              name="create_password"
              placeholder="Create Password"
              aria-describedby="create_password"
            />
            <span className="input-group-text cursor-pointer">
              <i className="bx bx-hide"></i>
            </span>
          </div>
          <div className="fv-plugins-message-container fv-plugins-message-container--enabled invalid-feedback"></div>
        </div>

        <label htmlFor="create_password">Re-enter Password</label>
        <div className="mb-12 form-password-toggle fv-plugins-icon-container fv-plugins-bootstrap5-row-valid">
          <div className="input-group input-group-merge has-validation">
            <input
              type="password"
              id="password_confirmation"
              className="form-control form-control-lg"
              name="password_confirmation"
              placeholder="Re-enter Password"
              aria-describedby="password_confirmation"
            />
            <span className="input-group-text cursor-pointer">
              <i className="bx bx-hide"></i>
            </span>
          </div>
          <div className="fv-plugins-message-container fv-plugins-message-container--enabled invalid-feedback"></div>
        </div>
  
        <button className="btn btn-lg btn-primary w-100"> Submit </button>
        <button className="btn btn-lg btn-secondary w-100 mt-5" onClick={() => setStep(1)}> Back </button>
        <InitPasswordToggler/>
      </>}
      {/* STEP TWO END */}
    </form>
  </div>
}
