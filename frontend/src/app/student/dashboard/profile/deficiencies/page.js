"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

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
  const [data, setData] = useState(INITIAL_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDeficiencies = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await api("/api/v1/deficiencies/personal_info");
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

        setData({
          ...INITIAL_DATA,
          ...(payload || {}),
        });
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
  }, []);

  return (
    <div className="min-vh-100 py-4">
      <div className="container" style={{ maxWidth: "900px" }}>
        <h3 className="fw-bold m-0">Deficiencies</h3>
        <hr />

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

        {isLoading && <p className="text-muted">Loading deficiencies...</p>}
        {error && <p className="text-danger">{error}</p>}

        {!isLoading && !error && (
          <div className="d-flex flex-column gap-3">
            {FIELDS.map((field) => {
              const status = data[field.key] || STATUS.not_included;
              const isLacking = status === STATUS.lacking;

              return (
                <div key={field.key} className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <StatusIcon status={status} />
                    <span>{field.label}</span>
                  </div>
                  <div style={{ minWidth: "120px", textAlign: "right" }}>
                    {isLacking ? (
                      <span style={{ color: "#ef1f23", fontStyle: "italic" }}>please comply</span>
                    ) : null}
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
