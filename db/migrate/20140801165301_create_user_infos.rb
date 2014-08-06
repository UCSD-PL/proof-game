class CreateUserInfos < ActiveRecord::Migration
  def change
    create_table :user_infos do |t|
      t.string :username
      t.integer :current_puzzle
      t.integer :max_puzzle

      t.timestamps
    end
  end
end
