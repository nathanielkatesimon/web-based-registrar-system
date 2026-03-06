class CreateRequestTimeLines < ActiveRecord::Migration[8.1]
  def change
    create_table :request_time_lines do |t|
      t.integer :type, null: false
      t.references :document_request, null: false, foreign_key: true

      t.timestamps
    end
  end
end
