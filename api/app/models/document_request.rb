class DocumentRequest < ApplicationRecord
  belongs_to :student, class_name: "Student", foreign_key: :user_id
  monetize :shipping_fee_cents
end
