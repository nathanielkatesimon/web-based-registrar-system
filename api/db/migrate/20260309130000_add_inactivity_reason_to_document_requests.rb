class AddInactivityReasonToDocumentRequests < ActiveRecord::Migration[8.1]
  def change
    add_column :document_requests, :inactivity, :boolean, default: false, null: false
  end
end
