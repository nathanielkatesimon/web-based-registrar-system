class DocumentRequestItem < ApplicationRecord
  belongs_to :document_request
  belongs_to :document_type

  before_validation :assign_unit_price_from_document_type

  monetize :unit_price_cents

  private

  def assign_unit_price_from_document_type
    return if document_type.blank?

    self.unit_price_cents = document_type.price_cents
  end
end
