class ReplacePreviousSchoolsWithProfileSchoolSlots < ActiveRecord::Migration[8.1]
  def up
    drop_table :previous_schools

    change_table :student_profiles, bulk: true do |t|
      t.string :current_college_school_name
      t.string :current_college_program
      t.string :current_college_level
      t.integer :current_college_year_from
      t.integer :current_college_year_to
      t.string :current_college_department_track

      t.string :prev_college_school_name
      t.string :prev_college_program
      t.string :prev_college_level
      t.integer :prev_college_year_from
      t.integer :prev_college_year_to
      t.string :prev_college_department_track

      t.string :current_senior_high_school_name
      t.string :current_senior_high_program
      t.string :current_senior_high_level
      t.integer :current_senior_high_year_from
      t.integer :current_senior_high_year_to
      t.string :current_senior_high_department_track

      t.string :prev_senior_high_school_name
      t.string :prev_senior_high_program
      t.string :prev_senior_high_level
      t.integer :prev_senior_high_year_from
      t.integer :prev_senior_high_year_to
      t.string :prev_senior_high_department_track
    end
  end

  def down
    change_table :student_profiles, bulk: true do |t|
      t.remove :current_college_school_name
      t.remove :current_college_program
      t.remove :current_college_level
      t.remove :current_college_year_from
      t.remove :current_college_year_to
      t.remove :current_college_department_track

      t.remove :prev_college_school_name
      t.remove :prev_college_program
      t.remove :prev_college_level
      t.remove :prev_college_year_from
      t.remove :prev_college_year_to
      t.remove :prev_college_department_track

      t.remove :current_senior_high_school_name
      t.remove :current_senior_high_program
      t.remove :current_senior_high_level
      t.remove :current_senior_high_year_from
      t.remove :current_senior_high_year_to
      t.remove :current_senior_high_department_track

      t.remove :prev_senior_high_school_name
      t.remove :prev_senior_high_program
      t.remove :prev_senior_high_level
      t.remove :prev_senior_high_year_from
      t.remove :prev_senior_high_year_to
      t.remove :prev_senior_high_department_track
    end

    create_table :previous_schools do |t|
      t.references :student_profile, null: false, foreign_key: true
      t.string :school_type, null: false
      t.string :school_name, null: false
      t.integer :academic_year_from, null: false
      t.integer :academic_year_to, null: false
      t.string :program
      t.boolean :completed

      t.timestamps
    end

    add_index :previous_schools, [:student_profile_id, :school_type]
  end
end
