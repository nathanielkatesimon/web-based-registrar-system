"use client";

import React from "react";
import useStudentDocumentRequestStore from "@/store/student/requests/document_request_store";

const TIMELINE_STEPS = [
  { key: 1, label: "Submit Form" },
  { key: 2, label: "Verification" },
  { key: 3, label: "Delivery Method" },
  { key: 4, label: "Payment" },
];

function getActiveStep(step) {
  if (step <= 1.5) return 1;
  if (step < 3) return 2;
  if (step < 4) return 3;
  return 4;
}

export default function StudentRequestLayout({ children }) {
  const step = useStudentDocumentRequestStore((state) => state.step);
  const activeStep = getActiveStep(step);

  return (
    <div className="pb-8">
      <div className="px-5 pt-8 pb-4">
        <div className="mx-auto" style={{ maxWidth: 980 }}>
          <div className="d-flex align-items-start justify-content-between">
            {step < 5 && TIMELINE_STEPS.map((timelineStep, index) => {
              const isActive = timelineStep.key === activeStep;
              const isCompleted = timelineStep.key < activeStep;
              const isInactive = !isActive && !isCompleted;
              const circleColor = isInactive ? "#A0A0A0" : "#03045E";
              const textColor = isInactive ? "#7A7A7A" : "#03045E";
              const connectorColor = activeStep > timelineStep.key ? "#03045E" : "#A0A0A0";

              return (
                <React.Fragment key={timelineStep.key}>
                  <div className="d-flex flex-column align-items-center" style={{ minWidth: 120 }}>
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                      style={{ width: 42, height: 42, backgroundColor: circleColor, fontSize: "1.2rem" }}
                    >
                      {timelineStep.key}
                    </div>
                    <span
                      className="mt-3 fw-semibold text-center user-select-none"
                      style={{ color: textColor, fontSize: "0.95rem", lineHeight: 1.2 }}
                    >
                      {timelineStep.label}
                    </span>
                  </div>

                  {index < TIMELINE_STEPS.length - 1 && (
                    <div
                      className="flex-grow-1 rounded-pill"
                      style={{
                        scale: 2,
                        height: 1,
                        zIndex: -1,
                        marginTop: 19,
                        marginLeft: 12,
                        marginRight: 12,
                        backgroundColor: connectorColor,
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
