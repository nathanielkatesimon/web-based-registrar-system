"use client"

import { useRef, useState } from "react";
import Link from "next/link";
import InitPasswordToggler from "@/components/initializer/init-password-toggler";
import InitBootstrapSelect from "@/components/initializer/init-bootstrap-select";
import PasswordValidator, { getPasswordValidationError } from "@/components/features/register/password-validator";
import { parseError, api } from "@/lib/api";
import ShowAlert from "@/lib/show-alert";

const STATUS_MAP = {
  current_enrolled: "currently_enrolled",
  transferee: "transferee",
  returnee: "returnee",
  already_graduated: "graduated",
};

const YEAR_LEVEL_MAP = {
  grade_11: "11",
  grade_12: "12",
  "1st_year": "1st",
  "2nd_year": "2nd",
  "3rd_year": "3rd",
  "4th_year": "4th",
};

const COURSE_MAP = {
  dwat: {
    course: "diploma_in_web_application_technology",
    department: "computer_studies",
  },
  bsit: {
    course: "bachelor_of_science_in_information_technology",
    department: "computer_studies",
  },
  bscs: {
    course: "bachelor_of_science_in_computer_science",
    department: "computer_studies",
  },
  doat: {
    course: "diploma_in_office_administration_technology",
    department: "business",
  },
  domt: {
    course: "diploma_in_office_management_technology",
    department: "business",
  },
  bsba: {
    course: "bachelor_of_science_in_business_administration",
    department: "business",
  },
  dhart: {
    course: "diploma_in_hotel_and_restaurant_technology",
    department: "culinary",
  },
  bshm: {
    course: "bachelor_of_science_in_hospitality_management",
    department: "culinary",
  },
};

const STRAND_MAP = {
  stem: { strand: "STEM", track: "academic_track" },
  abm: { strand: "ABM", track: "academic_track" },
  humss: { strand: "HUMSS", track: "academic_track" },
  ga: { strand: "GA", track: "academic_track" },
  tvl_css: { strand: "TVL - CSS", track: "technical_vocational_livelihood" },
  tvl_programming: { strand: "TVL - Programming", track: "technical_vocational_livelihood" },
  tvl_animation: { strand: "TVL - Animation", track: "technical_vocational_livelihood" },
  tvl_he: { strand: "TVL - HE", track: "technical_vocational_livelihood" },
};

const DEPARTMENT_LABEL_MAP = {
  academic_track: "Academic Track",
  technical_vocational_livelihood: "Technical-Vocational-Livelihood",
  computer_studies: "Computer Studies",
  business: "Business",
  culinary: "Culinary",
};

