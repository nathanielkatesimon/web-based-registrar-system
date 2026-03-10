class Api::V1::NotificationsController < ApplicationController
  before_action :authenticate_user!
  before_action :authorize_student!
  before_action :set_notification, only: :read

  def index
    notifications = current_user.notifications.latest_first.limit(10)

    render json: notifications.map(&:as_api_json)
  end

  def read
    @notification.mark_as_read!

    render json: @notification.as_api_json
  end

  private

  def authorize_student!
    return if current_user.is_a?(Student)

    render json: {}, status: :forbidden
  end

  def set_notification
    @notification = current_user.notifications.find(params.expect(:id))
  rescue ActiveRecord::RecordNotFound
    render json: {}, status: :not_found
  end
end
