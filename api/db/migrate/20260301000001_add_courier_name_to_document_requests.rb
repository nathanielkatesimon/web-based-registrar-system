class AddCourierNameToDocumentRequests < ActiveRecord::Migration[8.1]
  def change
    add_column :document_requests, :courier_name, :string
  end
end
