"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import InitBootstrapSelect from "@/components/initializer/init-bootstrap-select";
import { api, parseError } from "@/lib/api";
import ShowAlert from "@/lib/show-alert";
import useSessionStore from "@/store/session-store";

const STATUS_OPTIONS = [
  { value: "currently_enrolled", label: "I am currently enrolled" },
  { value: "transferee", label: "I am a transferee" },
  { value: "returnee", label: "I am a returnee" },
  { value: "graduated", label: "I already graduated" },
];

const SCHOOL_LEVEL_OPTIONS = [
  { value: "college", label: "College" },
  { value: "senior_high", label: "Senior High School" },
];

const YEAR_LEVEL_OPTIONS = {
  college: ["1st", "2nd", "3rd", "4th"],
  senior_high: ["11", "12"],
};

const DEPARTMENT_OPTIONS = [
  { value: "computer_studies", label: "Computer Studies" },
  { value: "business", label: "Business" },
  { value: "culinary", label: "Culinary" },
];

const COURSE_OPTIONS_BY_DEPARTMENT = {
  computer_studies: [
    { value: "diploma_in_web_application_technology", label: "Diploma in Web Application Technology" },
    {
      value: "bachelor_of_science_in_information_technology",
      label: "Bachelor of Science in Information Technology",
    },
    { value: "bachelor_of_science_in_computer_science", label: "Bachelor of Science in Computer Science" },
  ],
  business: [
    {
      value: "diploma_in_office_administration_technology",
      label: "Diploma in Office Administration Technology",
    },
    { value: "diploma_in_office_management_technology", label: "Diploma in Office Management Technology" },
    {
      value: "bachelor_of_science_in_business_administration",
      label: "Bachelor of Science in Business Administration",
    },
  ],
  culinary: [
    {
      value: "diploma_in_hotel_and_restaurant_technology",
      label: "Diploma in Hotel and Restaurant Technology",
    },
    { value: "bachelor_of_science_in_hospitality_management", label: "Bachelor of Science in Hospitality Management" },
  ],
};

const TRACK_OPTIONS = [
  { value: "academic_track", label: "Academic Track" },
  { value: "technical_vocational_livelihood", label: "Technical-Vocational-Livelihood" },
];

const STRAND_OPTIONS_BY_TRACK = {
  academic_track: [
    { value: "STEM", label: "STEM" },
    { value: "ABM", label: "ABM" },
    { value: "HUMSS", label: "HUMSS" },
    { value: "GA", label: "GA" },
  ],
  technical_vocational_livelihood: [
    { value: "TVL - CSS", label: "TVL - CSS" },
    { value: "TVL - Programming", label: "TVL - Programming" },
    { value: "TVL - Animation", label: "TVL - Animation" },
    { value: "TVL - HE", label: "TVL - HE" },
  ],
};

const COLLEGE_COURSE_OPTIONS = Object.entries(COURSE_OPTIONS_BY_DEPARTMENT).flatMap(
  ([department, options]) => options.map((option) => ({ ...option, department }))
);

const SENIOR_HIGH_STRAND_OPTIONS = Object.entries(STRAND_OPTIONS_BY_TRACK).flatMap(
  ([track, options]) => options.map((option) => ({ ...option, track }))
);

const SENIOR_HIGH_PROGRAM_OPTIONS = SENIOR_HIGH_STRAND_OPTIONS.map(({ value, label }) => ({ value, label }));
const COLLEGE_PROGRAM_OPTIONS = COLLEGE_COURSE_OPTIONS.map(({ value, label }) => ({ value, label }));

const INITIAL_FORM = {
  status: "currently_enrolled",
  school_level: "college",
  year_level: "",
  course: "",
  department: "",
  strand: "",
  track: "",
  previous_from: "",
  previous_to: "",
  previous_program: "",
  previous_school_name: "",
  shs_from: "",
  shs_to: "",
  shs_program: "",
  shs_school_name: "",
  graduated_from: "",
  graduated_to: "",
};

const normalizeYear = (value) => {
  if (value === null || value === undefined || value === "") return "";
  return String(value);
};

