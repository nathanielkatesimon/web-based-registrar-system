"use client"

import useStudentDocumentRequestStore from "@/store/student/requests/document_request_store"
import formatMoney from "@/lib/formatMoney"

const couriers_available = [
  { name: "J&T Express", fee_cents: 10000, id: 1 },
  { name: "LBC Express", fee_cents: 18000, id: 2 },
]

export default function StepThree() {  
  const setDeliveryMethod = useStudentDocumentRequestStore((state) => state.setDeliveryMethod)
  const delivery_method = useStudentDocumentRequestStore((state) => state.delivery_method)
  const next = useStudentDocumentRequestStore((state) => state.next)
  const setupCourierType = useStudentDocumentRequestStore((state) => state.setupCourierType)
  const courier_type = useStudentDocumentRequestStore((state) => state.courier_type)

  return <div className="p-5">
    <div className="card mx-auto p-12" style={{ maxWidth: 1072 }}>
      <div className="d-flex align-items-center p-5 mb-8" style={{ backgroundColor: "#F0F0F0" }}>
        <i className="bx bx-info-circle fs-4 text-primary me-2"></i>
        <span>
          <strong className="text-primary fw-bold">Note: </strong>
          Please select your preferred delivery method.
        </span>
      </div>
      
      <div className="row gy-3">
        <div className="col-md">
          <div className={`form-check custom-option custom-option-icon h-100 ${delivery_method === "self_pickup" ? "checked" : ""}`}>
            <label className="form-check-label custom-option-content" htmlFor="customRadioIcon1">
              <span className="custom-option-body">
                <i className="bx bx-walking"></i>
                <span className="custom-option-title mb-2 user-select-none"> Office Visit / Self Pick-up</span>
                <small className="user-select-none"> Once your request has been processed and completed, you will be notified of the document pickup schedule via email or through this portal’s notifications. </small>
              </span>
              <input name="customDeliveryRadioIcon" className="form-check-input d-none" checked={delivery_method == "self_pickup"} type="radio" id="customRadioIcon1" readOnly={true} onChange={() => setDeliveryMethod("self_pickup")}/>
            </label>
          </div>
        </div>
        <div className="col-md top-0">
          <div className={`form-check custom-option custom-option-icon h-100 ${delivery_method === "courier_delivery" ? "checked" : ""}`}>
            <label className="form-check-label custom-option-content" htmlFor="customRadioIcon2">
              <span className="custom-option-body">
                <i className="bx bx-truck"></i>
                <span className="custom-option-title mb-2 user-select-none"> Courier Delivery </span>
                <small className="user-select-none">The requested document will be delivered right into your home. No more hassle and unnecessary office visits and follow-ups.</small>
              </span>
              <input name="customDeliveryRadioIcon" className="form-check-input d-none" checked={delivery_method == "courier_delivery"} type="radio" id="customRadioIcon2" readOnly={true} onChange={() => setDeliveryMethod("courier_delivery")} />
            </label>
          </div>
        </div>
      </div>
      
      {delivery_method == "courier_delivery" && <>
        <hr className="my-12"/>
        <h4 className="fw-bold text-primary mb-6">Please select your courier:</h4>
        <div className="px-12">
          {couriers_available.map((courier) => (
            <div className="fs-5 my-4 d-flex align-items-center" key={courier.id} onClick={() => setupCourierType(courier)}>
              <input name={courier.name} id={courier.name} className="form-check-input me-3" checked={courier_type.name == courier.name} type="radio" readOnly={true} />
              <label htmlFor={courier.name} className="user-select-none">{courier.name}</label>
              <span className="ms-auto user-select-none">
                <strong>Shipping Fee:</strong> {formatMoney(courier.fee_cents)}
              </span>
            </div>
          ))}
        </div>
        
        <br></br>
        <div className="d-flex align-items-center p-5 mb-8" style={{ backgroundColor: "#F0F0F0" }}>
          <i className="bx bx-info-circle fs-4 text-primary me-2"></i>
          <span>
            <strong className="text-primary fw-bold">Note: </strong>
            Shipping fees will be added to the total amount reflected in the final receipt. Tracking details will be provided once the document has been processed for shipment.
          </span>
        </div>
      </>}

      {delivery_method != "" &&      
        <a href="#" className="btn btn-primary btn-lg w-100 mt-12" role="button" onClick={next}>Proceed</a>
      }
    </div>
  </div>
}