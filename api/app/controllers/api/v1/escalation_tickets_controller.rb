class Api::V1::EscalationTicketsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_escalation_ticket, only: [:show, :close, :reopen]
  before_action :authorize_staff!, only: [:close, :reopen]

  # GET /api/v1/escalation_tickets
  def index
    tickets = escalation_tickets_scope
      .includes(:student, :document_request, :assigned_staff)
      .order(Arel.sql("COALESCE(last_message_at, created_at) DESC"))

    render json: tickets.map { |ticket| ticket_summary_json(ticket) }
  end

  # GET /api/v1/escalation_tickets/:id
  def show
    if current_user.is_a?(Staff)
      newly_assigned = @escalation_ticket.assign_to_staff!(current_user)
      if newly_assigned
        @escalation_ticket.reload
        broadcast_ticket_updated!(@escalation_ticket)
      end
    end
    render json: ticket_detail_json(@escalation_ticket)
  end

  # POST /api/v1/escalation_tickets
  def create
    unless current_user.is_a?(Student)
      return render json: { error: "Only students can create escalation tickets." }, status: :forbidden
    end

    ticket_input = escalation_ticket_params
    document_request_id = ticket_input[:document_request_id]
    if document_request_id.blank?
      return render json: { errors: ["Document request is required."] }, status: :unprocessable_entity
    end

    document_request = current_user.document_requests.find(document_request_id)
    existing_ticket = EscalationTicket.find_by(document_request_id: document_request.id)
    if existing_ticket.present?
      return render json: ticket_detail_json(existing_ticket), status: :ok
    end

    ticket = nil
    EscalationTicket.transaction do
      ticket = current_user.escalation_tickets.create!(
        subject: ticket_input[:subject],
        document_request: document_request
      )

      if ticket_input[:message].present?
        ticket.escalation_messages.create!(
          sender: current_user,
          body: ticket_input[:message]
        )
      end
    end

    ticket = ticket.reload
    broadcast_ticket_created!(ticket)
    latest_message = ticket.escalation_messages.order(created_at: :desc).first
    broadcast_message_created!(ticket, latest_message) if latest_message.present?

    render json: ticket_detail_json(ticket), status: :created
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Document request not found" }, status: :not_found
  rescue ActiveRecord::RecordNotUnique
    document_request = current_user.document_requests.find(document_request_id)
    existing_ticket = EscalationTicket.find_by!(document_request_id: document_request.id)
    render json: ticket_detail_json(existing_ticket), status: :ok
  rescue ActiveRecord::RecordInvalid => e
    render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
  end

  # PATCH /api/v1/escalation_tickets/:id/close
  def close
    @escalation_ticket.close_by_staff!(current_user)
    @escalation_ticket.reload
    broadcast_ticket_updated!(@escalation_ticket)
    render json: ticket_detail_json(@escalation_ticket)
  rescue ArgumentError => e
    render json: { error: e.message }, status: :forbidden
  end

  # PATCH /api/v1/escalation_tickets/:id/reopen
  def reopen
    @escalation_ticket.reopen_by_staff!(current_user)
    @escalation_ticket.reload
    broadcast_ticket_updated!(@escalation_ticket)
    render json: ticket_detail_json(@escalation_ticket)
  rescue ArgumentError => e
    render json: { error: e.message }, status: :forbidden
  end

  private

  def set_escalation_ticket
    @escalation_ticket = find_ticket_by_id_or_code!
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Escalation ticket not found" }, status: :not_found
  end

  def find_ticket_by_id_or_code!
    scope = escalation_tickets_scope
    raw_id = params[:id].to_s

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

  def authorize_staff!
    return if current_user.is_a?(Staff)

    render json: { error: "Forbidden" }, status: :forbidden
  end

  def escalation_ticket_params
    params.require(:escalation_ticket).permit(:subject, :message, :document_request_id)
  end

  def ticket_summary_json(ticket)
    latest = ticket.escalation_messages.order(created_at: :desc).first

    {
      id: ticket.id,
      ticket_code: ticket.ticket_code,
      subject: ticket.subject,
      document_request: {
        id: ticket.document_request_id,
        request_id: ticket.document_request&.request_id
      },
      status: ticket.status,
      student: {
        id: ticket.student_id,
        full_name: ticket.student.full_name
      },
      latest_message_preview: latest&.body&.truncate(100),
      latest_message_at: latest&.created_at || ticket.last_message_at,
      assigned_staff: ticket.assigned_staff ? {
        id: ticket.assigned_staff.id,
        full_name: ticket.assigned_staff.full_name
      } : nil,
      closed_at: ticket.closed_at,
      created_at: ticket.created_at,
      updated_at: ticket.updated_at
    }
  end

  def ticket_detail_json(ticket)
    {
      id: ticket.id,
      ticket_code: ticket.ticket_code,
      subject: ticket.subject,
      document_request: {
        id: ticket.document_request_id,
        request_id: ticket.document_request&.request_id
      },
      status: ticket.status,
      student: {
        id: ticket.student_id,
        full_name: ticket.student.full_name,
        auth_id: ticket.student.auth_id
      },
      can_chat: ticket.can_chat?(current_user),
      assigned_staff: ticket.assigned_staff ? {
        id: ticket.assigned_staff.id,
        full_name: ticket.assigned_staff.full_name
      } : nil,
      closed_at: ticket.closed_at,
      closed_by: ticket.closed_by ? {
        id: ticket.closed_by.id,
        full_name: ticket.closed_by.full_name
      } : nil,
      created_at: ticket.created_at,
      updated_at: ticket.updated_at,
      messages: ticket.escalation_messages.includes(:sender).map { |message| message_json(message) }
    }
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

  def broadcast_ticket_created!(ticket)
    payload = {
      event: "ticket_created",
      ticket: ticket_summary_json(ticket)
    }

    ActionCable.server.broadcast("escalation_inbox:staff", payload)
    ActionCable.server.broadcast("escalation_inbox:student:#{ticket.student_id}", payload)
  end

  def broadcast_ticket_updated!(ticket)
    payload = {
      event: "ticket_updated",
      ticket: ticket_summary_json(ticket)
    }

    ActionCable.server.broadcast("escalation_inbox:staff", payload)
    ActionCable.server.broadcast("escalation_inbox:student:#{ticket.student_id}", payload)
    ActionCable.server.broadcast("escalation_ticket:#{ticket.id}", payload)
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
