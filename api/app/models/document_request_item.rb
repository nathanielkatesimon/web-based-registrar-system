class DocumentRequestItem < ApplicationRecord
  belongs_to :document_request
  belongs_to :document_type
  monetize :unit_price_cents
end
