

export default function StepThree() {
  return <div className="p-5">
    <div className="card mx-auto p-12" style={{ maxWidth: 1072 }}>
  
      <div className="row gy-3">
        <div className="col-md">
          <div className="form-check custom-option custom-option-icon checked">
            <label className="form-check-label custom-option-content" htmlFor="customRadioIcon1">
              <span className="custom-option-body">
                <i className="bx bx-currency-notes"></i>
                <span className="custom-option-title mb-2"> Cash on Hand </span>
                <small> If you choose this payment method, you must visit the Registrar’s Office to complete the payment. Please present your payment summary and provide the request ID. </small>
              </span>
              <input name="customDeliveryRadioIcon" className="form-check-input" type="radio" value="" id="customRadioIcon1" checked="" />
            </label>
          </div>
        </div>
        <div className="col-md top-0">
          <div className="form-check custom-option custom-option-icon">
            <label className="form-check-label custom-option-content" htmlFor="customRadioIcon2">
              <span className="custom-option-body">
                <i className="bx bx-paper-plane"></i>
                <span className="custom-option-title mb-2"> Online Payment (GCash) </span>
                <small>Payments will be processed online via GCash. Scan the QR code below to link your account and complete the payment.</small>
              </span>
              <input name="customDeliveryRadioIcon" className="form-check-input" type="radio" value="" id="customRadioIcon2" />
            </label>
          </div>
        </div>
      </div>

    </div>
  </div>
}