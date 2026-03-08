class EscalationMessage < ApplicationRecord
  belongs_to :escalation_ticket, inverse_of: :escalation_messages
  belongs_to :sender, class_name: "User", foreign_key: :sender_id, inverse_of: :sent_escalation_messages

  validates :body, presence: true, length: { maximum: 4000 }
  validate :sender_must_be_participant
  validate :chat_must_be_allowed_for_sender

  after_create_commit :touch_ticket_last_message_at!

  private

  def sender_must_be_participant
    return if escalation_ticket.blank? || sender.blank?
    return if escalation_ticket.participant?(sender)

    errors.add(:sender, "is not part of this ticket")
  end

  def chat_must_be_allowed_for_sender
    return if escalation_ticket.blank? || sender.blank?
    return if escalation_ticket.can_chat?(sender)

    errors.add(:base, "This ticket is closed and you can no longer send messages.")
  end

  def touch_ticket_last_message_at!
    escalation_ticket.update_column(:last_message_at, created_at)
  end
end
