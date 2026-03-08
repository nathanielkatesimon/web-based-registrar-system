class EscalationInboxChannel < ApplicationCable::Channel
  def subscribed
    stream_from inbox_stream_name_for(current_user)
  end

  private

  def inbox_stream_name_for(user)
    return "escalation_inbox:staff" if user.is_a?(Staff)

    "escalation_inbox:student:#{user.id}"
  end
end
