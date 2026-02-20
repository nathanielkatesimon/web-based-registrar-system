class DocumentRequestItemSerializer < ActiveModel::Serializer
  attributes :id, :quantity, :purpose, :destination, :remarks, :unit_price_cents
  has_one :document_request
  has_one :document_type
end
