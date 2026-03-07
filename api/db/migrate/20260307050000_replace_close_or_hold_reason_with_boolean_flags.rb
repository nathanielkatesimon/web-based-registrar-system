class ReplaceCloseOrHoldReasonWithBooleanFlags < ActiveRecord::Migration[8.1]
  def up
    add_column :document_requests, :unpaid_bill, :boolean, default: false, null: false
    add_column :document_requests, :missing_requirements, :boolean, default: false, null: false

    execute <<~SQL
      UPDATE document_requests
      SET unpaid_bill = TRUE
      WHERE close_or_hold_reason = 0
    SQL

    execute <<~SQL
      UPDATE document_requests
      SET missing_requirements = TRUE
      WHERE close_or_hold_reason = 1
    SQL

    remove_column :document_requests, :close_or_hold_reason, :integer
  end

  def down
    add_column :document_requests, :close_or_hold_reason, :integer

    execute <<~SQL
      UPDATE document_requests
      SET close_or_hold_reason = CASE
        WHEN missing_requirements = TRUE THEN 1
        WHEN unpaid_bill = TRUE THEN 0
        ELSE NULL
      END
    SQL

    remove_column :document_requests, :unpaid_bill, :boolean
    remove_column :document_requests, :missing_requirements, :boolean
  end
end
