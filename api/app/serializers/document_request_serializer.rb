class DocumentRequestSerializer < ActiveModel::Serializer
  attributes :id, :request_id, :status, :delivery_method, :courier_name, :payment_method,
             :payment_status, :payment_verified_at, :shipping_fee_cents, :student_name, :created_at,
             :updated_at, :request_items, :total_cents, :id_verification_photo_url, :payment_receipt_url,
             :unpaid_bill, :missing_requirements, :inactivity, :escalation_ticket

  has_many :request_time_lines

  def student_name
    object.student&.full_name
  end

  def request_items
    object.document_request_items.includes(:document_type).map do |item|
      quantity = item.quantity.to_i
      unit_price_cents = item.unit_price_cents.to_i

      {
        id: item.id,
        quantity: quantity,
        name: item.document_type&.name,
        unit_price_cents: unit_price_cents,
        line_total_cents: quantity * unit_price_cents,
        purpose: item.purpose,
        remarks: item.remarks
      }
    end
  end

  def total_cents
    items_total = object.document_request_items.sum do |item|
      item.quantity.to_i * item.unit_price_cents.to_i
    end

    items_total + object.shipping_fee_cents.to_i
  end

  def id_verification_photo_url
    return unless object.id_verification_photo.attached?

    Rails.application.routes.url_helpers.rails_blob_path(object.id_verification_photo, only_path: true)
  end

  def payment_receipt_url
    return unless object.payment_receipt.attached?

    Rails.application.routes.url_helpers.rails_blob_path(object.payment_receipt, only_path: true)
  end

  def escalation_ticket
    ticket = object.escalation_ticket
    return nil unless ticket

    {
      id: ticket.id,
      ticket_code: ticket.ticket_code,
      status: ticket.status
    }
  end
end
