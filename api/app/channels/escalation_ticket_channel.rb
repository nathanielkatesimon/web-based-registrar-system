class EscalationTicketChannel < ApplicationCable::Channel
  def subscribed
    @ticket = find_ticket
    reject unless @ticket&.participant?(current_user)

    stream_from ticket_stream_name(@ticket.id)
  end

  private

  def find_ticket
    raw_id = params[:ticket_id].to_s
    return if raw_id.blank?

    if raw_id.match?(/\A\d+\z/)
      EscalationTicket.find_by(id: raw_id)
    else
      EscalationTicket.find_by(ticket_code: raw_id)
    end
  end

  def ticket_stream_name(ticket_id)
    "escalation_ticket:#{ticket_id}"
  end
end
