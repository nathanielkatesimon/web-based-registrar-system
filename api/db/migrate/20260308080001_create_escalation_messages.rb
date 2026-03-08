class CreateEscalationMessages < ActiveRecord::Migration[8.0]
  def change
    create_table :escalation_messages do |t|
      t.references :escalation_ticket, null: false, foreign_key: true
      t.references :sender, null: false, foreign_key: { to_table: :users }
      t.text :body, null: false

      t.timestamps
    end

    add_index :escalation_messages, [:escalation_ticket_id, :created_at]
  end
end