const toNumberOrNil = (value) => {
  if (!value) return null;
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
};

const findCollegeOption = (value, department) => {
  if (!value) return null;
  return (
    COLLEGE_COURSE_OPTIONS.find((option) => option.value === value && option.department === department) ||
    COLLEGE_COURSE_OPTIONS.find((option) => option.value === value) ||
    null
  );
};

const findShsOption = (value, track) => {
  if (!value) return null;
  return (
    SENIOR_HIGH_STRAND_OPTIONS.find((option) => option.value === value && option.track === track) ||
    SENIOR_HIGH_STRAND_OPTIONS.find((option) => option.value === value) ||
    null
  );
};

const mapProfileToForm = (profile) => {
  const status = profile?.status || "currently_enrolled";
  const schoolLevel = profile?.school_level || "college";

  const isCollege = schoolLevel === "college";
  const isTransferee = status === "transferee";
  const isGraduated = status === "graduated";

  const previousSlot = isCollege
    ? isTransferee || isGraduated
      ? "prev_college"
      : "current_college"
    : isTransferee || isGraduated
      ? "prev_senior_high"
      : "current_senior_high";

  return {
    status,
    school_level: schoolLevel,
    year_level: profile?.year_level || "",
    course: profile?.course || profile?.strand || "",
    department: profile?.department || profile?.track || "",
    strand: profile?.strand || "",
    track: profile?.track || "",
    previous_from: normalizeYear(profile?.[`${previousSlot}_year_from`]),
    previous_to: normalizeYear(profile?.[`${previousSlot}_year_to`]),
    previous_program: profile?.[`${previousSlot}_program`] || "",
    previous_school_name: profile?.[`${previousSlot}_school_name`] || "",
    shs_from: normalizeYear(profile?.current_senior_high_year_from),
    shs_to: normalizeYear(profile?.current_senior_high_year_to),
    shs_program: profile?.current_senior_high_program || "",
    shs_school_name: profile?.current_senior_high_school_name || "",
    graduated_from: normalizeYear(profile?.[`${previousSlot}_year_from`]),
    graduated_to: normalizeYear(profile?.[`${previousSlot}_year_to`]),
  };
};

