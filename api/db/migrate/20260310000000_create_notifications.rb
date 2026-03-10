class CreateNotifications < ActiveRecord::Migration[8.1]
  def change
    create_table :notifications do |t|
      t.references :student, null: false, foreign_key: { to_table: :users }
      t.references :document_request, null: false, foreign_key: true
      t.integer :kind, null: false, default: 0
      t.string :title, null: false
      t.text :message, null: false
      t.string :link_url, null: false
      t.datetime :read_at

      t.timestamps
    end

    add_index :notifications, [:student_id, :created_at]
    add_index :notifications, [:student_id, :read_at]
  end
end
