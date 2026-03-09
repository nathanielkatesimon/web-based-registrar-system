"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import ShowAlert from "@/lib/show-alert";
import useSessionStore from "@/store/session-store";

const INITIAL_FORM = {
  father_first_name: "",
  father_middle_name: "",
  father_last_name: "",
  father_extension: "",
  father_home_address: "",
  father_occupation: "",
  father_office_company_name: "",
  father_company_address: "",
  father_contact_number: "",
  father_email_address: "",
  mother_first_name: "",
  mother_middle_name: "",
  mother_last_name: "",
  mother_extension: "",
  mother_home_address: "",
  mother_occupation: "",
  mother_office_company_name: "",
  mother_company_address: "",
  mother_contact_number: "",
  mother_email_address: "",
  guardian_first_name: "",
  guardian_middle_name: "",
  guardian_last_name: "",
  guardian_extension: "",
  guardian_home_address: "",
  guardian_occupation: "",
  guardian_office_company_name: "",
  guardian_company_address: "",
  guardian_contact_number: "",
  guardian_email_address: "",
};

const toFormData = (payload) => {
  const source = payload?.family_info || payload;
  return Object.keys(INITIAL_FORM).reduce(
    (acc, key) => ({ ...acc, [key]: source?.[key] || "" }),
    {}
  );
};

const PersonSection = ({ title, prefix, formData, onChange }) => (
  <>
    <h6 className="fw-bold mt-4 mb-3">{title}</h6>
    <div className="row g-3">
      <div className="col-md-6 mb-3">
        <label className="form-label fw-bold mb-1 small">First Name</label>
        <input
          type="text"
          name={`${prefix}_first_name`}
          value={formData[`${prefix}_first_name`]}
          onChange={onChange}
          className="form-control form-control-lg shadow-none"
          placeholder="First Name"
        />
      </div>
      <div className="col-md-6 mb-3">
        <label className="form-label fw-bold mb-1 small">Middle Name</label>
        <input
          type="text"
          name={`${prefix}_middle_name`}
          value={formData[`${prefix}_middle_name`]}
          onChange={onChange}
          className="form-control form-control-lg shadow-none"
          placeholder="Middle Name"
        />
      </div>

      <div className="col-md-6 mb-3">
        <label className="form-label fw-bold mb-1 small">Last Name</label>
        <input
          type="text"
          name={`${prefix}_last_name`}
          value={formData[`${prefix}_last_name`]}
          onChange={onChange}
          className="form-control form-control-lg shadow-none"
          placeholder="Last Name"
        />
      </div>
      <div className="col-md-3 mb-3">
        <label className="form-label fw-bold mb-1 small">Extension</label>
        <input
          type="text"
          name={`${prefix}_extension`}
          value={formData[`${prefix}_extension`]}
          onChange={onChange}
          className="form-control form-control-lg shadow-none"
          placeholder="Ex: Sr., Jr."
        />
      </div>

      <div className="col-md-12 mb-3">
        <label className="form-label fw-bold mb-1 small">Home Address</label>
        <input
          type="text"
          name={`${prefix}_home_address`}
          value={formData[`${prefix}_home_address`]}
          onChange={onChange}
          className="form-control form-control-lg shadow-none"
          placeholder="Home Address"
        />
      </div>

      <div className="col-md-6 mb-3">
        <label className="form-label fw-bold mb-1 small">Occupation</label>
        <input
          type="text"
          name={`${prefix}_occupation`}
          value={formData[`${prefix}_occupation`]}
          onChange={onChange}
          className="form-control form-control-lg shadow-none"
          placeholder="Occupation"
        />
      </div>
      <div className="col-md-6 mb-3">
        <label className="form-label fw-bold mb-1 small">Office/Company Name</label>
        <input
          type="text"
          name={`${prefix}_office_company_name`}
          value={formData[`${prefix}_office_company_name`]}
          onChange={onChange}
          className="form-control form-control-lg shadow-none"
          placeholder="Office/Company Name"
        />
      </div>

      <div className="col-md-12 mb-3">
        <label className="form-label fw-bold mb-1 small">Company Address</label>
        <input
          type="text"
          name={`${prefix}_company_address`}
          value={formData[`${prefix}_company_address`]}
          onChange={onChange}
          className="form-control form-control-lg shadow-none"
          placeholder="Company Address"
        />
      </div>

      <div className="col-md-6 mb-3">
        <label className="form-label fw-bold mb-1 small">Contact Number</label>
        <input
          type="text"
          name={`${prefix}_contact_number`}
          value={formData[`${prefix}_contact_number`]}
          onChange={onChange}
          className="form-control form-control-lg shadow-none"
          placeholder="Contact Number"
          pattern="^$|^09[0-9]{9}$"
          title="Contact number must be 11 digits and start with 09."
        />
        <div className="invalid-feedback">Please enter a valid contact number (e.g., 09123456789).</div>
      </div>
      <div className="col-md-6 mb-3">
        <label className="form-label fw-bold mb-1 small">Email Address</label>
        <input
          type="email"
          name={`${prefix}_email_address`}
          value={formData[`${prefix}_email_address`]}
          onChange={onChange}
          className="form-control form-control-lg shadow-none"
          placeholder="Email Address"
          pattern="^$|^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
          title="Please enter a valid email address."
        />
        <div className="invalid-feedback">Please enter a valid email address.</div>
      </div>
    </div>
  </>
);

