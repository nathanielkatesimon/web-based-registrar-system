class Api::V1::StaffRegistrationsController < Devise::RegistrationsController
  prepend_before_action :reject_authenticated_user, only: [:create]
  prepend_before_action :set_minimum_password_length, only: []
  skip_before_action :verify_authenticity_token, only: [:create]

  def create
    build_resource(sign_up_params.merge(type: "Staff"))

    resource.save
    yield resource if block_given?
    if resource.persisted?
      if resource.active_for_authentication?
        sign_up(resource_name, resource)
        respond_with resource, location: after_sign_up_path_for(resource)
      else
        expire_data_after_sign_in!
        respond_with resource, location: after_inactive_sign_up_path_for(resource)
      end
    else
      clean_up_passwords resource
      set_minimum_password_length
      respond_with resource
    end
  end

  private

  def reject_authenticated_user
    return unless user_signed_in?

    render json: { message: I18n.t("devise.failure.already_authenticated") }, status: :ok
  end

  def sign_up_params
    params.require(:user).permit(
      :email,
      :password,
      :password_confirmation,
      :auth_id,
      :first_name,
      :middle_name,
      :last_name,
      :extension
    )
  end

  def respond_with(resource, _opts = {})
    if resource.persisted?
      render json: {
        user: resource.as_json(only: [:id, :auth_id, :type])
      }, status: :created
    else
      render json: {
        errors: resource.errors.full_messages
      }, status: :unprocessable_entity
    end
  end
end
