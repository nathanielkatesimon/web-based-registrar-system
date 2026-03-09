class Api::V1::AuthSessionsController < ApplicationController
  def show
    if user_signed_in?
      render json: {
        user: current_user_payload,
        csrf_token: form_authenticity_token
      }, status: :ok
    else
      render json: { message: "Not signed in" }, status: :unauthorized
    end
  end

  private

  def current_user_payload
    payload = current_user.as_json(
      only: [:id, :auth_id, :type, :first_name, :middle_name, :last_name, :extension],
      methods: [:full_name]
    ).merge(
      avatar_url: current_user.avatar.attached? ? Rails.application.routes.url_helpers.rails_blob_path(current_user.avatar, only_path: true) : nil
    )

    return payload unless current_user.is_a?(Student)

    payload.merge(
      incomplete_personal_info: current_user.incomplete_personal_info?,
      incomplete_family_info: current_user.incomplete_family_info?,
      incomplete_academic_info: current_user.incomplete_academic_info?
    )
  end
end
