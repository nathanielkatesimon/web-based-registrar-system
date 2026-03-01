class AddRequestIdToDocumentRequests < ActiveRecord::Migration[8.1]
  def change
    add_column :document_requests, :request_id, :string
    add_index :document_requests, :request_id, unique: true
  end
end
