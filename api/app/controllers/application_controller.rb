class ApplicationController < ActionController::API
  include ActionController::Cookies
  include ActionController::RequestForgeryProtection

  self.allow_forgery_protection = !Rails.env.test?
  protect_from_forgery with: :exception
  before_action :configure_permitted_parameters, if: :devise_controller?
  respond_to :json

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [:auth_id, :password, :password_confirmation])
    devise_parameter_sanitizer.permit(:sign_in, keys: [:auth_id, :password])
  end
end
