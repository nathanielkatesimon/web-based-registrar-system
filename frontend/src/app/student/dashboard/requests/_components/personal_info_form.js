"use client";

import { useEffect, useMemo, useState } from "react";
import InitBootstrapSelect from "@/components/initializer/init-bootstrap-select";
import { api, parseError } from "@/lib/api";
import ShowAlert from "@/lib/show-alert";

const STATUS_OPTIONS = [
  { value: "currently_enrolled", label: "I am currently enrolled" },
  { value: "transferee", label: "I am a transferee" },
  { value: "returnee", label: "I am a returnee" },
  { value: "graduated", label: "I already graduated" },
];

const YEAR_LEVEL_OPTIONS = [
  { value: "11", label: "Grade 11", schoolLevel: "senior_high" },
  { value: "12", label: "Grade 12", schoolLevel: "senior_high" },
  { value: "1st", label: "1st Year", schoolLevel: "college" },
  { value: "2nd", label: "2nd Year", schoolLevel: "college" },
  { value: "3rd", label: "3rd Year", schoolLevel: "college" },
  { value: "4th", label: "4th Year", schoolLevel: "college" },
];

const GRADUATED_YEAR_OPTIONS = [
  { value: "12", label: "Senior High", schoolLevel: "senior_high" },
  { value: "4th", label: "College", schoolLevel: "college" },
];

const DEPARTMENT_OPTIONS = [
  { value: "computer_studies", label: "Computer Studies", schoolLevel: "college" },
  { value: "business", label: "Business", schoolLevel: "college" },
  { value: "culinary", label: "Culinary", schoolLevel: "college" },
  { value: "academic_track", label: "Academic Track", schoolLevel: "senior_high" },
  {
    value: "technical_vocational_livelihood",
    label: "Technical-Vocational-Livelihood",
    schoolLevel: "senior_high",
  },
];

const PROGRAM_OPTIONS = [
  {
    value: "diploma_in_web_application_technology",
    label: "Diploma in Web Application Technology",
    schoolLevel: "college",
    department: "computer_studies",
  },
  {
    value: "bachelor_of_science_in_information_technology",
    label: "Bachelor of Science in Information Technology",
    schoolLevel: "college",
    department: "computer_studies",
  },
  {
    value: "bachelor_of_science_in_computer_science",
    label: "Bachelor of Science in Computer Science",
    schoolLevel: "college",
    department: "computer_studies",
  },
  {
    value: "diploma_in_office_administration_technology",
    label: "Diploma in Office Administration Technology",
    schoolLevel: "college",
    department: "business",
  },
  {
    value: "diploma_in_office_management_technology",
    label: "Diploma in Office Management Technology",
    schoolLevel: "college",
    department: "business",
  },
  {
    value: "bachelor_of_science_in_business_administration",
    label: "Bachelor of Science in Business Administration",
    schoolLevel: "college",
    department: "business",
  },
  {
    value: "diploma_in_hotel_and_restaurant_technology",
    label: "Diploma in Hotel and Restaurant Technology",
    schoolLevel: "college",
    department: "culinary",
  },
  {
    value: "bachelor_of_science_in_hospitality_management",
    label: "Bachelor of Science in Hospitality Management",
    schoolLevel: "college",
    department: "culinary",
  },
  { value: "STEM", label: "STEM", schoolLevel: "senior_high", department: "academic_track" },
  { value: "ABM", label: "ABM", schoolLevel: "senior_high", department: "academic_track" },
  { value: "HUMSS", label: "HUMSS", schoolLevel: "senior_high", department: "academic_track" },
  { value: "GA", label: "GA", schoolLevel: "senior_high", department: "academic_track" },
  {
    value: "TVL - CSS",
    label: "TVL - CSS",
    schoolLevel: "senior_high",
    department: "technical_vocational_livelihood",
  },
  {
    value: "TVL - Programming",
    label: "TVL - Programming",
    schoolLevel: "senior_high",
    department: "technical_vocational_livelihood",
  },
  {
    value: "TVL - Animation",
    label: "TVL - Animation",
    schoolLevel: "senior_high",
    department: "technical_vocational_livelihood",
  },
  {
    value: "TVL - HE",
    label: "TVL - HE",
    schoolLevel: "senior_high",
    department: "technical_vocational_livelihood",
  },
];

