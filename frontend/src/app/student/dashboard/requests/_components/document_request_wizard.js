"use client"

import useStudentDocumentRequestStore from "@/store/student/requests/document_request_store";
import StepOneA from "./step_one_a";
import StepOneB from "./step_one_b";
import StepTwo from "./step_two";
import StepThree from "./step_three"; 
import StepFour from "./step_four";
import RequestSubmitted from "./request_submitted";
import { useEffect } from "react";

const STEPS = {
  1: <StepOneA></StepOneA>,
  1.5: <StepOneB></StepOneB>,
  2: <StepTwo></StepTwo>,
  3: <StepThree></StepThree>,
  4: <StepFour></StepFour>,
  5: <RequestSubmitted></RequestSubmitted>,
}

export default function DocumentRequestWizard({ document_types }) {
  const step = useStudentDocumentRequestStore((state) => state.step);
  const setDocumentTypes = useStudentDocumentRequestStore((state) => state.setDocumentTypes);
  
  useEffect(() => {
    setDocumentTypes(document_types);
  }, [document_types, setDocumentTypes])
  
  return STEPS[step]
}
