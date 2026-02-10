class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  validates :auth_id, presence: true, uniqueness: { case_sensitive: false }

  protected

  def self.find_for_database_authentication(warden_conditions)
    conditions = warden_conditions.dup
    auth_id = conditions.delete(:auth_id)
    where(conditions).where(auth_id: auth_id).first
  end

  def email_required?
      false
  end
end
