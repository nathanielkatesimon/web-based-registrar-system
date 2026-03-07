class AddCloseOrHoldReasonToDocumentRequest < ActiveRecord::Migration[8.1]
  def change
    add_column :document_requests, :close_or_hold_reason, :integer
  end
end
