class CreateEscalationTickets < ActiveRecord::Migration[8.0]
  def change
    create_table :escalation_tickets do |t|
      t.references :student, null: false, foreign_key: { to_table: :users }
      t.string :ticket_code, null: false
      t.string :subject, null: false
      t.integer :status, null: false, default: 0
      t.datetime :last_message_at
      t.datetime :closed_at
      t.references :closed_by, null: true, foreign_key: { to_table: :users }

      t.timestamps
    end

    add_index :escalation_tickets, :ticket_code, unique: true
    add_index :escalation_tickets, [:student_id, :status]
    add_index :escalation_tickets, :last_message_at
  end
end