const INPUT_BG = "#F0F0F0";

const INITIAL_FORM = {
  first_name: "",
  middle_name: "",
  last_name: "",
  extension: "",
  contact_number: "",
  sex: "",
  email: "",
  usn: "",
  status: "currently_enrolled",
  year_level: "",
  program: "",
  department: "",
};

const getSchoolLevelFromYear = (yearLevel) => {
  if (!yearLevel) return "";
  if (yearLevel === "11" || yearLevel === "12") return "senior_high";
  return "college";
};

const getProgramByValue = (value) => PROGRAM_OPTIONS.find((option) => option.value === value) || null;
const getDepartmentByValue = (value) => DEPARTMENT_OPTIONS.find((option) => option.value === value) || null;

const mapPayloadToForm = (payload) => {
  const profile = payload?.student_profile || {};
  const yearLevel = profile?.year_level ? String(profile.year_level) : "";

  const profileProgram = profile?.course || profile?.strand || "";
  const profileDepartment = profile?.department || profile?.track || "";
  const resolvedProgram = getProgramByValue(profileProgram);
  const resolvedDepartment = getDepartmentByValue(profileDepartment);

  return {
    first_name: payload?.first_name || "",
    middle_name: payload?.middle_name || "",
    last_name: payload?.last_name || "",
    extension: payload?.extension || "",
    contact_number: profile?.contact_number || "",
    sex: profile?.sex || "",
    email: payload?.email || "",
    usn: payload?.auth_id || "",
    status: profile?.status || "currently_enrolled",
    year_level:
      profile?.status === "graduated" && !["12", "4th"].includes(yearLevel)
        ? ""
        : yearLevel,
    program: resolvedProgram?.value || profileProgram,
    department: resolvedDepartment?.value || profileDepartment,
  };
};

