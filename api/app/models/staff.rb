class Staff < User
  has_many :closed_escalation_tickets,
           class_name: "EscalationTicket",
           foreign_key: :closed_by_id,
           inverse_of: :closed_by,
           dependent: :nullify

  after_initialize :mark_as_claimed, if: :new_record?

  private

  def mark_as_claimed
    self.claimed = true if claimed.nil?
  end
end
