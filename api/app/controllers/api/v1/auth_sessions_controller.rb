class Api::V1::AuthSessionsController < ApplicationController
  def show
    if user_signed_in?
      render json: {
        user: current_user.as_json(only: [:id, :auth_id, :type]),
        csrf_token: form_authenticity_token
      }, status: :ok
    else
      render json: { message: "Not signed in" }, status: :unauthorized
    end
  end
end
