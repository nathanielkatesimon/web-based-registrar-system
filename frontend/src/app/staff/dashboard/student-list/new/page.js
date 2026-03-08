"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import ShowAlert from "@/lib/show-alert";

const INITIAL_FORM = {
  auth_id: "",
  email: "",
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

export default function NewStudentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formRef = useRef(null);

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [saveError, setSaveError] = useState("");

  const category = searchParams.get("category") || "";

  const backHref = useMemo(
    () => `/staff/dashboard/student-list${category ? `?category=${category}` : ""}`,
    [category]
  );

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setSaveError("");
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const form = formRef.current;
      if (form && !form.checkValidity()) {
        setIsValidated(true);
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

      const payload = {
        student: {
          auth_id: formData.auth_id.trim(),
          email: formData.email.trim(),
          first_name: formData.first_name.trim(),
          middle_name: formData.middle_name.trim(),
          last_name: formData.last_name.trim(),
          extension: formData.extension.trim(),
          student_profile_attributes: {
            civil_status: formData.civil_status || null,
            contact_number: formData.contact_number.trim(),
            sex: formData.sex || null,
            birthday: formData.birthday || null,
            place_of_birth: formData.place_of_birth.trim(),
            citizenship: formData.citizenship.trim(),
            religion: formData.religion.trim(),
            house_number: formData.house_number.trim(),
            street_name: formData.street_name.trim(),
            barangay_name: formData.barangay_name.trim(),
            city_municipality: formData.city_municipality.trim(),
            province: formData.province.trim(),
          },
        },
      };

      const response = await api("/api/v1/students", {
        method: "POST",
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
          "Failed to create student.";
        throw new Error(backendError);
      }

      await ShowAlert({
        icon: "success",
        title: "Student Created",
        text: "Student record has been created.",
      });

      const createdId = responseJson?.id;
      if (!createdId) {
        router.push(backHref);
        return;
      }

      router.push(
        `/staff/dashboard/student-list/student-profile/${createdId}/personal_info${
          category ? `?category=${category}` : ""
        }`
      );
    } catch (err) {
      setSaveError(err?.message || "Failed to create student.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="px-12 flex-grow-1 py-4 request-queue-page student-list-program-page">
      <div className="px-12 rounded-3">
        <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
          <div className="d-flex align-items-center gap-2">
            <Link href={backHref} className="text-decoration-none text-dark p-0 m-0">
              <i className="bx bx-chevron-left fs-3 pt-1"></i>
            </Link>
            <h5 className="fw-semibold m-0 p-0 text-dark">Add New Student</h5>
          </div>

          <button
            type="button"
            className="btn btn-info rounded-pill px-4"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>

        {saveError && <p className="small text-danger mb-3">{saveError}</p>}

        <form
          ref={formRef}
          className={isValidated ? "needs-validation was-validated" : "needs-validation"}
          noValidate
        >
          <div className="row g-3">
            <div className="col-md-6 mb-3">
              <label className="form-label fw-bold mb-1 small">
                USN<span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="auth_id"
                value={formData.auth_id}
                onChange={handleInputChange}
                className="form-control form-control-lg shadow-none"
                placeholder="USN"
                pattern="[0-9]{11,13}"
                required
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label fw-bold mb-1 small">
                Email Address<span className="text-danger">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-control form-control-lg shadow-none"
                placeholder="Email Address"
                required
              />
            </div>

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

            <div className="col-md-3 mb-3">
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

            <div className="col-md-12 mb-3">
              <label className="form-label fw-bold mb-1 small">Civil Status</label>
              <div className="d-flex gap-3 flex-wrap">
                {["single", "married", "widower", "separated"].map((option) => (
                  <div key={option} className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="civil_status"
                      id={`civil_status_${option}`}
                      value={option}
                      checked={formData.civil_status === option}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label text-capitalize" htmlFor={`civil_status_${option}`}>
                      {option}
                    </label>
                  </div>
                ))}
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
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label fw-bold mb-1 small">Sex</label>
              <div className="d-flex gap-3">
                {["male", "female"].map((option) => (
                  <div key={option} className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="sex"
                      id={`sex_${option}`}
                      value={option}
                      checked={formData.sex === option}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label text-capitalize" htmlFor={`sex_${option}`}>
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label fw-bold mb-1 small">Birthday</label>
              <input
                type="date"
                name="birthday"
                value={formData.birthday}
                onChange={handleInputChange}
                className="form-control form-control-lg shadow-none"
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
              <label className="form-label fw-bold mb-1 small">Citizenship</label>
              <input
                type="text"
                name="citizenship"
                value={formData.citizenship}
                onChange={handleInputChange}
                className="form-control form-control-lg shadow-none"
                placeholder="Citizenship"
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

            <h6 className="fw-bold mt-2">Home Address</h6>

            <div className="col-md-3 mb-3">
              <label className="form-label fw-bold mb-1 small">House Number</label>
              <input
                type="text"
                name="house_number"
                value={formData.house_number}
                onChange={handleInputChange}
                className="form-control form-control-lg shadow-none"
                placeholder="House Number"
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

            <div className="col-md-12 mb-3">
              <label className="form-label fw-bold mb-1 small">Barangay Name</label>
              <input
                type="text"
                name="barangay_name"
                value={formData.barangay_name}
                onChange={handleInputChange}
                className="form-control form-control-lg shadow-none"
                placeholder="Barangay Name"
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label fw-bold mb-1 small">City/Municipality</label>
              <input
                type="text"
                name="city_municipality"
                value={formData.city_municipality}
                onChange={handleInputChange}
                className="form-control form-control-lg shadow-none"
                placeholder="City/Municipality"
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label fw-bold mb-1 small">Province</label>
              <input
                type="text"
                name="province"
                value={formData.province}
                onChange={handleInputChange}
                className="form-control form-control-lg shadow-none"
                placeholder="Province"
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
