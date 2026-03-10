class NotificationsChannel < ApplicationCable::Channel
  def subscribed
    reject unless current_user.is_a?(Student)

    stream_from "notifications:student:#{current_user.id}"
  end
end
