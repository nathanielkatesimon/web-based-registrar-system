class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  validates :auth_id, presence: true, uniqueness: { case_sensitive: false }
  validates :type, presence: true

  # Validation for auth_id format based on type
  validate :auth_id_format
  
  def auth_id_format
    if type == 'Student' && auth_id.present? && auth_id.length != 13
      errors.add(:auth_id, 'USN must be 13 characters')
    elsif type == 'Staff' && auth_id.present? && auth_id.length > 10
      errors.add(:auth_id, 'Employee ID should be short (max 10 characters)')
    end
  end

  def full_name
    [first_name, middle_name, last_name, extension].compact.join(' ')
  end

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
