"use client"

import InitDropzone from "@/components/initializer/init-dropzone"
import formatMoney from "@/lib/formatMoney"
import useStudentDocumentRequestStore from "@/store/student/requests/document_request_store"
import PersonalInfoForm from "./personal_info_form"

export default function StepTwo() {
  const prev = useStudentDocumentRequestStore((state) => state.prev)
  const documents = useStudentDocumentRequestStore((state) => state.documents)
  const total = Object.keys(documents).reduce((sum, key) => {
    const item = documents[key]
    return sum + (item.price_cents * item.quantity)
  }, 0)

  return <div className="p-5">
    <div className="card mx-auto p-12" style={{ maxWidth: 1072 }}>
      
      <PersonalInfoForm />
      <hr className="my-12"/>
      <h4 className="fw-bold text-primary">Attachments<span className="text-danger">*</span></h4>
      <h4 className="text-primary">Upload a photo of you holding any valid ID.</h4>
      <label className="mb-5 text-primary"><strong>Note: </strong>Please make sure the photo / image uploaded is clear.</label>
      <div className="card shadow-none">
        <form action="/upload" className="dropzone needsclick dz-clickable border border-dashed" id="dropzone-basic">
          <div className="dz-message needsclick">
            Drop image or Click to upload
          </div>
        </form>
        <span className="text-secondary">Only png, jpeg, jpg are allowed file types</span>
      </div>
      <hr className="my-12"/>
      <h4 className="fw-bold text-primary mb-6">Request Summary</h4>
      <div className="rounded-3 p-12" style={{backgroundColor: "#f0f0f0"}}>
        {Object.keys(documents).map((key) => {
          const document = documents[key]
          const lineTotal = document.price_cents * document.quantity

          return <div key={key} className="d-flex justify-content-between align-items-center mb-4 text-primary">
            <span>{document.quantity} x {document.name}</span>
            <span className="fw-semibold">{formatMoney(lineTotal)}</span>
          </div>
        })}
        <div className="d-flex justify-content-between align-items-center mt-8 text-primary fw-bold fs-5">
          <span>TOTAL:</span>
          <span>{formatMoney(total)}</span>
        </div>
      </div>
      <a href="#" className="btn btn-primary btn-lg w-100 mt-12" role="button">Proceed</a>
      <a href="#" className="btn btn-secondary btn-lg w-100 mt-5" role="button" onClick={prev}>Back</a>


      <InitDropzone />
    </div>
  </div>
}
