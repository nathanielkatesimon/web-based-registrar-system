class DocumentRequestSerializer < ActiveModel::Serializer
  attributes :id, :status, :delivery_method, :payment_method, :payment_status, :payment_verified_at, :shipping_fee_cents
  has_one :user
end
