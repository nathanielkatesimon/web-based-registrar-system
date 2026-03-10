class AddClaimedToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :claimed, :boolean, null: false, default: true
    add_index :users, :claimed
  end
end
