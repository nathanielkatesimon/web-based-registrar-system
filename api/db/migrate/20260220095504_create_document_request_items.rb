class CreateDocumentRequestItems < ActiveRecord::Migration[8.1]
  def change
    create_table :document_request_items do |t|
      t.references :document_request, null: false, foreign_key: true
      t.references :document_type, null: false, foreign_key: true
      t.integer :quantity
      t.string :purpose
      t.integer :destination
      t.string :remarks
      t.integer :unit_price_cents

      t.timestamps
    end
  end
end
