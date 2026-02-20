class CreateDocumentRequests < ActiveRecord::Migration[8.1]
  def change
    create_table :document_requests do |t|
      t.references :user, null: false, foreign_key: true
      t.integer :status
      t.integer :delivery_method
      t.integer :payment_method
      t.integer :payment_status
      t.integer :payment_verified_at
      t.integer :shipping_fee_cents

      t.timestamps
    end
  end
end
