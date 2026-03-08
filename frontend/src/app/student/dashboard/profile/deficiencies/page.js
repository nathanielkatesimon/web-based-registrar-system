"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import ShowAlert from "@/lib/show-alert";

const FIELDS = [
  { key: "enrollment_form", label: "Enrollment Form" },
  { key: "form_138", label: "Form 138" },
  { key: "form_137", label: "Form 137" },
  { key: "certificate_of_good_moral_character", label: "Certificate of Good Moral Character" },
  { key: "id_pictures", label: "ID Pictures" },
  { key: "birth_certificate", label: "NSO/PSA Birth Certificate" },
  { key: "senior_high_school_diploma", label: "Senior High School Diploma" },
  { key: "honorable_dismissal", label: "Honorable Dismissal" },
  { key: "transcript_of_records", label: "Transcript of Records" },
];

const STATUS = {
  complied: "complied",
  lacking: "lacking",
  not_included: "not_included",
};

const INITIAL_DATA = FIELDS.reduce((acc, field) => {
  acc[field.key] = STATUS.not_included;
  return acc;
}, {});

function StatusIcon({ status }) {
  if (status === STATUS.complied) {
    return (
      <span
        className="d-inline-flex align-items-center justify-content-center text-white"
        style={{ width: "16px", height: "16px", borderRadius: "4px", backgroundColor: "#1a2aa6", fontSize: "12px" }}
      >
        ✓
      </span>
    );
  }

  if (status === STATUS.lacking) {
    return (
      <span
        className="d-inline-flex align-items-center justify-content-center text-white fw-bold"
        style={{ width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "#ef1f23", fontSize: "12px" }}
      >
        !
      </span>
    );
  }

  return (
    <span
      className="d-inline-block"
      style={{ width: "16px", height: "16px", borderRadius: "4px", backgroundColor: "#bfc4cb", border: "1px solid #adb5bd" }}
    />
  );
}

export default function DeficienciesPage() {
  const { student_id: studentId } = useParams();
  const isStaffMode = Boolean(studentId);
  const studentEndpoint = isStaffMode ? `/api/v1/students/${studentId}` : null;

  const [data, setData] = useState(INITIAL_DATA);
  const [initialData, setInitialData] = useState(INITIAL_DATA);
  const [deficiencyId, setDeficiencyId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDeficiencies = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await api(studentEndpoint || "/api/v1/deficiencies/personal_info");
        let payload = null;

        try {
          payload = await response.json();
        } catch {
          payload = null;
        }

        if (!response.ok) {
          const message = payload?.error || "Failed to load deficiencies.";
          throw new Error(message);
        }

        if (!isMounted) return;

        const source = isStaffMode ? payload?.deficiency || {} : payload || {};
        const nextData = {
          ...INITIAL_DATA,
          ...source,
        };

        setDeficiencyId(source?.id || null);
        setData(nextData);
        setInitialData(nextData);
      } catch (err) {
        if (!isMounted) return;
        setError(err?.message || "Failed to load deficiencies.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadDeficiencies();

    return () => {
      isMounted = false;
    };
  }, [isStaffMode, studentEndpoint]);

  const hasChanges = useMemo(
    () => JSON.stringify(data) !== JSON.stringify(initialData),
    [data, initialData]
  );

  const handleStatusToggle = (key, targetStatus) => {
    setSaveError("");
    setSaveMessage("");
    setData((prev) => {
      const currentStatus = prev[key] || STATUS.not_included;
      return {
        ...prev,
        [key]: currentStatus === targetStatus ? STATUS.not_included : targetStatus,
      };
    });
  };

  const handleDiscard = () => {
    setSaveError("");
    setSaveMessage("");
    setData(initialData);
  };

  const handleSave = async () => {
    try {
      if (!isStaffMode) return;
      if (!deficiencyId) {
        throw new Error("No deficiency record found for this student.");
      }

      setIsSaving(true);
      setSaveError("");
      setSaveMessage("");

      const payload = FIELDS.reduce((acc, field) => {
        acc[field.key] = data[field.key] || STATUS.not_included;
        return acc;
      }, {});

      const response = await api(`/api/v1/deficiencies/${deficiencyId}`, {
        method: "PATCH",
        body: JSON.stringify({ deficiency: payload }),
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
          "Failed to save deficiencies.";
        throw new Error(backendError);
      }

      const nextData = {
        ...INITIAL_DATA,
        ...(responseJson || payload),
      };
      setData(nextData);
      setInitialData(nextData);
      setSaveMessage("Changes saved.");
      await ShowAlert({
        icon: "success",
        title: "Successfully Updated",
        text: "sucessfully updated",
      });
    } catch (err) {
      setSaveError(err?.message || "Failed to save deficiencies.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-vh-100 py-4">
      <div className="container" style={{ maxWidth: "900px" }}>
        <div className="d-flex justify-content-between align-items-center">
          <h3 className="fw-bold m-0">Deficiencies</h3>
          {isStaffMode && !isLoading && hasChanges ? (
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
                className="btn btn-info rounded-pill"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Update"}
              </button>
            </div>
          ) : null}
        </div>
        <hr />

        {!isStaffMode ? (
          <>
            <h5 className="fw-bold mt-4 mb-3">Legend</h5>
            <div className="d-flex flex-wrap align-items-center gap-4 mb-5">
              <div className="d-flex align-items-center gap-2">
                <StatusIcon status={STATUS.complied} />
                <span>Complied</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <StatusIcon status={STATUS.lacking} />
                <span>Lacking</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <StatusIcon status={STATUS.not_included} />
                <span>Not Included</span>
              </div>
            </div>
          </>
        ) : null}

        {isLoading && <p className="text-muted">Loading deficiencies...</p>}
        {error && <p className="text-danger">{error}</p>}
        {saveError && <p className="small text-danger mb-3">{saveError}</p>}
        {saveMessage && <p className="small text-success mb-3">{saveMessage}</p>}

        {!isLoading && !error && (
          <div className="d-flex flex-column gap-3">
            {FIELDS.map((field) => {
              const status = data[field.key] || STATUS.not_included;
              const isLacking = status === STATUS.lacking;

              return (
                <div key={field.key} className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
                  <div className="d-flex align-items-center gap-2">
                    {!isStaffMode ? <StatusIcon status={status} /> : null}
                    <span>{field.label}</span>
                  </div>

                  <div className="d-flex align-items-center gap-2" style={{ minWidth: "220px", justifyContent: "flex-end" }}>
                    {isStaffMode ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-sm rounded-pill fw-semibold"
                          style={{
                            minWidth: "100px",
                            borderWidth: "2px",
                            borderColor: "#49a40f",
                            color: status === STATUS.complied ? "#fff" : "#49a40f",
                            backgroundColor: status === STATUS.complied ? "#49a40f" : "transparent",
                          }}
                          onClick={() => handleStatusToggle(field.key, STATUS.complied)}
                          disabled={isSaving}
                        >
                          Complied
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm rounded-pill fw-semibold"
                          style={{
                            minWidth: "100px",
                            borderWidth: "2px",
                            borderColor: "#f0121c",
                            color: status === STATUS.lacking ? "#fff" : "#f0121c",
                            backgroundColor: status === STATUS.lacking ? "#f0121c" : "transparent",
                          }}
                          onClick={() => handleStatusToggle(field.key, STATUS.lacking)}
                          disabled={isSaving}
                        >
                          Lacking
                        </button>
                      </>
                    ) : (
                      <div style={{ minWidth: "120px", textAlign: "right" }}>
                        {isLacking ? (
                          <span style={{ color: "#ef1f23", fontStyle: "italic" }}>please comply</span>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
