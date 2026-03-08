class EscalationTicket < ApplicationRecord
  belongs_to :student, class_name: "Student", foreign_key: :student_id, inverse_of: :escalation_tickets
  belongs_to :closed_by, class_name: "Staff", optional: true, inverse_of: :closed_escalation_tickets
  has_many :escalation_messages, -> { order(created_at: :asc) }, dependent: :destroy, inverse_of: :escalation_ticket

  enum :status, {
    open: 0,
    closed: 1
  }

  validates :subject, presence: true, length: { maximum: 180 }
  validates :ticket_code, uniqueness: true

  before_validation :assign_ticket_code, on: :create

  def participant?(user)
    return false if user.blank?
    return true if user.is_a?(Staff)

    student_id == user.id
  end

  def can_chat?(user)
    return false unless participant?(user)
    return true if user.is_a?(Staff)

    open?
  end

  def close_by_staff!(staff_user)
    raise ArgumentError, "staff required" unless staff_user.is_a?(Staff)

    update!(status: :closed, closed_at: Time.current, closed_by: staff_user)
  end

  def reopen_by_staff!(staff_user)
    raise ArgumentError, "staff required" unless staff_user.is_a?(Staff)

    update!(status: :open, closed_at: nil, closed_by: nil)
  end

  private

  def assign_ticket_code
    return if ticket_code.present?

    10.times do
      self.ticket_code = "ER#{SecureRandom.random_number(10_000).to_s.rjust(4, "0")}-#{Date.current.strftime("%m%d%Y")}"
      break unless self.class.exists?(ticket_code: ticket_code)
    end
  end
end
