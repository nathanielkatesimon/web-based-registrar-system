class AddAssignedStaffToEscalationTickets < ActiveRecord::Migration[8.0]
  def change
    add_reference :escalation_tickets, :assigned_staff, foreign_key: { to_table: :users }, null: true
  end
end
