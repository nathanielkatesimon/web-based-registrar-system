class Api::V1::EscalationMessagesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_escalation_ticket

  # GET /api/v1/escalation_tickets/:escalation_ticket_id/messages
  def index
    messages = @escalation_ticket.escalation_messages.includes(:sender)
    render json: messages.map { |message| message_json(message) }
  end

  # POST /api/v1/escalation_tickets/:escalation_ticket_id/messages
  def create
    message = @escalation_ticket.escalation_messages.new(escalation_message_params.merge(sender: current_user))

    if message.save
      @escalation_ticket.reload
      broadcast_message_created!(@escalation_ticket, message)
      deliver_message_notification(message)
      render json: message_json(message), status: :created
    else
      render json: { errors: message.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def set_escalation_ticket
    @escalation_ticket = find_ticket_by_id_or_code!
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Escalation ticket not found" }, status: :not_found
  end

  def find_ticket_by_id_or_code!
    scope = escalation_tickets_scope
    raw_id = params[:escalation_ticket_id].to_s

    if raw_id.match?(/\A\d+\z/)
      scope.find(raw_id)
    else
      scope.find_by!(ticket_code: raw_id)
    end
  end

  def escalation_tickets_scope
    return EscalationTicket.all if current_user.is_a?(Staff)

    current_user.escalation_tickets
  end

  def escalation_message_params
    params.require(:escalation_message).permit(:body)
  end

  def message_json(message)
    {
      id: message.id,
      body: message.body,
      sender: {
        id: message.sender_id,
        type: message.sender.type,
        full_name: message.sender.full_name,
        avatar_url: message.sender.avatar.attached? ? Rails.application.routes.url_helpers.rails_blob_path(message.sender.avatar, only_path: true) : nil
      },
      created_at: message.created_at,
      updated_at: message.updated_at
    }
  end

  def ticket_summary_json(ticket)
    latest = ticket.escalation_messages.order(created_at: :desc).first

    {
      id: ticket.id,
      ticket_code: ticket.ticket_code,
      subject: ticket.subject,
      status: ticket.status,
      student: {
        id: ticket.student_id,
        full_name: ticket.student.full_name
      },
      latest_message_preview: latest&.body&.truncate(100),
      latest_message_at: latest&.created_at || ticket.last_message_at,
      closed_at: ticket.closed_at,
      created_at: ticket.created_at,
      updated_at: ticket.updated_at
    }
  end

  def deliver_message_notification(message)
    if message.sender.is_a?(Staff)
      EscalationMailer.message_to_student(message).deliver_later
    elsif message.sender.is_a?(Student) && @escalation_ticket.assigned_staff.present?
      EscalationMailer.message_to_staff(message).deliver_later
    end
  end

  def broadcast_message_created!(ticket, message)
    payload = {
      event: "message_created",
      ticket: ticket_summary_json(ticket),
      message: message_json(message)
    }

    ActionCable.server.broadcast("escalation_inbox:staff", payload)
    ActionCable.server.broadcast("escalation_inbox:student:#{ticket.student_id}", payload)
    ActionCable.server.broadcast("escalation_ticket:#{ticket.id}", payload)
  end
end
