class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  validates :auth_id, presence: true, uniqueness: { case_sensitive: false }
  validates :type, presence: true

  # Validation for auth_id format based on type
  validate :auth_id_format
  
  has_one_attached :avatar
  has_many :sent_escalation_messages,
           class_name: "EscalationMessage",
           foreign_key: :sender_id,
           inverse_of: :sender,
           dependent: :destroy

  def deliver_account_claim_instructions!
    token = send(:set_reset_password_token)
    send_devise_notification(:account_claim_instructions, token, {})
    token
  end
  
  def auth_id_format
    if type == 'Student' && auth_id.present? && auth_id !~ /^(\d{11}|\d{12}|\d{13})$/
      errors.add(:student, 'USN must be 11 to 13 characters')
    elsif type == 'Staff' && auth_id.present? && auth_id !~ /\A\d{2}-\d{4}-\d{3}\z/
      errors.add(:employee, 'ID invalid')
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
