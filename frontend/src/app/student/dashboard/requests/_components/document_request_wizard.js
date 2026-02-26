"use client"

import useStudentDocumentRequestStore from "@/store/student/requests/document_request_store";
import StepOneA from "./step_one_a";
import StepOneB from "./step_one_b";
import { useEffect } from "react";

const STEPS = {
  1: <StepOneA></StepOneA>,
  1.5: <StepOneB></StepOneB>
}

export default function DocumentRequestWizard({ document_types }) {
  const step = useStudentDocumentRequestStore((state) => state.step);
  const setDocumentTypes = useStudentDocumentRequestStore((state) => state.setDocumentTypes);
  
  useEffect(() => {
    setDocumentTypes(document_types);
  }, [document_types, setDocumentTypes])
  
  return STEPS[step]
}