class CreateDocumentTypes < ActiveRecord::Migration[8.1]
  def change
    create_table :document_types do |t|
      t.string :name
      t.integer :price_cents

      t.timestamps
    end
  end
end
