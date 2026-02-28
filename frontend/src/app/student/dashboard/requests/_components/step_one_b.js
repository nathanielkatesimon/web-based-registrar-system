"use client"

import formatMoney from "@/lib/formatMoney";
import InitBootstrapSelect from "@/components/initializer/init-bootstrap-select";
import useStudentDocumentRequestStore from "@/store/student/requests/document_request_store";
import next from "next";

export default function StepOneB() {
  const documents = useStudentDocumentRequestStore((state) => state.documents);
  const toggleDocument = useStudentDocumentRequestStore((state) => state.toggleDocument);
  const updateDocument = useStudentDocumentRequestStore((state) => state.updateDocument);
  const prev = useStudentDocumentRequestStore((state) => state.prev);
  const next = useStudentDocumentRequestStore((state) => state.next);

  const handlePurposeChange = (event, documentt) => {
    const purpose = event.target.value;

    if(purpose == "Others") {
      updateDocument({...documentt, other_purpose: true})
    } else {
      updateDocument({...documentt, purpose, other_purpose: false})
    }
  }

  const handleOtherPurpose = (event, document) => {
    const purpose = event.target.value;
    updateDocument({...document, purpose})
  }

  const handleRemarks = (event, document) => {
    const remarks = event.target.value;
    updateDocument({...document, remarks})
  }

  const handleDestinationChange = (event, documentt) => {
    const destination = event.target.value;
    updateDocument({...documentt, destination })
  }

  const updateQuantity = (value, documentt) => {
    updateDocument({...documentt, quantity: value})
  }

  const validateRequiredFields = () => {
    let allValid = true;

    Object.keys(documents).forEach(key => {
      const document = documents[key];
      let errors = {}
      if (!document.purpose) {
        errors.purpose = "Purpose is required"
        allValid = false;
      }

      if(!document.destination) {
        errors.destination = "Destination is required"
        allValid = false;
      }

      updateDocument({...document, errors})
    });
    
    if (allValid) {
      next();
    }
  }

  return <div className="p-5">
    <div className="card mx-auto" style={{maxWidth: 1072}}>
      <div className="card-body p-12">
        <h5 className="card-title fw-bold text-primary">Choose the document(s) you wish to request and specify how many copies are needed.</h5>
        <div className="rounded-1 p-5 text-primary d-flex align-items-center" style={{backgroundColor: "#F0F0F0"}}>
          <i className="bx bx-info-circle fs-4 me-1"></i>
          <span><strong>Note:</strong> Please complete the required fields below, then click “Submit” to proceed.</span>
        </div>
        <div className="w-100 d-flex">
          <a href="#" className="btn btn-info btn-sm rounded-pill ms-auto my-5" role="button" onClick={prev}>Change/Update Request(s)</a>
        </div>
        <div>
          {
            Object.keys(documents).map((key, index) => {
              const document = documents[key];
              return <div className="card my-5 shadow-none" key={key} style={{backgroundColor: "#F0F0F0"}}>
                <div className="card-header d-flex align-items-center">
                  <h5 className="fw-bold text-primary m-0">{index + 1}. {document.name}</h5>
                  <button role="button" className="btn ms-auto text-danger" onClick={() => toggleDocument(document)}>
                    <i className="bx bx-trash"></i>
                    <span>Remove</span>
                  </button>
                </div>
                <div className="card-body">
                  <div className="d-flex">
                    <div className="w-50 m-1">
                      <label>Purpose<span className="text-danger">*</span></label>
                      <select
                        className="selectpicker w-100 bg-white rounded-2"
                        data-style="btn-default"
                        data-size="6"
                        title="Purpose"
                        value={document.other_purpose ? "Others" : document.purpose}
                        onChange={(e) => handlePurposeChange(e, document)}
                      >
                        <option value="Employment">Employment</option>
                        <option value="For Board Exam">For Board Exam</option>
                        <option value="For Scholarship">For Scholarship</option>
                        <option value="For Further Studies">For Further Studies</option>
                        <option value="For Transfer School">For Transfer School</option>
                        <option value="Others">Others</option>
                      </select>
                      {document.errors?.purpose && <label className="text-danger">{document.errors.purpose}</label>}
                    </div>
                    <div className="w-50 m-1">
                      <label>Local or Abroad<span className="text-danger">*</span></label>
                      <select
                        className="selectpicker w-100 bg-white rounded-2"
                        data-style="btn-default"
                        data-size="6"
                        title="Local/Abroad"
                        value={document.destination}
                        onChange={(e) => handleDestinationChange(e, document)}
                      >
                        <option value="local">Local</option>
                        <option value="abroad">Abroad</option>
                      </select>
                      {document.errors?.destination && <label className="text-danger">{document.errors.destination}</label>}
                    </div>
                  </div><br/>
                  <div className={document.other_purpose ? "" : "d-none"}>
                    <label className="text-danger">Indicate Purpose*</label>
                    <textarea className="form-control shadow-none" rows="3" onChange={(e) => handleOtherPurpose(e, document)} value={document.purpose} />
                    <div className="text-end text-secondary user-select-none">
                      <span>0/100</span>
                    </div>
                  </div>
                  <div className="">
                    <label className="fs-bold">Additional Remarks:</label>
                    <textarea className="form-control shadow-none" rows="3" onChange={(e) => handleRemarks(e, document)} value={document.remarks} />
                    <div className="text-end text-secondary user-select-none">
                      <span>0/300</span>
                    </div>
                  </div>
                  <div>
                    <div className="d-flex align-items-center justify-content-end">
                      <label>Copies:</label>
                      <input
                        type="number"
                        className="form-control shadow-none ms-3"
                        style={{width: "7ch"}}
                        min={1}
                        value={document.quantity}
                        onChange={(e) => updateQuantity(e.target.value, document)}
                      ></input>
                    </div>
                    <h3 className="text-end">{formatMoney(document.price_cents * document.quantity)}</h3>
                  </div>
                </div>
              </div>
            })
          }


          <div className="p-8" style={{ backgroundColor: "#F0F0F0" }}>
            <h3 className="text-end text-info m-0 fw-bold">*Total: {
              formatMoney(
                Object.keys(documents).reduce((sum, key) => {
                  const item = documents[key];
                  return sum + item.price_cents * item.quantity;
                }, 0)
              )
            }</h3>
            <h5 className="text-end text-primary">Estimated amount. The final bill will be reflected after verification and choosing delivery method.</h5>
          </div>


          <a href="#" className="btn btn-primary btn-lg w-100 mt-12" role="button" onClick={validateRequiredFields}>Submit</a>
        </div>
      </div>
    </div>
    <InitBootstrapSelect/>
  </div>
}
