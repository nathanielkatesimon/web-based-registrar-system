class EscalationMailer < ApplicationMailer
  default from: -> { "E-Registrar <#{ENV.fetch("SMTP_EMAIL", "no-reply@eregistrar.app")}>" }

  def message_to_student(message)
    @message  = message
    @ticket   = message.escalation_ticket
    @student  = @ticket.student
    @sender   = message.sender
    @ticket_url = ticket_portal_url("student")

    mail(
      to: @student.email,
      subject: "New message on escalation #{@ticket.ticket_code}"
    )
  end

  def message_to_staff(message)
    @message  = message
    @ticket   = message.escalation_ticket
    @staff    = @ticket.assigned_staff
    @sender   = message.sender
    @ticket_url = ticket_portal_url("staff")

    mail(
      to: @staff.email,
      subject: "#{@ticket.student.full_name} replied on escalation #{@ticket.ticket_code}"
    )
  end

  private

  def ticket_portal_url(role)
    base = ENV.fetch("FRONTEND_URL", "http://localhost:3000").chomp("/")
    "#{base}/#{role}/dashboard/escalations?ticket=#{@ticket.id}"
  end
end
