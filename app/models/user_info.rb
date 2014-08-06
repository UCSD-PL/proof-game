class UserInfo < ActiveRecord::Base
  attr_accessible :current_puzzle, :max_puzzle, :username

  before_save :update_max

  def update_max
    if self.max_puzzle == nil or self.max_puzzle < self.current_puzzle
      self.max_puzzle = self.current_puzzle
    end
  end
end
