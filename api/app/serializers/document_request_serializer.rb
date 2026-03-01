class DocumentRequestSerializer < ActiveModel::Serializer
  attributes :id, :request_id, :status, :delivery_method, :courier_name, :payment_method,
             :payment_status, :payment_verified_at, :shipping_fee_cents
end
