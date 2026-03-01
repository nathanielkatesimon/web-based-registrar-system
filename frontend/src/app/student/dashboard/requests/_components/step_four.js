"use client"

import useStudentDocumentRequestStore from "@/store/student/requests/document_request_store"
import formatMoney from "@/lib/formatMoney"
import ShowAlert from "@/lib/show-alert"
import { useState } from "react"
import InitDropzone from "@/components/initializer/init-dropzone"

export default function StepFour() {
  const courier_type = useStudentDocumentRequestStore((state) => state.courier_type)
  const deliver_method = useStudentDocumentRequestStore((state) => state.delivery_method)
  const setPaymentMethod = useStudentDocumentRequestStore((state) => state.setPaymentMethod)
  const clearPaymentMethod = useStudentDocumentRequestStore((state) => state.clearPaymentMethod)
  const payment_method = useStudentDocumentRequestStore((state) => state.payment_method)
  const prev = useStudentDocumentRequestStore((state) => state.prev)
  const documents = useStudentDocumentRequestStore((state) => state.documents)
  const id_verification_photo = useStudentDocumentRequestStore((state) => state.id_verification_photo)
  const payment_receipt = useStudentDocumentRequestStore((state) => state.payment_receipt)
  const setPaymentReceipt = useStudentDocumentRequestStore((state) => state.setPaymentReceipt)
  const submitRequest = useStudentDocumentRequestStore((state) => state.submitRequest)
  const completeSubmission = useStudentDocumentRequestStore((state) => state.completeSubmission)
  const clearPaymentReceipt = useStudentDocumentRequestStore((state) => state.clearPaymentReceipt)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const total = Object.keys(documents).reduce((sum, key) => {
    const item = documents[key]
    return sum + (item.price_cents * item.quantity)
  }, deliver_method == "courier_delivery" ? courier_type.fee_cents || 0 : 0)

  const parseRailsErrors = (payload) => {
    if (!payload) return "Request failed."
    if (Array.isArray(payload.errors) && payload.errors.length > 0) return payload.errors[0]
    if (payload.error) return payload.error
    if (typeof payload === "string") return payload
    if (typeof payload === "object") {
      const firstValue = Object.values(payload)[0]
      if (Array.isArray(firstValue) && firstValue.length > 0) return firstValue[0]
    }
    return "Request failed."
  }

  const handleProceed = async (event) => {
    event.preventDefault()

    if (isSubmitting) return

    if (Object.keys(documents).length < 1) {
      ShowAlert({ icon: "error", title: "No Documents Selected", text: "Please select at least one document request." })
      return
    }

    if (!deliver_method) {
      ShowAlert({ icon: "error", title: "Delivery Method Required", text: "Please select a delivery method." })
      return
    }

    if (deliver_method === "courier_delivery" && !courier_type?.name) {
      ShowAlert({ icon: "error", title: "Courier Required", text: "Please select your courier before submitting." })
      return
    }

    if (!payment_method) {
      ShowAlert({ icon: "error", title: "Payment Method Required", text: "Please select your preferred payment method." })
      return
    }

    if (!id_verification_photo) {
      ShowAlert({
        icon: "error",
        title: "Missing ID Verification Photo",
        text: "Please upload your photo while holding a valid ID before submitting."
      })
      return
    }

    if (payment_method === "online" && !payment_receipt) {
      ShowAlert({ icon: "error", title: "Payment Receipt Required", text: "Please upload your online payment receipt." })
      return
    }

    try {
      setIsSubmitting(true)
      const response = await submitRequest()
      let payload = null
      try {
        payload = await response.json()
      } catch {
        payload = null
      }

      if (!response.ok) {
        throw new Error(parseRailsErrors(payload))
      }

      const requestItems = Object.keys(documents).map((key) => {
        const document = documents[key]
        const quantity = Number.parseInt(document.quantity, 10) || 1
        return {
          name: document.name,
          quantity,
          line_total_cents: quantity * document.price_cents
        }
      })

      const subtotalCents = requestItems.reduce((sum, item) => sum + item.line_total_cents, 0)
      const shippingFeeCents = deliver_method === "courier_delivery" ? (courier_type.fee_cents || 0) : 0

      await ShowAlert({
        icon: "success",
        title: "Request Submitted",
        text: payload?.request_id
          ? `Your request has been submitted. Request ID: ${payload.request_id}`
          : "Your document request has been submitted successfully."
      })

      completeSubmission({
        request_id: payload?.request_id || "",
        status: payload?.status || "on_hold",
        delivery_method: payload?.delivery_method || deliver_method,
        courier_name: payload?.courier_name || (deliver_method === "courier_delivery" ? courier_type.name : ""),
        payment_method: payload?.payment_method || (payment_method === "online" ? "online" : "cash"),
        payment_status: payload?.payment_status || (payment_method === "online" ? "under_review" : "not_paid"),
        request_items: requestItems,
        subtotal_cents: subtotalCents,
        shipping_fee_cents: shippingFeeCents,
        total_cents: subtotalCents + shippingFeeCents
      })
    } catch (error) {
      ShowAlert({
        icon: "error",
        title: "Submission Failed",
        text: error?.message || "Failed to submit document request."
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return <div className="p-5">
    <div className="card mx-auto p-12" style={{ maxWidth: 1072 }}>

      <div className="row gy-3">
        <div className="col-md">
          <div className={`form-check custom-option custom-option-icon h-100 ${payment_method === "cash_on_hand" ? "checked" : ""}`}>
            <label className="form-check-label custom-option-content" htmlFor="customRadioIcon1">
              <span className="custom-option-body">
                <i className="bx bx-currency-notes"></i>
                <span className="custom-option-title mb-2 user-select-none"> Cash on Hand </span>
                <small className="user-select-none"> You must visit the Registrar’s Office to complete the payment. Please present your payment summary and provide the request ID. </small>
              </span>
              <input name="customDeliveryRadioIcon" className="form-check-input d-none" checked={payment_method == "cash_on_hand"} type="radio" id="customRadioIcon1" readOnly={true} onChange={() => {
                setPaymentMethod("cash_on_hand")
                clearPaymentReceipt()
              }}/>
            </label>
          </div>
        </div>
        <div className="col-md top-0">
          <div className={`form-check custom-option custom-option-icon h-100 ${payment_method === "online" ? "checked" : ""}`}>
            <label className="form-check-label custom-option-content" htmlFor="customRadioIcon2">
              <span className="custom-option-body">
                <i className="bx bx-qr-scan"></i>
                <span className="custom-option-title mb-2 user-select-none"> Online Payment (GCash) </span>
                <small className="user-select-none">Payments will be processed online via GCash. Scan the QR code below to link your account and complete the payment.</small>
              </span>
              <input name="customDeliveryRadioIcon" className="form-check-input d-none" checked={payment_method == "online"} type="radio" id="customRadioIcon2" readOnly={true} onChange={() => setPaymentMethod("online")} />
            </label>
          </div>
        </div>
      </div>
      
      
      
      {payment_method == "cash_on_hand" ?
        <div className="d-flex align-items-center p-8 my-5" style={{backgroundColor: "#F0F0F0"}}>
          <i className="bx bx-info-circle fs-4 text-danger me-2"></i>
          <span>
            <strong className="text-danger fw-bold">Note: </strong>
            Unpaid requests will be placed on hold. Please visit the Registrar’s Office to complete your payment.
          </span>
        </div> :
        payment_method == "online" && <>
          <div className="d-flex align-items-start p-8 my-5" style={{ backgroundColor: "#F0F0F0" }}>
            <i className="bx bx-info-circle fs-4 text-info me-2"></i>
            <span>
              <strong className="text-info fw-bold">Note: </strong>
              Online payments require staff verification. After completing your payment, please upload your proof of transaction for review.
            </span>
          </div>
          
          <div className="d-flex align-items-center justify-content-center mb-12 flex-column">
            <h4>Scan QR Code to process payment</h4>
            <img src="/qr_placeholder.png" alt="gcash_qrcode" width={250} height={250} className="border border-1 rounded-3 p-5" />
          </div>
          
          
          <label className="mb-5 text-primary">Please upload the GCash generated receipt below:</label>
          <div className="card shadow-none">
            <form action="/upload" className="dropzone needsclick dz-clickable border border-dashed" id="dropzone-payment-receipt">
              <div className="dz-message needsclick">
                Drop image or Click to upload
              </div>
            </form>
            {payment_receipt && (
              <small className="text-success d-block mt-3">
                Attached: {payment_receipt.name}
              </small>
            )}
            <span className="text-secondary">Only png, jpeg, jpg are allowed file types</span>
          </div>
          <InitDropzone elementId="dropzone-payment-receipt" onFileChange={setPaymentReceipt} />
        </>
      }
      
      <hr className="my-8"/>
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
        
        {deliver_method == "courier_delivery" && <>
          <div className="d-flex justify-content-between align-items-center mb-4 text-primary">
            <span>Shippping fee: {courier_type.name}</span>
            <span className="fw-semibold">{formatMoney(courier_type.fee_cents)}</span>
          </div>
        </>}
        <div className="d-flex justify-content-between align-items-center mt-8 text-primary fw-bold fs-5">
          <span>TOTAL:</span>
          <span>{formatMoney(total)}</span>
        </div>
      </div>
      
      <a href="#" className={`btn btn-primary btn-lg w-100 mt-12 ${isSubmitting ? "disabled" : ""}`} role="button" onClick={handleProceed}>
        {isSubmitting ? "Submitting..." : "Proceed"}
      </a>
      <a href="#" className={`btn btn-secondary btn-lg w-100 mt-5 ${isSubmitting ? "disabled" : ""}`} role="button" onClick={() => {
        if (isSubmitting) return
        clearPaymentMethod()
        clearPaymentReceipt()
        prev()
      }}>Back</a>
    </div>
  </div>
}
