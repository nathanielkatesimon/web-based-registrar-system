class Staff < User
  has_many :closed_escalation_tickets,
           class_name: "EscalationTicket",
           foreign_key: :closed_by_id,
           inverse_of: :closed_by,
           dependent: :nullify
end
