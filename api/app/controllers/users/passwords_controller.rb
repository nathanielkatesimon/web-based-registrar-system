# frozen_string_literal: true

class Users::PasswordsController < Devise::PasswordsController
  respond_to :json
  skip_before_action :verify_authenticity_token, only: %i[create update]

  def create
    self.resource = resource_class.send_reset_password_instructions(create_resource_params)

    if successfully_sent?(resource)
      render json: { message: I18n.t("devise.passwords.send_instructions") }, status: :ok
    else
      render json: { errors: resource.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    self.resource = resource_class.reset_password_by_token(update_resource_params)

    if resource.errors.empty?
      resource.update_column(:claimed, true) if resource.is_a?(Student) && !resource.claimed?
      render json: { message: I18n.t("devise.passwords.updated_not_active") }, status: :ok
    else
      render json: { errors: resource.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def create_resource_params
    params.require(:user).permit(:email)
  end

  def update_resource_params
    params.require(:user).permit(:reset_password_token, :password, :password_confirmation)
  end
end
