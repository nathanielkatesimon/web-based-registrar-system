class FamilyInfo < ApplicationRecord
  belongs_to :student,
    class_name: "Student",
    foreign_key: :user_id,
    inverse_of: :family_info
end