const SelectInput = ({ label, name, value, onChange, options, placeholder = "Please Choose..." }) => (
  <div className="col-md-6 mb-3">
    <label className="form-label fw-bold mb-1 small">{label}</label>
    <select
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      className="selectpicker w-100 bg-white rounded-2 academic-select"
      data-style="btn-default"
      data-size="6"
      title={placeholder}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

const YearRange = ({ fromName, toName, fromValue, toValue, onChange }) => (
  <div className="col-md-6 mb-3">
    <label className="form-label fw-bold mb-1 small">Academic Year</label>
    <div className="d-flex align-items-center gap-2">
      <input
        type="number"
        min="1900"
        name={fromName}
        value={fromValue}
        onChange={onChange}
        className="form-control shadow-none"
        placeholder="From"
      />
      <span className="small text-muted">-</span>
      <input
        type="number"
        min="1900"
        name={toName}
        value={toValue}
        onChange={onChange}
        className="form-control shadow-none"
        placeholder="To"
      />
    </div>
  </div>
);

export default function AcademicInfoPage() {
  const { student_id: studentId } = useParams();
  const isStaffMode = Boolean(studentId);
  const studentEndpoint = studentId ? `/api/v1/students/${studentId}` : "/api/v1/students/personal_info";
  const { saveCurrentUser } = useSessionStore();

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [initialFormData, setInitialFormData] = useState(INITIAL_FORM);
  const [profileId, setProfileId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const syncCurrentUser = useCallback(async () => {
    if (isStaffMode) return;

    try {
      const response = await api("/api/v1/students/personal_info");
      const payload = await response.json();
      if (!response.ok) return;

      saveCurrentUser({
        id: payload?.id,
        auth_id: payload?.auth_id,
        type: payload?.type || "Student",
        first_name: payload?.first_name || "",
        middle_name: payload?.middle_name || "",
        last_name: payload?.last_name || "",
        extension: payload?.extension || "",
        full_name: payload?.full_name || "",
        avatar_url: payload?.avatar_url || null,
        incomplete_personal_info: Boolean(payload?.incomplete_personal_info),
        incomplete_family_info: Boolean(payload?.incomplete_family_info),
        incomplete_academic_info: Boolean(payload?.incomplete_academic_info),
      });
    } catch {
      // no-op
    }
  }, [isStaffMode, saveCurrentUser]);

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
          throw new Error(payload?.error || "Failed to load academic information.");
        }

        if (!isMounted) return;

        const profile = payload?.student_profile || {};
        const nextFormData = mapProfileToForm(profile);

        setProfileId(profile?.id || null);
        setFormData(nextFormData);
        setInitialFormData(nextFormData);
        await syncCurrentUser();
      } catch (err) {
        if (!isMounted) return;
        setError(err?.message || "Failed to load academic information.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadCurrentStudent();

    return () => {
      isMounted = false;
    };
  }, [studentEndpoint, syncCurrentUser]);

  const hasChanges = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(initialFormData),
    [formData, initialFormData]
  );

  const isCollege = formData.school_level === "college";
  const isSeniorHigh = formData.school_level === "senior_high";
  const isTransferee = formData.status === "transferee";
  const isGraduated = formData.status === "graduated";

  const yearLevelOptions = YEAR_LEVEL_OPTIONS[formData.school_level] || [];

  const departmentTrackOptions = useMemo(() => {
    if (isCollege) return DEPARTMENT_OPTIONS;
    if (isSeniorHigh) return TRACK_OPTIONS;
    return [];
  }, [isCollege, isSeniorHigh]);

  const courseProgramOptions = useMemo(() => {
    if (isCollege) {
      if (COURSE_OPTIONS_BY_DEPARTMENT[formData.department]) {
        return COURSE_OPTIONS_BY_DEPARTMENT[formData.department];
      }
      return COLLEGE_PROGRAM_OPTIONS;
    }

    if (isSeniorHigh) {
      if (STRAND_OPTIONS_BY_TRACK[formData.department]) {
        return STRAND_OPTIONS_BY_TRACK[formData.department];
      }
      return SENIOR_HIGH_PROGRAM_OPTIONS;
    }

    return [];
  }, [formData.department, isCollege, isSeniorHigh]);

  const previousProgramOptions = useMemo(() => {
    if (isCollege) return COLLEGE_PROGRAM_OPTIONS;
    if (isSeniorHigh) return SENIOR_HIGH_PROGRAM_OPTIONS;
    return [];
  }, [isCollege, isSeniorHigh]);

  const showSeniorHighSection = isCollege && !isGraduated;

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setSaveMessage("");

    setFormData((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "school_level") {
        next.year_level = "";
        next.course = "";
        next.department = "";
        next.strand = "";
        next.track = "";
        next.previous_program = "";
        if (value !== "college") {
          next.shs_from = "";
          next.shs_to = "";
          next.shs_program = "";
          next.shs_school_name = "";
        }
      }

      if (name === "department") {
        if (next.school_level === "college") {
          const departmentCourses = COURSE_OPTIONS_BY_DEPARTMENT[value] || [];
          if (!departmentCourses.some((option) => option.value === next.course)) {
            next.course = "";
          }
        } else {
          const trackPrograms = STRAND_OPTIONS_BY_TRACK[value] || [];
          if (!trackPrograms.some((option) => option.value === next.course)) {
            next.course = "";
          }
        }
      }

      if (name === "course") {
        const selectedCollegeCourse = findCollegeOption(value, next.department);
        const selectedShsProgram = findShsOption(value, next.department);

        if (next.school_level === "college" && selectedCollegeCourse) {
          next.department = selectedCollegeCourse.department;
        }

        if (next.school_level === "senior_high" && selectedShsProgram) {
          next.department = selectedShsProgram.track;
        }
      }

      if (name === "previous_program" && next.status === "transferee") {
        if (next.school_level === "college") {
          const selected = findCollegeOption(value);
          if (selected && !next.course) {
            next.course = selected.value;
            next.department = selected.department;
          }
        }

        if (next.school_level === "senior_high") {
          const selected = findShsOption(value);
          if (selected && !next.course) {
            next.course = selected.value;
            next.department = selected.track;
          }
        }
      }

      return next;
    });
  };

  const handleStatusChange = (status) => {
    setSaveMessage("");
    setFormData((prev) => ({ ...prev, status }));
  };

  const handleDiscard = () => {
    setFormData(initialFormData);
    setSaveMessage("");
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveMessage("");

      const isGraduatedStatus = formData.status === "graduated";
      const resolvedSchoolLevel = formData.school_level;

      let resolvedYearLevel = null;
      let resolvedCourse = null;
      let resolvedDepartment = null;
      let resolvedStrand = null;
      let resolvedTrack = null;

      if (!isGraduatedStatus) {
        if (!formData.year_level) {
          throw new Error("Please select year level.");
        }

        const levelFromYear = ["11", "12"].includes(formData.year_level) ? "senior_high" : "college";
        if (resolvedSchoolLevel !== levelFromYear) {
          throw new Error("Year level does not match selected school level.");
        }

        resolvedYearLevel = formData.year_level;
      }

      if (resolvedSchoolLevel === "college") {
        const selectedCourse = findCollegeOption(formData.course, formData.department);
        if (!selectedCourse) {
          throw new Error("Please select a valid college department/track and course/program.");
        }

        resolvedCourse = selectedCourse.value;
        resolvedDepartment = selectedCourse.department;
      } else {
        const selectedStrand = findShsOption(formData.course, formData.department);
        if (!selectedStrand) {
          throw new Error("Please select a valid senior high department/track and course/program.");
        }

        resolvedStrand = selectedStrand.value;
        resolvedTrack = selectedStrand.track;
      }

      const selectedPreviousCollege = findCollegeOption(formData.previous_program);
      const selectedPreviousShs = findShsOption(formData.previous_program);
      const selectedCurrentShs = findShsOption(formData.shs_program);

      const slotFields = {
        current_college_school_name: null,
        current_college_program: null,
        current_college_level: null,
        current_college_year_from: null,
        current_college_year_to: null,
        current_college_department_track: null,
        prev_college_school_name: null,
        prev_college_program: null,
        prev_college_level: null,
        prev_college_year_from: null,
        prev_college_year_to: null,
        prev_college_department_track: null,
        current_senior_high_school_name: null,
        current_senior_high_program: null,
        current_senior_high_level: null,
        current_senior_high_year_from: null,
        current_senior_high_year_to: null,
        current_senior_high_department_track: null,
        prev_senior_high_school_name: null,
        prev_senior_high_program: null,
        prev_senior_high_level: null,
        prev_senior_high_year_from: null,
        prev_senior_high_year_to: null,
        prev_senior_high_department_track: null,
      };

      if (resolvedSchoolLevel === "college" && !isGraduatedStatus) {
        slotFields.current_college_school_name = "ACLC";
        slotFields.current_college_program = resolvedCourse;
        slotFields.current_college_level = resolvedYearLevel;
        slotFields.current_college_department_track = resolvedDepartment;
      }

      if (resolvedSchoolLevel === "senior_high" && !isGraduatedStatus) {
        slotFields.current_senior_high_school_name = "ACLC";
        slotFields.current_senior_high_program = resolvedStrand;
        slotFields.current_senior_high_level = resolvedYearLevel;
        slotFields.current_senior_high_department_track = resolvedTrack;
      }

      if (formData.status === "transferee") {
        if (resolvedSchoolLevel === "college") {
          slotFields.prev_college_school_name = (formData.previous_school_name || "").trim() || "ACLC";
          slotFields.prev_college_program = selectedPreviousCollege?.value || formData.previous_program || resolvedCourse;
          slotFields.prev_college_level = resolvedYearLevel;
          slotFields.prev_college_year_from = toNumberOrNil(formData.previous_from);
          slotFields.prev_college_year_to = toNumberOrNil(formData.previous_to);
          slotFields.prev_college_department_track = selectedPreviousCollege?.department || resolvedDepartment;

          slotFields.current_senior_high_school_name = (formData.shs_school_name || "").trim() || "ACLC";
          slotFields.current_senior_high_program = selectedCurrentShs?.value || formData.shs_program;
          slotFields.current_senior_high_level = "12";
          slotFields.current_senior_high_year_from = toNumberOrNil(formData.shs_from);
          slotFields.current_senior_high_year_to = toNumberOrNil(formData.shs_to);
          slotFields.current_senior_high_department_track = selectedCurrentShs?.track || null;
        }

        if (resolvedSchoolLevel === "senior_high") {
          slotFields.prev_senior_high_school_name = (formData.previous_school_name || "").trim() || "ACLC";
          slotFields.prev_senior_high_program = selectedPreviousShs?.value || formData.previous_program || resolvedStrand;
          slotFields.prev_senior_high_level = resolvedYearLevel;
          slotFields.prev_senior_high_year_from = toNumberOrNil(formData.previous_from);
          slotFields.prev_senior_high_year_to = toNumberOrNil(formData.previous_to);
          slotFields.prev_senior_high_department_track = selectedPreviousShs?.track || resolvedTrack;
        }
      }

      if (formData.status === "currently_enrolled" || formData.status === "returnee") {
        if (resolvedSchoolLevel === "college") {
          slotFields.current_senior_high_school_name = (formData.shs_school_name || "").trim() || "ACLC";
          slotFields.current_senior_high_program = selectedCurrentShs?.value || formData.shs_program;
          slotFields.current_senior_high_level = "12";
          slotFields.current_senior_high_year_from = toNumberOrNil(formData.shs_from);
          slotFields.current_senior_high_year_to = toNumberOrNil(formData.shs_to);
          slotFields.current_senior_high_department_track = selectedCurrentShs?.track || null;
        }
      }

      if (formData.status === "graduated") {
        if (resolvedSchoolLevel === "college") {
          slotFields.prev_college_school_name = "ACLC";
          slotFields.prev_college_program = resolvedCourse;
          slotFields.prev_college_level = null;
          slotFields.prev_college_year_from = toNumberOrNil(formData.graduated_from);
          slotFields.prev_college_year_to = toNumberOrNil(formData.graduated_to);
          slotFields.prev_college_department_track = resolvedDepartment;
        } else {
          slotFields.prev_senior_high_school_name = "ACLC";
          slotFields.prev_senior_high_program = resolvedStrand;
          slotFields.prev_senior_high_level = null;
          slotFields.prev_senior_high_year_from = toNumberOrNil(formData.graduated_from);
          slotFields.prev_senior_high_year_to = toNumberOrNil(formData.graduated_to);
          slotFields.prev_senior_high_department_track = resolvedTrack;
        }
      }

      const payload = {
        student: {
          student_profile_attributes: {
            ...(profileId ? { id: profileId } : {}),
            status: formData.status || null,
            school_level: resolvedSchoolLevel || null,
            year_level: resolvedYearLevel,
            course: resolvedCourse,
            department: resolvedDepartment,
            strand: resolvedStrand,
            track: resolvedTrack,
            ...slotFields,
          },
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
        throw new Error(parseError(responseJson) || responseJson?.error || "Failed to save changes.");
      }

      const profile = responseJson?.student_profile || {};
      const nextFormData = mapProfileToForm(profile);

      setProfileId(profile?.id || null);
      setFormData(nextFormData);
      setInitialFormData(nextFormData);
      await syncCurrentUser();
      setSaveMessage("Changes saved.");

      await ShowAlert({
        icon: "success",
        title: "Successfully Updated",
        text: "sucessfully updated",
      });
    } catch (err) {
      await ShowAlert({
        icon: "error",
        title: "Update Failed",
        text: err?.message || "Failed to save changes.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-vh-100 py-4">
      <div className="container" style={{ maxWidth: "760px" }}>
        <InitBootstrapSelect
          key={`${formData.status}-${formData.school_level}-${formData.department}-${formData.course}-${isLoading}`}
          selector=".academic-select"
        />

        <div className="d-flex justify-content-between align-items-center">
          <h3 className="text-primary fw-bold m-0">Academic Information</h3>
          {!isLoading && hasChanges && (
            <div className="mb-3 d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-outline-danger rounded-pill"
                onClick={handleDiscard}
                disabled={isSaving}
              >
                Discard
              </button>
              <button type="button" className="btn btn-info text-white rounded-pill" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </button>
              {saveMessage && <span className="small text-success">{saveMessage}</span>}
            </div>
          )}
        </div>
        <hr />

        {isLoading && <p className="small text-muted mb-3">Loading academic information...</p>}
        {error && <p className="small text-danger mb-3">{error}</p>}

        <div className="mb-4">
          <label className="form-label fw-bold mb-2">Status</label>
          <div className="d-flex flex-column gap-2">
            {STATUS_OPTIONS.map((status) => (
              <div key={status.value} className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`status-${status.value}`}
                  checked={formData.status === status.value}
                  onChange={() => handleStatusChange(status.value)}
                />
                <label className="form-check-label small" htmlFor={`status-${status.value}`}>
                  {status.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="row g-3">
          <SelectInput
            label="College or Senior High?"
            name="school_level"
            value={formData.school_level}
            onChange={handleInputChange}
            options={SCHOOL_LEVEL_OPTIONS}
          />

          {isGraduated ? (
            <YearRange
              fromName="graduated_from"
              toName="graduated_to"
              fromValue={formData.graduated_from}
              toValue={formData.graduated_to}
              onChange={handleInputChange}
            />
          ) : (
            <SelectInput
              label="Year Level"
              name="year_level"
              value={formData.year_level}
              onChange={handleInputChange}
              options={yearLevelOptions.map((year) => ({ value: year, label: year }))}
              placeholder="Year Level"
            />
          )}

          <SelectInput
            label="Course/Program"
            name="course"
            value={formData.course}
            onChange={handleInputChange}
            options={courseProgramOptions}
          />
          <SelectInput
            label="Department/Track"
            name="department"
            value={formData.department}
            onChange={handleInputChange}
            options={departmentTrackOptions}
          />
        </div>

        {isTransferee && (
          <>
            <h6 className="fw-bold mt-4 mb-3">Previous School</h6>
            <div className="row g-3">
              <YearRange
                fromName="previous_from"
                toName="previous_to"
                fromValue={formData.previous_from}
                toValue={formData.previous_to}
                onChange={handleInputChange}
              />
              <SelectInput
                label="Course/Program"
                name="previous_program"
                value={formData.previous_program}
                onChange={handleInputChange}
                options={previousProgramOptions}
              />
              <div className="col-md-12 mb-3">
                <label className="form-label fw-bold mb-1 small">Name of School</label>
                <input
                  type="text"
                  name="previous_school_name"
                  value={formData.previous_school_name}
                  onChange={handleInputChange}
                  className="form-control form-control-lg shadow-none"
                  placeholder="Name of School"
                />
              </div>
              <div className="col-12">
                <div className="bg-light p-3 text-black">
                  <span className="text-danger fw-bold">Note:</span> if you have transferred from multiple schools,
                  please enter the last school you attended before transferring to this institution.
                </div>
              </div>
            </div>
          </>
        )}

        {showSeniorHighSection && (
          <>
            <h6 className="fw-bold mt-4 mb-3">Senior High School</h6>
            <div className="row g-3">
              <YearRange
                fromName="shs_from"
                toName="shs_to"
                fromValue={formData.shs_from}
                toValue={formData.shs_to}
                onChange={handleInputChange}
              />
              <SelectInput
                label={isTransferee ? "Strand" : "Track/Program"}
                name="shs_program"
                value={formData.shs_program}
                onChange={handleInputChange}
                options={SENIOR_HIGH_PROGRAM_OPTIONS}
              />
              <div className="col-md-12 mb-3">
                <label className="form-label fw-bold mb-1 small">Name of School</label>
                <input
                  type="text"
                  name="shs_school_name"
                  value={formData.shs_school_name}
                  onChange={handleInputChange}
                  className="form-control form-control-lg shadow-none"
                  placeholder="Name of School"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
