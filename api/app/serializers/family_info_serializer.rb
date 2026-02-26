class FamilyInfoSerializer < ActiveModel::Serializer
  attributes :id, :user_id,
             :father_first_name, :father_middle_name, :father_last_name, :father_extension,
             :father_home_address, :father_occupation, :father_office_company_name,
             :father_company_address, :father_contact_number, :father_email_address,
             :mother_first_name, :mother_middle_name, :mother_last_name, :mother_extension,
             :mother_home_address, :mother_occupation, :mother_office_company_name,
             :mother_company_address, :mother_contact_number, :mother_email_address,
             :guardian_first_name, :guardian_middle_name, :guardian_last_name, :guardian_extension,
             :guardian_home_address, :guardian_occupation, :guardian_office_company_name,
             :guardian_company_address, :guardian_contact_number, :guardian_email_address
end
