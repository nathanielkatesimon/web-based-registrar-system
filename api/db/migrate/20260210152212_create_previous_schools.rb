class CreatePreviousSchools < ActiveRecord::Migration[8.1]
  def change
    create_table :previous_schools do |t|
      t.references :student_profile, null: false, foreign_key: true
      t.string :school_type, null: false # 'senior_high' or 'college'
      t.string :school_name, null: false
      t.integer :academic_year_from, null: false
      t.integer :academic_year_to, null: false
      t.string :program # Open-ended for track/strand/course since they're transferring
      t.boolean :completed

      t.timestamps
    end
    
    add_index :previous_schools, [:student_profile_id, :school_type]
  end
end
