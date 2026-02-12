class CreateStudentProfiles < ActiveRecord::Migration[8.1]
  def change
    create_table :student_profiles do |t|
      t.references :user, null: false, foreign_key: true
      
      # Personal Info
      t.string :civil_status
      t.string :contact_number
      t.string :sex
      t.date :birthday
      t.string :place_of_birth
      t.string :citizenship
      t.string :religion
      
      # Home Address
      t.string :house_number
      t.string :street_name
      t.string :barangay_name
      t.string :city_municipality
      t.string :province
      
      # Academic Info
      t.string :status
      t.string :school_level
      t.string :year_level
      t.string :course
      t.string :department
      t.string :strand
      t.string :track

      t.timestamps
    end
  end
end
