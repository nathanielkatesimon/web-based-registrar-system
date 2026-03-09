"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import ShowAlert from "@/lib/show-alert";
import useSessionStore from "@/store/session-store";
import Cropper from "react-cropper";

const INITIAL_FORM = {
  first_name: "",
  middle_name: "",
  last_name: "",
  extension: "",
  auth_id: "",
  email: "",
  password: "",
};
const EMPLOYEE_ID_REGEX = /^[0-9]{2}-[0-9]{4}-[0-9]{3}$/;

const normalizeEmployeeId = (value) =>
  String(value || "")
    .trim()
    .replace(/[‐‑‒–—−]/g, "-");

const normalizeAvatarUrl = (value) => {
  if (!value) return "";
  if (String(value).startsWith("http")) return value;
  return `${process.env.NEXT_PUBLIC_API_URL || ""}${value}`;
};

export default function StaffProfilePage() {
  const formRef = useRef(null);
  const avatarInputRef = useRef(null);
  const cropperRef = useRef(null);
  const avatarObjectUrlRef = useRef("");
  const { currentUser, saveCurrentUser } = useSessionStore();

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [initialFormData, setInitialFormData] = useState(INITIAL_FORM);
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

  const staffId = currentUser?.id;
  const staffEndpoint = staffId ? `/api/v1/staffs/${staffId}` : "";

  const syncCurrentUser = useCallback(
    (payload) => {
      if (!payload) return;

      saveCurrentUser({
        id: payload?.id,
        auth_id: payload?.auth_id,
        type: payload?.type || "Staff",
        first_name: payload?.first_name || "",
        middle_name: payload?.middle_name || "",
        last_name: payload?.last_name || "",
        extension: payload?.extension || "",
        full_name: payload?.full_name || "",
        avatar_url: payload?.avatar_url || currentUser?.avatar_url || null,
      });
    },
    [saveCurrentUser, currentUser?.avatar_url]
  );

  useEffect(() => {
    let isMounted = true;

    const loadCurrentStaff = async () => {
      if (!staffEndpoint) {
        setIsLoading(false);
        setError("Unable to resolve staff profile.");
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        const response = await api(staffEndpoint);
        let payload = null;

        try {
          payload = await response.json();
        } catch {
          payload = null;
        }

        if (!response.ok) {
          const message = payload?.error || "Failed to load staff profile.";
          throw new Error(message);
        }

        if (!isMounted) return;

        const nextFormData = {
          first_name: payload?.first_name || "",
          middle_name: payload?.middle_name || "",
          last_name: payload?.last_name || "",
          extension: payload?.extension || "",
          auth_id: normalizeEmployeeId(payload?.auth_id),
          email: payload?.email || "",
          password: "",
        };

        setFormData(nextFormData);
        setInitialFormData(nextFormData);
        setAvatarUrl(normalizeAvatarUrl(payload?.avatar_url || currentUser?.avatar_url));
        syncCurrentUser(payload);
      } catch (err) {
        if (!isMounted) return;
        setError(err?.message || "Failed to load staff profile.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadCurrentStaff();

    return () => {
      isMounted = false;
      if (avatarObjectUrlRef.current) {
        URL.revokeObjectURL(avatarObjectUrlRef.current);
        avatarObjectUrlRef.current = "";
      }
    };
  }, [staffEndpoint, syncCurrentUser, currentUser?.avatar_url]);

  const hasChanges = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(initialFormData),
    [formData, initialFormData]
  );

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    const normalizedValue = name === "auth_id" ? normalizeEmployeeId(value) : value;
    setSaveMessage("");
    setSaveError("");
    setFormData((prev) => ({ ...prev, [name]: normalizedValue }));
  };

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
    formDataPayload.append("staff[avatar]", blob, "avatar.jpg");

    const response = await api(staffEndpoint, {
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

    const nextAvatar = normalizeAvatarUrl(responseJson?.avatar_url);
    setAvatarUrl(nextAvatar);
    syncCurrentUser({ ...responseJson, avatar_url: responseJson?.avatar_url || currentUser?.avatar_url });
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
    if (!staffEndpoint) return;

    try {
      const normalizedAuthId = normalizeEmployeeId(formData.auth_id);
      if (!EMPLOYEE_ID_REGEX.test(normalizedAuthId)) {
        setIsValidated(true);
        setSaveError("");
        setSaveMessage("");
        await ShowAlert({
          icon: "error",
          title: "Invalid Employee ID",
          text: "Employee ID must follow the format 00-0000-000.",
        });
        return;
      }

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
        staff: {
          first_name: formData.first_name,
          middle_name: formData.middle_name,
          last_name: formData.last_name,
          extension: formData.extension,
          auth_id: normalizedAuthId,
          email: formData.email,
          ...(formData.password ? { password: formData.password, password_confirmation: formData.password } : {}),
        },
      };

      const response = await api(staffEndpoint, {
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

      const nextFormData = { ...formData, password: "" };
      setFormData(nextFormData);
      setInitialFormData(nextFormData);
      setSaveMessage("Changes saved.");
      syncCurrentUser(responseJson);

      await ShowAlert({
        icon: "success",
        title: "Successfully Updated",
        text: "successfully updated",
      });
    } catch (err) {
      setSaveError(err?.message || "Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container-xxl flex-grow-1 py-4">
      <div className="card border-0 shadow-none bg-transparent rounded-3">
        <div className="card-body p-4 p-md-5">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="m-0 fw-semibold">Account Information</h4>
            {hasChanges && (
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-pill px-4"
                  onClick={handleDiscard}
                  disabled={isSaving}
                >
                  Discard
                </button>
                <button
                  type="button"
                  className="btn btn-info rounded-pill px-4"
                  onClick={handleSave}
                  disabled={isSaving || !hasChanges}
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            )}
          </div>

          <hr className="my-4" />

          <div className="mb-4">
            <button
              type="button"
              className="avatar-edit-trigger"
              onClick={() => avatarInputRef.current?.click()}
              aria-label="Change avatar"
              disabled={isUploadingAvatar || isSaving}
            >
              <img
                src={avatarUrl || "/avatar_placeholder.webp"}
                alt="Staff avatar"
                className="rounded-circle object-fit-cover"
                style={{ width: "92px", height: "92px" }}
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
              disabled={isUploadingAvatar || isSaving}
            />
          </div>

          {isLoading && <p className="small text-muted mb-3">Loading account information...</p>}
          {error && <p className="small text-danger mb-3">{error}</p>}
          {saveError && <p className="small text-danger mb-3">{saveError}</p>}
          {saveMessage && <p className="small text-success mb-3">{saveMessage}</p>}

          <form
            ref={formRef}
            className={isValidated ? "needs-validation was-validated" : "needs-validation"}
            noValidate
          >
            <div className="row g-3">
              <div className="col-md-6 mb-2">
                <label className="form-label fw-semibold mb-1">
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
                  disabled={isSaving}
                />
              </div>

              <div className="col-md-6 mb-2">
                <label className="form-label fw-semibold mb-1">Middle Name</label>
                <input
                  type="text"
                  name="middle_name"
                  value={formData.middle_name}
                  onChange={handleInputChange}
                  className="form-control form-control-lg shadow-none"
                  placeholder="Middle Name"
                  disabled={isSaving}
                />
              </div>

              <div className="col-md-6 mb-2">
                <label className="form-label fw-semibold mb-1">
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
                  disabled={isSaving}
                />
              </div>

              <div className="col-md-6 mb-2">
                <label className="form-label fw-semibold mb-1">Extension</label>
                <input
                  type="text"
                  name="extension"
                  value={formData.extension}
                  onChange={handleInputChange}
                  className="form-control form-control-lg shadow-none"
                  placeholder="Ex: Sr., Jr."
                  disabled={isSaving}
                />
              </div>

              <div className="col-md-6 mb-2">
                <label className="form-label fw-semibold mb-1">
                  Employee ID<span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="auth_id"
                  value={formData.auth_id}
                  onChange={handleInputChange}
                  className="form-control form-control-lg shadow-none"
                  placeholder="Employee ID"
                  required
                  pattern="[0-9]{2}-[0-9]{4}-[0-9]{3}"
                  title="Employee ID must follow the format 00-0000-000"
                  disabled={isSaving}
                />
              </div>

              <div className="col-md-6 mb-2">
                <label className="form-label fw-semibold mb-1">
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
                  disabled={isSaving}
                />
              </div>

              <div className="col-md-6 mb-2">
                <label className="form-label fw-semibold mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="form-control form-control-lg shadow-none"
                  placeholder="Password"
                  minLength={6}
                  disabled={isSaving}
                />
              </div>
            </div>
          </form>
        </div>
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
          width: 92px;
          height: 92px;
        }
        .avatar-edit-trigger:disabled {
          cursor: default;
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
