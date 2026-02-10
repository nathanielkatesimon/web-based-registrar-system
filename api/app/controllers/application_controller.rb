class ApplicationController < ActionController::API
  include ActionController::Cookies

  respond_to :json

  before_action :configure_permitted_parameters, if: :devise_controller?

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [:auth_id, :password, :password_confirmation])
    devise_parameter_sanitizer.permit(:sign_in, keys: [:auth_id, :password])
  end
end