export default function PersonalInfoForm() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [initialFormData, setInitialFormData] = useState(INITIAL_FORM);
  const [profileId, setProfileId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadCurrentStudent = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await api("/api/v1/students/personal_info");
        let payload = null;

        try {
          payload = await response.json();
        } catch {
          payload = null;
        }

        if (!response.ok) {
          throw new Error(parseError(payload) || payload?.error || "Failed to load personal information.");
        }

        if (!isMounted) return;

        const nextFormData = mapPayloadToForm(payload || {});
        setProfileId(payload?.student_profile?.id || null);
        setFormData(nextFormData);
        setInitialFormData(nextFormData);
      } catch (err) {
        if (!isMounted) return;
        setError(err?.message || "Failed to load personal information.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadCurrentStudent();

    return () => {
      isMounted = false;
    };
  }, []);

  const schoolLevel = useMemo(() => getSchoolLevelFromYear(formData.year_level), [formData.year_level]);

  const availableDepartments = useMemo(() => {
    if (!schoolLevel) return DEPARTMENT_OPTIONS;
    return DEPARTMENT_OPTIONS.filter((option) => option.schoolLevel === schoolLevel);
  }, [schoolLevel]);

  const availablePrograms = useMemo(() => {
    if (!schoolLevel) return PROGRAM_OPTIONS;
    if (formData.department) {
      return PROGRAM_OPTIONS.filter(
        (option) => option.schoolLevel === schoolLevel && option.department === formData.department
      );
    }
    return PROGRAM_OPTIONS.filter((option) => option.schoolLevel === schoolLevel);
  }, [formData.department, schoolLevel]);

  const yearLevelOptions = useMemo(() => {
    if (formData.status === "graduated") return GRADUATED_YEAR_OPTIONS;
    return YEAR_LEVEL_OPTIONS;
  }, [formData.status]);

  const hasChanges = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(initialFormData),
    [formData, initialFormData]
  );

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "year_level") {
        const nextSchoolLevel = getSchoolLevelFromYear(value);
        const selectedProgram = getProgramByValue(next.program);
        const selectedDepartment = getDepartmentByValue(next.department);

        if (selectedProgram && selectedProgram.schoolLevel !== nextSchoolLevel) {
          next.program = "";
        }
        if (selectedDepartment && selectedDepartment.schoolLevel !== nextSchoolLevel) {
          next.department = "";
        }
      }

      if (name === "department") {
        const selectedProgram = getProgramByValue(next.program);
        if (selectedProgram && selectedProgram.department !== value) {
          next.program = "";
        }
      }

      if (name === "program") {
        const selectedProgram = getProgramByValue(value);
        if (selectedProgram) {
          next.department = selectedProgram.department;
        }
      }

      return next;
    });
  };

  const handleStatusChange = (status) => {
    setFormData((prev) => {
      const next = { ...prev, status };
      if (status === "graduated" && !["12", "4th"].includes(next.year_level)) {
        next.year_level = "";
        next.program = "";
        next.department = "";
      }
      return next;
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleDiscard = () => {
    setFormData(initialFormData);
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      if (!formData.first_name || !formData.last_name || !formData.contact_number || !formData.sex) {
        throw new Error("Please fill in all required personal information fields.");
      }

      if (!formData.year_level || !formData.program || !formData.department) {
        throw new Error("Please select year level, course/track, and department.");
      }

      const selectedProgram = getProgramByValue(formData.program);
      const selectedDepartment = getDepartmentByValue(formData.department);
      const resolvedSchoolLevel = getSchoolLevelFromYear(formData.year_level);

      if (!selectedProgram || !selectedDepartment) {
        throw new Error("Please select valid course/track and department.");
      }

      if (
        selectedProgram.schoolLevel !== resolvedSchoolLevel ||
        selectedDepartment.schoolLevel !== resolvedSchoolLevel ||
        selectedProgram.department !== selectedDepartment.value
      ) {
        throw new Error("Selected year level does not match course/track and department.");
      }

      const payload = {
        student: {
          first_name: formData.first_name,
          middle_name: formData.middle_name,
          last_name: formData.last_name,
          extension: formData.extension,
          student_profile_attributes: {
            ...(profileId ? { id: profileId } : {}),
            contact_number: formData.contact_number,
            sex: formData.sex,
            status: formData.status || null,
            school_level: resolvedSchoolLevel || null,
            year_level: formData.year_level || null,
            course: resolvedSchoolLevel === "college" ? selectedProgram.value : null,
            department: resolvedSchoolLevel === "college" ? selectedDepartment.value : null,
            strand: resolvedSchoolLevel === "senior_high" ? selectedProgram.value : null,
            track: resolvedSchoolLevel === "senior_high" ? selectedDepartment.value : null,
          },
        },
      };

      setIsSaving(true);

      const response = await api("/api/v1/students/personal_info", {
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

      const nextFormData = mapPayloadToForm(responseJson || {});
      setProfileId(responseJson?.student_profile?.id || null);
      setFormData(nextFormData);
      setInitialFormData(nextFormData);
      setIsEditing(false);

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

  const isReadOnly = !isEditing || isLoading;
  const saveDisabled = !hasChanges || isSaving || isLoading;

  return (
    <div style={{ maxWidth: 1072 }}>
        <InitBootstrapSelect
          key={`request-form-${formData.year_level}-${formData.department}-${formData.program}-${isReadOnly}`}
          selector=".request-form-select"
        />

        <div className="rounded-1 p-3 mb-4 text-primary" style={{ backgroundColor: "#f2f2f2" }}>
          <i className="bx bx-info-circle pb-1 fs-5 me-2 align-middle"></i>
          <span>
            Please review and verify that all information below is correct and up to date.
          </span>
        </div>

        <div className="d-flex justify-content-end align-items-center gap-2 mb-3">
          {!isEditing ? (
            <button type="button" className="btn btn-primary rounded-pill px-4" onClick={handleEdit} disabled={isLoading}>
              Edit
            </button>
          ) : (
            <>
              <button type="button" className="btn btn-outline-danger rounded-pill px-4" onClick={handleDiscard} disabled={isSaving}>
                Discard
              </button>
              <button type="button" className="btn btn-primary rounded-pill px-4" onClick={handleSave} disabled={saveDisabled}>
                {isSaving ? "Saving..." : "Save"}
              </button>
            </>
          )}
        </div>

        {isLoading && <p className="small text-muted mb-3">Loading personal information...</p>}
        {error && <p className="small text-danger mb-3">{error}</p>}

        <h4 className="fw-bold text-primary">Personal Information</h4>

        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label fw-semibold small mb-1">
              First Name<span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              readOnly={isReadOnly}
              className="form-control shadow-none"
              style={{ backgroundColor: INPUT_BG }}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold small mb-1">Middle Name</label>
            <input
              type="text"
              name="middle_name"
              value={formData.middle_name}
              onChange={handleInputChange}
              readOnly={isReadOnly}
              className="form-control shadow-none"
              style={{ backgroundColor: INPUT_BG }}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold small mb-1">
              Last Name<span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              readOnly={isReadOnly}
              className="form-control shadow-none"
              style={{ backgroundColor: INPUT_BG }}
            />
          </div>
          <div className="col-md-6 col-lg-3">
            <label className="form-label fw-semibold small mb-1">Extension</label>
            <input
              type="text"
              name="extension"
              value={formData.extension}
              onChange={handleInputChange}
              readOnly={isReadOnly}
              className="form-control shadow-none"
              style={{ backgroundColor: INPUT_BG }}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold small mb-1">
              Contact Number<span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="contact_number"
              value={formData.contact_number}
              onChange={handleInputChange}
              readOnly={isReadOnly}
              className="form-control shadow-none"
              style={{ backgroundColor: INPUT_BG }}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold small mb-1 d-block">
              Sex<span className="text-danger">*</span>
            </label>
            <div className="d-flex align-items-center gap-4 pt-1">
              <div className="form-check mb-0">
                <input
                  className="form-check-input"
                  type="radio"
                  id="request-sex-male"
                  name="sex"
                  value="male"
                  checked={formData.sex === "male"}
                  onChange={handleInputChange}
                  disabled={isReadOnly}
                />
                <label className="form-check-label small" htmlFor="request-sex-male">
                  MALE
                </label>
              </div>
              <div className="form-check mb-0">
                <input
                  className="form-check-input"
                  type="radio"
                  id="request-sex-female"
                  name="sex"
                  value="female"
                  checked={formData.sex === "female"}
                  onChange={handleInputChange}
                  disabled={isReadOnly}
                />
                <label className="form-check-label small" htmlFor="request-sex-female">
                  FEMALE
                </label>
              </div>
            </div>
          </div>

          <div className="col-md-9">
            <label className="form-label fw-semibold small mb-1">
              Email Address<span className="text-danger">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              readOnly
              className="form-control shadow-none"
              style={{ backgroundColor: INPUT_BG }}
            />
          </div>

          <div className="col-12">
            <div className="d-flex flex-column gap-2">
              {STATUS_OPTIONS.map((status) => (!isReadOnly || status.value === formData.status) && (
                <div className="form-check" key={status.value}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`request-status-${status.value}`}
                    checked={formData.status === status.value}
                    onChange={() => handleStatusChange(status.value)}
                    disabled={isReadOnly}
                  />
                  <label className="form-check-label small" htmlFor={`request-status-${status.value}`}>
                    {status.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold small mb-1">
              USN<span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={formData.usn}
              readOnly
              className="form-control shadow-none"
              style={{ backgroundColor: INPUT_BG }}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold small mb-1">
              Year Level<span className="text-danger">*</span>
            </label>
            <select
              name="year_level"
              value={formData.year_level}
              onChange={handleInputChange}
              className="selectpicker w-100 request-form-select"
              data-style="btn-default"
              data-size="6"
              title="Year Level"
              disabled={isReadOnly}
            >
              <option value="">Year Level</option>
              {yearLevelOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold small mb-1">
              Course/Track<span className="text-danger">*</span>
            </label>
            <select
              name="program"
              value={formData.program}
              onChange={handleInputChange}
              className="selectpicker w-100 request-form-select"
              data-style="btn-default"
              data-size="6"
              title="Course/Track"
              disabled={isReadOnly}
            >
              <option value="">Course/Track</option>
              {availablePrograms.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold small mb-1">
              Department<span className="text-danger">*</span>
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              className="selectpicker w-100 request-form-select"
              data-style="btn-default"
              data-size="6"
              title="Department"
              disabled={isReadOnly}
            >
              <option value="">Department</option>
              {availableDepartments.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

      <style jsx>{`
        :global(.request-form-select + .dropdown-toggle) {
          background-color: ${INPUT_BG} !important;
          border: 0 !important;
          box-shadow: none !important;
        }
        :global(.request-form-select + .dropdown-toggle .filter-option) {
          font-size: 0.92rem;
        }
      `}</style>
    </div>
  );
}
