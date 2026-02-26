class DeficiencySerializer < ActiveModel::Serializer
  attributes :id, :user_id,
             :enrollment_form,
             :form_138,
             :form_137,
             :certificate_of_good_moral_character,
             :id_pictures,
             :birth_certificate,
             :senior_high_school_diploma,
             :honorable_dismissal,
             :transcript_of_records
end
