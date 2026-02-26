class DocumentRequest < ApplicationRecord
  belongs_to :student, class_name: "Student", foreign_key: :user_id, inverse_of: :document_requests
  has_many :document_request_items, dependent: :destroy

  accepts_nested_attributes_for :document_request_items, allow_destroy: true

  monetize :shipping_fee_cents
  
  def user
    student
  end
end