export default function FamilyInfoPage() {
  const { student_id: studentId } = useParams();
  const isStaffMode = Boolean(studentId);
  const studentEndpoint = isStaffMode ? `/api/v1/students/${studentId}` : null;
  const { saveCurrentUser } = useSessionStore();
  const formRef = useRef(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [initialFormData, setInitialFormData] = useState(INITIAL_FORM);
  const [familyInfoId, setFamilyInfoId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
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
      // no-op: store remains as-is when refresh fails
    }
  }, [isStaffMode, saveCurrentUser]);

  useEffect(() => {
    let isMounted = true;

    const loadFamilyInfo = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await api(studentEndpoint || "/api/v1/family_infos/personal_info");
        let payload = null;

        try {
          payload = await response.json();
        } catch {
          payload = null;
        }

        if (!response.ok) {
          const message = payload?.error || "Failed to load family information.";
          throw new Error(message);
        }

        if (!isMounted) return;

        const nextFormData = toFormData(payload);
        setFamilyInfoId(payload?.family_info?.id || payload?.id || null);
        setFormData(nextFormData);
        setInitialFormData(nextFormData);
        await syncCurrentUser();
      } catch (err) {
        if (!isMounted) return;
        setError(err?.message || "Failed to load family information.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadFamilyInfo();

    return () => {
      isMounted = false;
    };
  }, [studentEndpoint, syncCurrentUser]);

  const hasChanges = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(initialFormData),
    [formData, initialFormData]
  );

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setSaveMessage("");
    setSaveError("");
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

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
        await ShowAlert({
          icon: "error",
          title: "Invalid Input",
          text: "Please fix invalid contact number/email format before saving.",
        });
        return;
      }

      setIsSaving(true);
      setSaveError("");
      setSaveMessage("");

      const familyInfoEndpoint = isStaffMode
        ? (familyInfoId ? `/api/v1/family_infos/${familyInfoId}` : "")
        : "/api/v1/family_infos/personal_info";
      if (!familyInfoEndpoint) {
        throw new Error("No family information record was found for this student.");
      }

      const response = await api(familyInfoEndpoint, {
        method: "PATCH",
        body: JSON.stringify({ family_info: formData }),
      });

      let responseJson = null;
      try {
        responseJson = await response.json();
      } catch {
        responseJson = null;
      }

      if (!response.ok) {
        const backendError =
          (responseJson?.errors instanceof Array && responseJson.errors[0]) ||
          responseJson?.error ||
          "Failed to save changes.";
        throw new Error(backendError);
      }

      const nextFormData = toFormData(responseJson || formData);
      setFamilyInfoId(responseJson?.id || familyInfoId || null);
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
      setSaveError(err?.message || "Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-vh-100 py-4">
      <div className="container" style={{ maxWidth: "760px" }}>
        <div className="d-flex justify-content-between align-items-center">
          <h3 className="text-primary fw-bold m-0">Family Information</h3>
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
              <button
                type="button"
                className="btn btn-info text-white rounded-pill"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
              {saveError && <span className="small text-danger">{saveError}</span>}
              {saveMessage && <span className="small text-success">{saveMessage}</span>}
            </div>
          )}
        </div>
        <hr />

        {isLoading && <p className="small text-muted mb-3">Loading family information...</p>}
        {error && <p className="small text-danger mb-3">{error}</p>}

        <form
          ref={formRef}
          className={isValidated ? "needs-validation was-validated" : "needs-validation"}
          noValidate
        >
          <PersonSection title="Father's Name" prefix="father" formData={formData} onChange={handleInputChange} />
          <PersonSection title="Mother's Maiden Name" prefix="mother" formData={formData} onChange={handleInputChange} />
          <PersonSection title="Guardian's Name" prefix="guardian" formData={formData} onChange={handleInputChange} />
        </form>
      </div>
    </div>
  );
}
