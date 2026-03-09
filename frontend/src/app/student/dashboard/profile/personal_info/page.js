"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import ShowAlert from "@/lib/show-alert";
import useSessionStore from "@/store/session-store";
import Cropper from "react-cropper";

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

const normalizeAvatarUrl = (value) => {
  if (!value) return "";
  if (String(value).startsWith("http")) return value;
  return `${process.env.NEXT_PUBLIC_API_URL || ""}${value}`;
};

export default function PersonalInfoPage() {
  const { student_id: studentId } = useParams();
  const isStaffMode = Boolean(studentId);
  const studentEndpoint = isStaffMode ? `/api/v1/students/${studentId}` : "/api/v1/students/personal_info";

  const formRef = useRef(null);
  const avatarInputRef = useRef(null);
  const cropperRef = useRef(null);
  const avatarObjectUrlRef = useRef("");
  const { saveCurrentUser } = useSessionStore();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [initialFormData, setInitialFormData] = useState(INITIAL_FORM);
  const [profileId, setProfileId] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarCropSource, setAvatarCropSource] = useState("");
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const syncCurrentUser = useCallback((payload) => {
    if (!payload) return;

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
  }, [saveCurrentUser]);

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
          const message = payload?.error || "Failed to load student profile.";
          throw new Error(message);
        }

        if (!isMounted) return;

        const profile = payload?.student_profile || {};
        const nextAvatarUrl = normalizeAvatarUrl(payload?.avatar_url);
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
        if (!isStaffMode) syncCurrentUser(payload);
        setProfileId(profile?.id || null);
        setAvatarUrl(nextAvatarUrl);
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
      if (avatarObjectUrlRef.current) {
        URL.revokeObjectURL(avatarObjectUrlRef.current);
        avatarObjectUrlRef.current = "";
      }
    };
  }, [isStaffMode, studentEndpoint, syncCurrentUser]);

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

  const handleDiscard = () => {
    setFormData(initialFormData);
    setIsValidated(false);
    setSaveError("");
    setSaveMessage("");
  };

  const closeAvatarCropper = () => {
    if (avatarObjectUrlRef.current) {
      URL.revokeObjectURL(avatarObjectUrlRef.current);
      avatarObjectUrlRef.current = "";
    }
    setAvatarCropSource("");
    setIsCropperOpen(false);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  };

  const handleAvatarFileChange = async (event) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!file.type?.startsWith("image/")) {
        await ShowAlert({
          icon: "error",
          title: "Invalid File",
          text: "Please select an image file.",
        });
        return;
      }

      if (avatarObjectUrlRef.current) {
        URL.revokeObjectURL(avatarObjectUrlRef.current);
      }

      const objectUrl = URL.createObjectURL(file);
      avatarObjectUrlRef.current = objectUrl;
      setAvatarCropSource(objectUrl);
      setIsCropperOpen(true);
      setSaveMessage("");
      setSaveError("");
    } catch (err) {
      setSaveError(err?.message || "Failed to read selected image.");
    }
  };

  const uploadCroppedAvatar = async (blob) => {
    const formDataPayload = new FormData();
    formDataPayload.append("student[avatar]", blob, "avatar.jpg");

    const response = await api(studentEndpoint, {
      method: "PATCH",
      body: formDataPayload,
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
        "Failed to update avatar.";
      throw new Error(backendError);
    }

    if (!isStaffMode) syncCurrentUser(responseJson);
    setAvatarUrl(normalizeAvatarUrl(responseJson?.avatar_url));
    setSaveMessage("Avatar updated.");
  };

  const handleApplyAvatarCrop = async () => {
    try {
      const cropper = cropperRef.current?.cropper;
      if (!cropper) {
        throw new Error("Cropper is not ready.");
      }

      const canvas = cropper.getCroppedCanvas({
        width: 512,
        height: 512,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: "high",
      });

      if (!canvas) {
        throw new Error("Could not crop image.");
      }

      setIsUploadingAvatar(true);

      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", 0.9);
      });

      if (!blob) {
        throw new Error("Could not process cropped image.");
      }

      await uploadCroppedAvatar(blob);
      closeAvatarCropper();
    } catch (err) {
      setSaveError(err?.message || "Failed to update avatar.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

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
        const backendError =
          (responseJson?.errors instanceof Array && responseJson.errors[0]) ||
          responseJson?.error ||
          "Failed to save changes.";
        throw new Error(backendError);
      }

      if (responseJson) {
        if (!isStaffMode) syncCurrentUser(responseJson);
        setAvatarUrl(
          normalizeAvatarUrl(responseJson?.avatar_url)
        );
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
        <hr/>
        <div className="mb-3">
          <button
            type="button"
            className="avatar-edit-trigger"
            onClick={() => avatarInputRef.current?.click()}
            aria-label="Change avatar"
            disabled={isUploadingAvatar}
          >
            <img
              src={avatarUrl || "/avatar_placeholder.webp"}
              alt="Student avatar"
              className="rounded-circle object-fit-cover"
              style={{ width: "72px", height: "72px" }}
            />
            <span className="avatar-edit-overlay">
              <i className="bx bx-camera fs-4"></i>
            </span>
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="d-none"
            onChange={handleAvatarFileChange}
          />
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

      {isCropperOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ backgroundColor: "rgba(17, 24, 39, 0.72)", zIndex: 1080 }}
        >
          <div className="bg-white rounded-3 shadow-lg w-100" style={{ maxWidth: "560px" }}>
            <div className="p-3 border-bottom">
              <h5 className="m-0 fw-semibold">Crop Avatar</h5>
            </div>
            <div className="p-3">
              <div style={{ height: "360px" }}>
                <Cropper
                  ref={cropperRef}
                  src={avatarCropSource}
                  style={{ height: "100%", width: "100%" }}
                  viewMode={1}
                  aspectRatio={1}
                  autoCropArea={1}
                  background={false}
                  responsive
                  guides={false}
                  dragMode="move"
                  checkOrientation={false}
                />
              </div>
            </div>
            <div className="p-3 border-top d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={closeAvatarCropper}
                disabled={isUploadingAvatar}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary text-white"
                onClick={handleApplyAvatarCrop}
                disabled={isUploadingAvatar}
              >
                {isUploadingAvatar ? "Uploading..." : "Apply"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .avatar-edit-trigger {
          position: relative;
          border: 0;
          background: transparent;
          border-radius: 50%;
          padding: 0;
          cursor: pointer;
          overflow: hidden;
          width: 72px;
          height: 72px;
        }
        .avatar-edit-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          background: rgba(2, 132, 199, 0.55);
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        .avatar-edit-trigger:hover .avatar-edit-overlay,
        .avatar-edit-trigger:focus-visible .avatar-edit-overlay {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