export default function StudentRegistrationForm() {
  const [step, setStep] = useState(1);
  const [hasNoMiddleName, setHasNoMiddleName] = useState(false);
  const [academicStatus, setAcademicStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef(null);

  const [formValues, setFormValues] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    usn: "",
    email: "",
    password: "",
    password_confirmation: "",
    year_level: "",
    course_track: "",
    department: "",
    graduated_from: "",
    graduated_to: "",
    graduated_course_track: "",
    graduated_department: "",
  });

  const isGraduated = academicStatus === "already_graduated";

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

  const handleAcademicStatusChange = (status) => {
    setAcademicStatus((prevStatus) => (prevStatus === status ? "" : status));
  };

  const prevStep = () => {
    formRef.current.className = "needs-validation";
    setStep(step - 1);
  };

  const getDepartmentDisplay = (selectedProgram) => {
    if (!selectedProgram) {
      return "";
    }

    const selectedCourse = COURSE_MAP[selectedProgram];
    if (selectedCourse) {
      return DEPARTMENT_LABEL_MAP[selectedCourse.department] || "";
    }

    const selectedStrand = STRAND_MAP[selectedProgram];
    if (selectedStrand) {
      return DEPARTMENT_LABEL_MAP[selectedStrand.track] || "";
    }

    return "";
  };

  const buildStudentProfileAttributes = () => {
    const mappedStatus = STATUS_MAP[academicStatus];
    if (!mappedStatus) {
      return { error: "Please choose your academic status." };
    }

    const mappedYearLevel = YEAR_LEVEL_MAP[formValues.year_level];
    if (!mappedYearLevel) {
      return { error: "Please select your year level." };
    }

    const schoolLevel = ["11", "12"].includes(mappedYearLevel) ? "senior_high" : "college";
    const selectedProgram = isGraduated ? formValues.graduated_course_track : formValues.course_track;

    const profile = {
      status: mappedStatus,
      school_level: schoolLevel,
      year_level: mappedYearLevel,
    };

    if (schoolLevel === "college") {
      const selectedCourse = COURSE_MAP[selectedProgram];
      if (!selectedCourse) {
        return { error: "Please select a valid college course." };
      }

      profile.course = selectedCourse.course;
      profile.department = selectedCourse.department;
    } else {
      const selectedStrand = STRAND_MAP[selectedProgram];
      if (!selectedStrand) {
        return { error: "Please select a valid senior high strand." };
      }

      profile.track = selectedStrand.track;
      profile.strand = selectedStrand.strand;
    }

    if (isGraduated) {
      if (!formValues.graduated_from || !formValues.graduated_to) {
        return { error: "Please provide your previous school academic year range." };
      }

      if (schoolLevel === "college") {
        profile.prev_college_school_name = "ACLC";
        profile.prev_college_program = profile.course;
        profile.prev_college_year_from = Number(formValues.graduated_from);
        profile.prev_college_year_to = Number(formValues.graduated_to);
        profile.prev_college_department_track = profile.department;
      } else {
        profile.prev_senior_high_school_name = "ACLC";
        profile.prev_senior_high_program = profile.strand;
        profile.prev_senior_high_year_from = Number(formValues.graduated_from);
        profile.prev_senior_high_year_to = Number(formValues.graduated_to);
        profile.prev_senior_high_department_track = profile.track;
      }
    } else if (schoolLevel === "college") {
      profile.current_college_school_name = "ACLC";
      profile.current_college_program = profile.course;
      profile.current_college_level = profile.year_level;
      profile.current_college_department_track = profile.department;
    } else {
      profile.current_senior_high_school_name = "ACLC";
      profile.current_senior_high_program = profile.strand;
      profile.current_senior_high_level = profile.year_level;
      profile.current_senior_high_department_track = profile.track;
    }

    return { profile };
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
    if (step !== 3) {
      setStep(step + 1);
      return;
    }

    const { profile, error: profileError } = buildStudentProfileAttributes();
    if (profileError) {
      await ShowAlert({ icon: "error", title: "Registration Failed", text: profileError  });
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        user: {
          auth_id: formValues.usn.trim(),
          email: formValues.email.trim(),
          password: formValues.password,
          password_confirmation: formValues.password_confirmation,
          first_name: formValues.first_name.trim(),
          middle_name: hasNoMiddleName ? "" : formValues.middle_name.trim(),
          last_name: formValues.last_name.trim(),
          student_profile_attributes: profile,
        },
      };

      const response = await api("/api/v1/students/registrations", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const responseJson = await response.json();

      if (response.ok) {
        if (responseJson?.claim_required) {
          await ShowAlert({
            icon: "info",
            title: "Create Your Password",
            text: responseJson.message || "This account was already created by a staff. Check your email to create your password."
          });
          window.location.href = "/student/login";
        } else if (responseJson?.message) {
          await ShowAlert({ icon: "info", title: "Already Signed In", text: responseJson.message  });
        } else {
          await ShowAlert({ icon: "success", title: "Registration Successful", text: "Account created successfully."  });
          window.location.href = "/student/dashboard";
        }
      } else {
        await ShowAlert({ icon: "error", title: "Registration Failed", text: parseError(responseJson) || "Please review your inputs and try again."  });
      }
    } catch (error) {
      await ShowAlert({ icon: "error", title: "Registration Failed", text: "Something went wrong. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
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
          required={!hasNoMiddleName}
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
        <button className="btn btn-lg btn-primary w-100" type="button" onClick={submit}> Next </button>
      </>}
      {/* STEP ONE END*/}


      {/* STEP TWO START */}
      {step == 2 && <>
        <label htmlFor="usn">USN</label>
        <input
          id="usn"
          name="usn"
          placeholder="Enter USN"
          type="text"
          className="form-control form-control-lg mb-5"
          value={formValues.usn}
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
          <div className="fv-plugins-message-container fv-plugins-message-container--enabled invalid-feedback"></div>
        </div>

        <label htmlFor="password_confirmation">Re-enter Password</label>
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

        <button className="btn btn-lg btn-primary w-100" type="button" onClick={submit}> Next </button>
        <button className="btn btn-lg btn-secondary w-100 mt-5" type="button" onClick={prevStep}> Back </button>
        <InitPasswordToggler />
      </>}
      {/* STEP TWO END */}


      {/* STEP THREE START */}
      {step == 3 && <>
        <section className={isGraduated ? "d-none" : ""}>
          <div className="mb-5">
            <label htmlFor="year_level">Year Level</label>
            <select
              id="year_level"
              name="year_level"
              className="selectpicker w-100 bg-white rounded-2"
              data-style="btn-default"
              data-size="6"
              title="Select year level"
              value={formValues.year_level}
              onChange={handleInputChange}
              required={!isGraduated}
            >
              <option value="">Select year level</option>
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
              name="course_track"
              className="selectpicker w-100 bg-white rounded-2"
              data-style="btn-default"
              data-size="6"
              title="Select course or track"
              value={formValues.course_track}
              onChange={handleInputChange}
              required={!isGraduated}
            >
              <option value="">Select course or track</option>
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

          <div className="mb-7">
            <label htmlFor="department_display">Department</label>
            <div
              id="department_display"
              className="form-control d-flex align-items-center mb-0 bg-light border-0"
            >
              {getDepartmentDisplay(formValues.course_track) || "Department"}
            </div>
          </div>
        </section>

        <p className="text-black fw-semibold">Please check which fits if none leave unchecked:</p>
        <div>
          <input
            className="form-check-input me-2 my-1"
            type="checkbox"
            id="checkbox1"
            name="academic_status"
            value="current_enrolled"
            checked={academicStatus === "current_enrolled"}
            required={academicStatus === ""}
            onChange={() => handleAcademicStatusChange("current_enrolled")}
          />
          <label className="my-1" htmlFor="checkbox1">I am currently enrolled</label>
          <br/>
          <input
            className="form-check-input me-2 my-1"
            type="checkbox"
            id="checkbox2"
            name="academic_status"
            value="transferee"
            checked={academicStatus === "transferee"}
            required={academicStatus === ""}
            onChange={() => handleAcademicStatusChange("transferee")}
          />
          <label className="my-1" htmlFor="checkbox2">I am a transferee</label>
          <br/>
          <input
            className="form-check-input me-2 my-1"
            type="checkbox"
            id="checkbox3"
            name="academic_status"
            value="returnee"
            checked={academicStatus === "returnee"}
            required={academicStatus === ""}
            onChange={() => handleAcademicStatusChange("returnee")}
          />
          <label className="my-1" htmlFor="checkbox3">I am a returnee</label>
          <br/>
          <input
            className="form-check-input me-2 my-1"
            type="checkbox"
            id="checkbox4"
            name="academic_status"
            value="already_graduated"
            checked={academicStatus === "already_graduated"}
            required={academicStatus === ""}
            onChange={() => handleAcademicStatusChange("already_graduated")}
          />
          <label className="my-1" htmlFor="checkbox4">I already graduated</label>
        </div>
        <br />

        <section className={isGraduated ? "" : "d-none"}>
          <div className="mb-5">
            <label htmlFor="year_level_graduated">Year Level</label>
            <select
              id="year_level_graduated"
              name="year_level"
              className="selectpicker w-100 bg-white rounded-2"
              data-style="btn-default"
              data-size="6"
              title="Select year level"
              value={formValues.year_level}
              onChange={handleInputChange}
              required={isGraduated}
            >
              <option value="">Select year level</option>
              <option value="grade_12">Senior High School</option>
              <option value="4th_year">College</option>
            </select>
          </div>

          <label htmlFor="graduated_from">Academic Year</label>
          <div className="w-100 d-flex gap-4">
            <input
              id="graduated_from"
              name="graduated_from"
              placeholder="from"
              type="number"
              className="form-control mb-5"
              value={formValues.graduated_from}
              onChange={handleInputChange}
              required={isGraduated}
            />
            <input
              id="graduated_to"
              name="graduated_to"
              placeholder="to"
              type="number"
              className="form-control mb-5"
              value={formValues.graduated_to}
              onChange={handleInputChange}
              required={isGraduated}
            />
          </div>

          <div className="mb-5">
            <label htmlFor="graduated_course_track">Course/Track</label>
            <select
              id="graduated_course_track"
              name="graduated_course_track"
              className="selectpicker w-100 bg-white rounded-2"
              data-style="btn-default"
              data-size="6"
              title="Select course or track"
              value={formValues.graduated_course_track}
              onChange={handleInputChange}
              required={isGraduated}
            >
              <option value="">Select course or track</option>
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
            <label htmlFor="graduated_department_display">Department</label>
            <div
              id="graduated_department_display"
              className="form-control d-flex align-items-center mb-0 bg-light border-0"
            >
              {getDepartmentDisplay(formValues.graduated_course_track) || "Department"}
            </div>
          </div>
          <br/>
        </section>

        <button className="btn btn-lg btn-primary w-100" type="button" onClick={submit} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
        <button className="btn btn-lg btn-secondary w-100 mt-5" type="button" onClick={prevStep} disabled={isSubmitting}> Back </button>
        <InitBootstrapSelect />
      </>}
      {/* STEP THREE END */}
    </form>
  </div>
}
