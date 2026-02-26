class CreateDeficiencies < ActiveRecord::Migration[8.1]
  def change
    create_table :deficiencies do |t|
      t.references :user, null: false, foreign_key: true, index: { unique: true }

      t.integer :enrollment_form, null: false, default: 2
      t.integer :form_138, null: false, default: 2
      t.integer :form_137, null: false, default: 2
      t.integer :certificate_of_good_moral_character, null: false, default: 2
      t.integer :id_pictures, null: false, default: 2
      t.integer :birth_certificate, null: false, default: 2
      t.integer :senior_high_school_diploma, null: false, default: 2
      t.integer :honorable_dismissal, null: false, default: 2
      t.integer :transcript_of_records, null: false, default: 2

      t.timestamps
    end
  end
end
