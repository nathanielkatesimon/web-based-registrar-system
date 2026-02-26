class Deficiency < ApplicationRecord
  FIELDS = %i[
    enrollment_form
    form_138
    form_137
    certificate_of_good_moral_character
    id_pictures
    birth_certificate
    senior_high_school_diploma
    honorable_dismissal
    transcript_of_records
  ].freeze

  STATUSES = {
    complied: 0,
    lacking: 1,
    not_included: 2
  }.freeze

  belongs_to :student,
    class_name: "Student",
    foreign_key: :user_id,
    inverse_of: :deficiency

  FIELDS.each do |field|
    enum field, STATUSES, default: :not_included, validate: true, prefix: true
  end
end
