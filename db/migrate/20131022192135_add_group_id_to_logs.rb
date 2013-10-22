class AddGroupIdToLogs < ActiveRecord::Migration
  def up
    add_column :logs, :group_id, :integer
  end

  def down
    remove_column :logs, :group_id
  end
end
