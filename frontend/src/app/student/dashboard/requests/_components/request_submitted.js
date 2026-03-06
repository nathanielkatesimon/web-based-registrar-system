"use client"

import formatMoney from "@/lib/formatMoney"
import useStudentDocumentRequestStore from "@/store/student/requests/document_request_store"
import Link from "next/link"

const formatPaymentMethod = (value) => {
  if (value === "online") return "Online Payment (GCash)"
  return "Cash on Hand"
}

const formatPaymentStatus = (value) => {
  if (value === "under_review") return "Under Review"
  if (value === "paid") return "Paid"
  return "Not Yet Paid"
}

const formatStatus = (value) => {
  if (!value) return "On Hold"
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export default function RequestSubmitted() {
  const submitted_request = useStudentDocumentRequestStore((state) => state.submitted_request)

  if (!submitted_request) return null

  const {
    request_items = [],
    shipping_fee_cents = 0,
    total_cents = 0,
    request_id = "",
    delivery_method = "self_pickup",
    courier_name = "",
    payment_method = "cash",
    payment_status = "not_paid",
    status = "on_hold"
  } = submitted_request

  const isOnlineReview = payment_method === "online" && payment_status === "under_review"

  return <div className="px-5 pb-10">
    <div className="mx-auto" style={{ maxWidth: 1072 }}>
      <h3 className="text-center fw-bold text-primary mb-10 mt-8">Request Successfully Submitted!</h3>

      <div className="card border-0 rounded-4 shadow-none">
        <div className="card-body p-10 p-md-12">
          <div className="d-flex align-items-center mb-8">
            <h4 className="fw-bold text-primary m-0">Request Summary</h4>
            <h4 className="fw-bold text-warning m-0 ms-auto">{formatStatus(status)}</h4>
          </div>

          <div className="rounded-3 p-8" style={{ backgroundColor: "#F0F0F0" }}>
            {request_items.map((item, index) =>
              <div className="d-flex align-items-center text-primary mb-3" key={`submitted_item_${index}`}>
                <span>{item.quantity} x {item.name}</span>
                <span className="ms-auto fw-semibold">{formatMoney(item.line_total_cents)}</span>
              </div>
            )}
            {delivery_method === "courier_delivery" && (
              <div className="d-flex align-items-center text-primary mb-3">
                <span>Shipping Fee{courier_name ? ` (${courier_name})` : ""}</span>
                <span className="ms-auto fw-semibold">{formatMoney(shipping_fee_cents)}</span>
              </div>
            )}
            <div className="d-flex align-items-center text-primary fw-bold fs-4 mt-6">
              <span>TOTAL:</span>
              <span className="ms-auto">{formatMoney(total_cents)}</span>
            </div>
          </div>

          <div className="mt-8 text-primary fs-6">
            <p className="mb-3"><strong>Request ID:</strong> {request_id}</p>
            <p className="mb-3"><strong>Payment Method:</strong> {formatPaymentMethod(payment_method)}</p>
            <p className="mb-0">
              <strong>Payment Status:</strong>{" "}
              <span className={payment_status === "under_review" ? "text-warning" : payment_status === "paid" ? "text-success" : "text-danger"}>
                {formatPaymentStatus(payment_status)}
              </span>
            </p>
          </div>

          <div className="rounded-3 d-flex align-items-start p-6 mt-8" style={{ backgroundColor: "#F5F5F5" }}>
            <i className={`bx bx-info-circle fs-4 me-2 ${isOnlineReview ? "text-warning" : "text-danger"}`}></i>
            <span className="text-primary">
              <strong className={isOnlineReview ? "text-warning" : "text-danger"}>Note:</strong>{" "}
              {isOnlineReview
                ? "Your online payment is currently under review. We will update your request status once payment verification is completed by the registrar staff."
                : "Unpaid requests will be placed on hold. Please visit the Registrar’s Office to complete your payment."}
            </span>
          </div>
          
          <Link href="/student/dashboard/tracker" className="btn btn-primary btn-lg w-100 mt-10">
            Go to Tracker
          </Link>
        </div>
      </div>
    </div>
  </div>
}
