"use client"

import formatMoney from "@/lib/formatMoney";
import useStudentDocumentRequestStore from "@/store/student/requests/document_request_store";

export default function StepOneA() {
  const document_types = useStudentDocumentRequestStore((state) => state.document_types);
  const documents = useStudentDocumentRequestStore((state) => state.documents);
  const toggleDocument = useStudentDocumentRequestStore((state) => state.toggleDocument);
  const next = useStudentDocumentRequestStore((state) => state.next);
  
  return <div className="p-5">
    <div className="card mx-auto" style={{maxWidth: 1072}}>
      <div className="card-body p-12">
        <h5 className="card-title fw-bold text-primary">Choose the document(s) you wish to request and specify how many copies are needed.</h5>
        <div className="rounded-1 p-5 text-primary d-flex align-items-center" style={{backgroundColor: "#F0F0F0"}}>
          <i className="bx bx-info-circle fs-4 me-1"></i>
          <span>Total fees are automatically calculated based on the document type, quantity of copies, and other charges or fees that will be applied.</span>
        </div>
        <div>
          {document_types.map(dt =>
            <div className="my-8 d-flex align-items-center" key={`dt_${dt.id}_key`}>
              <div onClick={() => toggleDocument(dt)}>
                <input className="form-check-input form-control-sm me-2" type="checkbox" value="_" readOnly={true} checked={documents[dt.id] ? true : false}/>
                <label className="fs-4 cursor-pointer user-select-none">{dt.name}</label>
              </div>
              <span className="ms-auto user-select-none">{formatMoney(dt.price_cents)}</span>
            </div>
          )}
        </div>
        <a href="#" className={`btn btn-primary btn-lg w-100 mt-12 ${Object.keys(documents).length < 1 ? 'disabled' : ''}`} role="button" onClick={next}>Proceed</a>
      </div>
    </div>
  </div>
}