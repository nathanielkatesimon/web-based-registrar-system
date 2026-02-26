class CreateFamilyInfos < ActiveRecord::Migration[8.1]
  def change
    create_table :family_infos do |t|
      t.references :user, null: false, foreign_key: true, index: { unique: true }

      t.string :father_first_name
      t.string :father_middle_name
      t.string :father_last_name
      t.string :father_extension
      t.string :father_home_address
      t.string :father_occupation
      t.string :father_office_company_name
      t.string :father_company_address
      t.string :father_contact_number
      t.string :father_email_address

      t.string :mother_first_name
      t.string :mother_middle_name
      t.string :mother_last_name
      t.string :mother_extension
      t.string :mother_home_address
      t.string :mother_occupation
      t.string :mother_office_company_name
      t.string :mother_company_address
      t.string :mother_contact_number
      t.string :mother_email_address

      t.string :guardian_first_name
      t.string :guardian_middle_name
      t.string :guardian_last_name
      t.string :guardian_extension
      t.string :guardian_home_address
      t.string :guardian_occupation
      t.string :guardian_office_company_name
      t.string :guardian_company_address
      t.string :guardian_contact_number
      t.string :guardian_email_address

      t.timestamps
    end
  end
end
