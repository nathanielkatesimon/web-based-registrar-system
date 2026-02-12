"use client"

import { useState } from "react"
import InitPasswordToggler from "@/components/initializer/init-password-toggler";
import InitBootstrapSelect from "@/components/initializer/init-bootstrap-select";
import Link from "next/link";

export default function StaffRegistrationForm() {
  const [step, setStep] = useState(1);
  const [middleName, setMiddleName] = useState("");
  const [hasNoMiddleName, setHasNoMiddleName] = useState(false);
  const [academicStatus, setAcademicStatus] = useState("");

  const handleNoMiddleNameChange = (event) => {
    const checked = event.target.checked;
    setHasNoMiddleName(checked);
    if (checked) {
      setMiddleName("");
    }
  };

  const handleAcademicStatusChange = (status) => {
    setAcademicStatus((prevStatus) => (prevStatus === status ? "" : status));
  };

  return <div className="p-5 p-lg-12 mx-lg-5 d-flex flex-column h-100 justify-content-center">
    <p className="text-black m-0">Step {step}/3</p>
    <h1 className="text-black fw-bolder">Create Account</h1>

    {/* ROLE SELECTOR START */}
    {step == 1 && <>
      <p className="text-black">Please choose your role: </p>
      <div className="d-flex gap-8 align-items-center">
        <Link href="#" className="btn btn-xl btn-primary rounded-pill" style={{ width: 150 }} >
          Student
        </Link>
        <Link href="/staff/register" className="btn btn-xl btn-outline-primary rounded-pill" style={{ width: 150 }} >
          Staff
        </Link>
      </div>
    </>}
    {/* ROLE SELECTOR END */}

    <form>
      {/* STEP ONE START */}
      {step == 1 && <>
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
        <button className="btn btn-lg btn-primary w-100" type="button" onClick={() => setStep(2)}> Next </button>
      </>}
      {/* STEP ONE END*/}


      {/* STEP TWO START */}
      {step == 2 && <>
        <label htmlFor="usn">USN</label>
        <input id="employee_id" name="usn" placeholder="Enter USN" type="text" className="form-control form-control-lg mb-5" />

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

        <button className="btn btn-lg btn-primary w-100" type="button" onClick={() => setStep(3)}> Next </button>
        <button className="btn btn-lg btn-secondary w-100 mt-5" type="button" onClick={() => setStep(1)}> Back </button>
        <InitPasswordToggler/>
      </>}
      {/* STEP TWO END */}


      {/* STEP THREE START */}
      {step == 3 && <>
        <section className={academicStatus == "already_graduated" ? "d-none" : ""}>
          <div className="mb-5">
            <label htmlFor="year_level">Year Level</label>
            <select
              id="year_level"
              className="selectpicker w-100 bg-white rounded-2"
              data-style="btn-default"
              data-size="6"
              title="Select year level"
            >
              <optgroup label="SHS">
                <option value="grade_11">Grade 11</option>
                <option value="grade_12">Grade 12</option>
              </optgroup>
              <optgroup label="College">
                <option value="1st_year">1st Year</option>
                <option value="2nd_year">2nd Year</option>
                <option value="3rd_year">3rd Year</option>
                <option value="4th_year">4th Year</option>
              </optgroup>
            </select>
          </div>
          
          <div className="mb-5">
            <label htmlFor="course_track">Course/Track</label>
            <select
              id="course_track"
              className="selectpicker w-100 bg-white rounded-2"
              data-style="btn-default"
              data-size="6"
              title="Select course or track"
            >
              <optgroup label="Strand: SHS">
                <option value="stem">STEM</option>
                <option value="abm">ABM</option>
                <option value="humss">HUMSS</option>
                <option value="ga">GA</option>
                <option value="tvl_css">TVL - CSS</option>
                <option value="tvl_programming">TVL - Programming</option>
                <option value="tvl_animation">TVL - Animation</option>
                <option value="tvl_he">TVL - HE</option>
              </optgroup>
              <optgroup label="Track: SHS">
                <option value="academic_track">Academic Track</option>
                <option value="technical_vocational_livelihood">Technical-Vocational-Livelihood</option>
              </optgroup>
              <optgroup label="Course: College">
                <option value="dwat">Diploma in Web Application Technology</option>
                <option value="doat">Diploma in Office Administration Technology</option>
                <option value="domt">Diploma in Office Management Technology</option>
                <option value="dhart">Diploma in Hotel and Restaurant Technology</option>
                <option value="bsit">Bachelor of Science in Information Technology</option>
                <option value="bscs">Bachelor of Science in Computer Science</option>
                <option value="bsba">Bachelor of Science in Business Administration</option>
                <option value="bshm">Bachelor of Science in Hospitality Management</option>
              </optgroup>
            </select>
          </div>
  
          <div className="mb-5">
            <label htmlFor="department">Department</label>
            <select
              id="department"
              className="selectpicker w-100 bg-white rounded-2"
              data-style="btn-default"
              data-size="6"
              title="Select department"
            >
              <optgroup label="College">
                <option value="computer_studies">Computer Studies</option>
                <option value="business">Business</option>
                <option value="culinary">Culinary</option>
              </optgroup>
            </select>
          </div>
        </section>
        
        <p className="text-black fw-semibold">Please check which fits if none leave unchecked:</p>
        <div>
          <input
            className="form-check-input me-2 my-2"
            type="checkbox"
            id="checkbox1"
            name="academic_status"
            value="current_enrolled"
            checked={academicStatus === "current_enrolled"}
            onChange={() => handleAcademicStatusChange("current_enrolled")}
          />
          <label className="my-2" htmlFor="checkbox1">I am currently enrolled</label>
          <br/>
          <input
            className="form-check-input me-2 my-2"
            type="checkbox"
            id="checkbox2"
            name="academic_status"
            value="transferee"
            checked={academicStatus === "transferee"}
            onChange={() => handleAcademicStatusChange("transferee")}
          />
          <label className="my-2" htmlFor="checkbox2">I am a transferee</label>
          <br/>
          <input
            className="form-check-input me-2 my-2"
            type="checkbox"
            id="checkbox3"
            name="academic_status"
            value="returnee"
            checked={academicStatus === "returnee"}
            onChange={() => handleAcademicStatusChange("returnee")}
          />
          <label className="my-2" htmlFor="checkbox3">I am a returnee</label>
          <br/>
          <input
            className="form-check-input me-2 my-2"
            type="checkbox"
            id="checkbox4"
            name="academic_status"
            value="already_graduated"
            checked={academicStatus === "already_graduated"}
            onChange={() => handleAcademicStatusChange("already_graduated")}
          />
          <label className="my-2" htmlFor="checkbox4">I already graduated</label>
        </div>        
        <br />
        
        <section className={academicStatus == "already_graduated" ? "" : "d-none"}>
          <label htmlFor="email">Academic Year</label>
          <div className="w-100 d-flex gap-4">          
            <input id="from" name="from" placeholder="from" type="number" className="form-control mb-5" />
            <input id="to" name="to" placeholder="to" type="number" className="form-control mb-5" />
          </div>
          
          <div className="mb-5">
            <label htmlFor="course_track">Course/Track</label>
            <select
              id="course_track"
              className="selectpicker w-100 bg-white rounded-2"
              data-style="btn-default"
              data-size="6"
              title="Select course or track"
            >
              <optgroup label="Strand: SHS">
                <option value="stem">STEM</option>
                <option value="abm">ABM</option>
                <option value="humss">HUMSS</option>
                <option value="ga">GA</option>
                <option value="tvl_css">TVL - CSS</option>
                <option value="tvl_programming">TVL - Programming</option>
                <option value="tvl_animation">TVL - Animation</option>
                <option value="tvl_he">TVL - HE</option>
              </optgroup>
              <optgroup label="Track: SHS">
                <option value="academic_track">Academic Track</option>
                <option value="technical_vocational_livelihood">Technical-Vocational-Livelihood</option>
              </optgroup>
              <optgroup label="Course: College">
                <option value="dwat">Diploma in Web Application Technology</option>
                <option value="doat">Diploma in Office Administration Technology</option>
                <option value="domt">Diploma in Office Management Technology</option>
                <option value="dhart">Diploma in Hotel and Restaurant Technology</option>
                <option value="bsit">Bachelor of Science in Information Technology</option>
                <option value="bscs">Bachelor of Science in Computer Science</option>
                <option value="bsba">Bachelor of Science in Business Administration</option>
                <option value="bshm">Bachelor of Science in Hospitality Management</option>
              </optgroup>
            </select>
          </div>
  
          <div className="mb-5">
            <label htmlFor="department">Department</label>
            <select
              id="department"
              className="selectpicker w-100 bg-white rounded-2"
              data-style="btn-default"
              data-size="6"
              title="Select department"
            >
              <optgroup label="College">
                <option value="computer_studies">Computer Studies</option>
                <option value="business">Business</option>
                <option value="culinary">Culinary</option>
              </optgroup>
            </select>
          </div>
          <br/>
        </section>
        
        <button className="btn btn-lg btn-primary w-100" type="button"> Submit </button>
        <button className="btn btn-lg btn-secondary w-100 mt-5" type="button" onClick={() => setStep(2)}> Back </button>
        <InitBootstrapSelect />
      </>}
      {/* STEP THREE END */}
    </form>
  </div>
}
