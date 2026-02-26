"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import ShowAlert from "@/lib/show-alert";

const INITIAL_FORM = {
  first_name: "",
  middle_name: "",
  last_name: "",
  extension: "",
  civil_status: "",
  contact_number: "",
  sex: "",
  birthday: "",
  place_of_birth: "",
  citizenship: "",
  religion: "",
  house_number: "",
  street_name: "",
  barangay_name: "",
  city_municipality: "",
  province: "",
};

const toInputDate = (value) => {
  if (!value) return "";
  return String(value).split("T")[0];
};

export default function PersonalInfoPage() {
  const formRef = useRef(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [initialFormData, setInitialFormData] = useState(INITIAL_FORM);
  const [profileId, setProfileId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

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
          const message = payload?.error || "Failed to load student profile.";
          throw new Error(message);
        }

        if (!isMounted) return;

        const profile = payload?.student_profile || {};
        const nextFormData = {
          first_name: payload?.first_name || "",
          middle_name: payload?.middle_name || "",
          last_name: payload?.last_name || "",
          extension: payload?.extension || "",
          civil_status: profile?.civil_status || "",
          contact_number: profile?.contact_number || "",
          sex: profile?.sex || "",
          birthday: toInputDate(profile?.birthday),
          place_of_birth: profile?.place_of_birth || "",
          citizenship: profile?.citizenship || "",
          religion: profile?.religion || "",
          house_number: profile?.house_number || "",
          street_name: profile?.street_name || "",
          barangay_name: profile?.barangay_name || "",
          city_municipality: profile?.city_municipality || "",
          province: profile?.province || "",
        };
        setProfileId(profile?.id || null);
        setFormData(nextFormData);
        setInitialFormData(nextFormData);
      } catch (err) {
        if (!isMounted) return;
        setError(err?.message || "Failed to load student profile.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadCurrentStudent();

    return () => {
      isMounted = false;
    };
  }, []);

  const initials = useMemo(() => {
    const first = formData.first_name?.trim()?.[0] || "";
    const last = formData.last_name?.trim()?.[0] || "";
    const value = `${first}${last}`.toUpperCase();
    return value || "ST";
  }, [formData.first_name, formData.last_name]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setSaveMessage("");
    setSaveError("");
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const hasChanges = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(initialFormData),
    [formData, initialFormData]
  );

  const handleSave = async () => {
    try {
      const form = formRef.current;
      if (form && !form.checkValidity()) {
        setIsValidated(true);
        setSaveError("");
        setSaveMessage("");
        await ShowAlert({
          icon: "error",
          title: "Invalid Form",
          text: "Please complete required fields with valid formats.",
        });
        return;
      }

      setIsValidated(false);
      setIsSaving(true);
      setSaveError("");
      setSaveMessage("");

      const payload = {
        student: {
          first_name: formData.first_name,
          middle_name: formData.middle_name,
          last_name: formData.last_name,
          extension: formData.extension,
          student_profile_attributes: {
            ...(profileId ? { id: profileId } : {}),
            civil_status: formData.civil_status,
            contact_number: formData.contact_number,
            sex: formData.sex,
            birthday: formData.birthday || null,
            place_of_birth: formData.place_of_birth,
            citizenship: formData.citizenship,
            religion: formData.religion,
            house_number: formData.house_number,
            street_name: formData.street_name,
            barangay_name: formData.barangay_name,
            city_municipality: formData.city_municipality,
            province: formData.province,
          },
        },
      };

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
        const backendError =
          (responseJson?.errors instanceof Array && responseJson.errors[0]) ||
          responseJson?.error ||
          "Failed to save changes.";
        throw new Error(backendError);
      }

      setInitialFormData(formData);
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
          <h3 className="text-primary fw-bold m-0">Personal Information</h3>
          {!isLoading && hasChanges && (
            <div className="mb-3 d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-info text-white"
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
        <hr/>
        <div className="mb-3">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-semibold"
            style={{ width: "72px", height: "72px", backgroundColor: "#7b8ba8" }}
          >
            {initials}
          </div>
        </div>

        {isLoading && <p className="small text-muted mb-3">Loading personal information...</p>}
        {error && <p className="small text-danger mb-3">{error}</p>}
        

        <form
          ref={formRef}
          className={isValidated ? "needs-validation was-validated" : "needs-validation"}
          noValidate
        >
          <div className="row g-3">
            <div className="col-md-6 mb-3">
              <label className="form-label fw-bold mb-1 small">
                First Name<span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                className="form-control form-control-lg shadow-none"
                placeholder="First Name"
                required
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label fw-bold mb-1 small">Middle Name</label>
              <input
                type="text"
                name="middle_name"
                value={formData.middle_name}
                onChange={handleInputChange}
                className="form-control form-control-lg shadow-none"
                placeholder="Middle Name"
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label fw-bold mb-1 small">
                Last Name<span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                className="form-control form-control-lg shadow-none"
                placeholder="Last Name"
                required
              />
            </div>
            <div className="col-md-3">
              <label className="form-label fw-bold mb-1 small">Extension</label>
              <input
                type="text"
                name="extension"
                value={formData.extension}
                onChange={handleInputChange}
                className="form-control form-control-lg shadow-none"
                placeholder="Ex: Sr., Jr."
              />
            </div>

            <div className="col-md-12">
              <label className="form-label fw-bold mb-1 small d-block">
                Civil Status<span className="text-danger">*</span>
              </label>
              <div className="d-flex flex-wrap gap-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="civil_status"
                    id="single"
                    value="single"
                    checked={formData.civil_status === "single"}
                    onChange={handleInputChange}
                    required
                  />
                  <label className="form-check-label" htmlFor="single">
                    Single
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="civil_status"
                    id="married"
                    value="married"
                    checked={formData.civil_status === "married"}
                    onChange={handleInputChange}
                  />
                  <label className="form-check-label" htmlFor="married">
                    Married
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="civil_status"
                    id="widower"
                    value="widower"
                    checked={formData.civil_status === "widower"}
                    onChange={handleInputChange}
                  />
                  <label className="form-check-label" htmlFor="widower">
                    Widower
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="civil_status"
                    id="separated"
                    value="separated"
                    checked={formData.civil_status === "separated"}
                    onChange={handleInputChange}
                  />
                  <label className="form-check-label" htmlFor="separated">
                    Separated
                  </label>
                </div>
              </div>
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label fw-bold mb-1 small">
                Contact Number<span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="contact_number"
                value={formData.contact_number}
                onChange={handleInputChange}
                className="form-control form-control-lg shadow-none"
                placeholder="Contact Number"
                required
                pattern="^09[0-9]{9}$"
                title="Contact number must be 11 digits and start with 09."
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label fw-bold mb-1 small d-block">
                Sex<span className="text-danger">*</span>
              </label>
              <div className="d-flex gap-3 pt-1">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="sex"
                    id="male"
                    value="male"
                    checked={formData.sex === "male"}
                    onChange={handleInputChange}
                    required
                  />
                  <label className="form-check-label" htmlFor="male">
                    MALE
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="sex"
                    id="female"
                    value="female"
                    checked={formData.sex === "female"}
                    onChange={handleInputChange}
                  />
                  <label className="form-check-label" htmlFor="female">
                    FEMALE
                  </label>
                </div>
              </div>
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label fw-bold mb-1 small">
                Birthday<span className="text-danger">*</span>
              </label>
              <input
                type="date"
                name="birthday"
                value={formData.birthday}
                onChange={handleInputChange}
                className="form-control form-control-lg shadow-none"
                required
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label fw-bold mb-1 small">Place of Birth</label>
              <input
                type="text"
                name="place_of_birth"
                value={formData.place_of_birth}
                onChange={handleInputChange}
                className="form-control form-control-lg shadow-none"
                placeholder="Place of Birth"
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label fw-bold mb-1 small">
                Citizenship<span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="citizenship"
                value={formData.citizenship}
                onChange={handleInputChange}
                className="form-control form-control-lg shadow-none"
                placeholder="Citizenship"
                required
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label fw-bold mb-1 small">Religion</label>
              <input
                type="text"
                name="religion"
                value={formData.religion}
                onChange={handleInputChange}
                className="form-control form-control-lg shadow-none"
                placeholder="Religion"
              />
            </div>
          </div>

          <h6 className="fw-bold mt-5 mb-3">Home Address</h6>

          <div className="row g-3">
            <div className="col-md-3 mb-3">
              <label className="form-label fw-bold mb-1 small">House Number</label>
              <input
                type="text"
                name="house_number"
                value={formData.house_number}
                onChange={handleInputChange}
                className="form-control form-control-lg shadow-none"
                placeholder="House Number"
                pattern="^[A-Za-z0-9][A-Za-z0-9 #.,/-]*$"
                title="House number can contain letters, numbers, spaces, # . , / and -."
              />
            </div>
            <div className="col-md-9 mb-3">
              <label className="form-label fw-bold mb-1 small">Street Name or Block</label>
              <input
                type="text"
                name="street_name"
                value={formData.street_name}
                onChange={handleInputChange}
                className="form-control form-control-lg shadow-none"
                placeholder="Street Name or Block"
              />
            </div>

            <div className="col-md-12 mb-5">
              <label className="form-label fw-bold mb-1 small">
                Barangay Name<span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="barangay_name"
                value={formData.barangay_name}
                onChange={handleInputChange}
                className="form-control form-control-lg shadow-none"
                placeholder="Barangay Name"
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold mb-1 small">
                City/Municipality<span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="city_municipality"
                value={formData.city_municipality}
                onChange={handleInputChange}
                className="form-control form-control-lg shadow-none"
                placeholder="City/Municipality"
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold mb-1 small">
                Province<span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="province"
                value={formData.province}
                onChange={handleInputChange}
                className="form-control form-control-lg shadow-none"
                placeholder="Province"
                required
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
