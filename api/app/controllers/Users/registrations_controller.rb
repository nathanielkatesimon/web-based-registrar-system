# frozen_string_literal: true
# This controller is a customized version of Devise's default RegistrationsController.
# Devise normally provides HTML pages and endpoints for signing up, editing profiles,
# and managing accounts. In an API-based setup (with a frontend like Next.js),
# those browser-based features are not needed.
#
# This controller converts Devise’s registration system into a JSON-only API
# focused solely on user creation (sign-up).
#
# What this controller does:
#
# - Disables Devise’s default UI and account-management endpoints
#   (`new`, `edit`, `cancel`, `update`, `destroy`) by returning 404 Not Found.
#   These routes normally handle profile updates and account deletion.
#
# - Profile updates and account management are intentionally removed here
#   and are handled instead by a dedicated ProfilesController.
#   This keeps authentication and user profile logic clearly separated.
#
# - Keeps the routes available internally so Devise can still function properly,
#   while preventing direct client access to unused endpoints.
#
# - Overrides `create` to support API-based user registration.
#   When a user signs up:
#   - If successful, it returns the user ID and auth_id in JSON format.
#   - If failed, it returns validation errors in JSON.
#
# - Overrides `respond_with` to remove redirects and always return JSON responses.
#
# Why we have this:
# - The default Devise registration flow assumes HTML forms and redirects.
# - This application uses a frontend client, so registration must work via JSON.
# - Separating registration from profile management improves maintainability
#   and keeps responsibilities clear.
#
# In short: this controller provides an API-only signup endpoint using Devise,
# disables all built-in account management features, and delegates profile logic
# to a dedicated controller.
class Users::RegistrationsController < Devise::RegistrationsController
  prepend_before_action :require_no_authentication, only: [:create]
  prepend_before_action :authenticate_scope!, only: []
  prepend_before_action :set_minimum_password_length, only: []

  def new
    head :not_found
  end

  def edit
    head :not_found
  end

  def cancel
    head :not_found
  end

  def update
    head :not_found
  end

  def destroy
    head :not_found
  end

  # POST /resource
  def create
    build_resource(sign_up_params)

    resource.save
    yield resource if block_given?
    if resource.persisted?
      if resource.active_for_authentication?
        # set_flash_message! :notice, :signed_up
        sign_up(resource_name, resource)
        respond_with resource, location: after_sign_up_path_for(resource)
      else
        # set_flash_message! :notice, :"signed_up_but_#{resource.inactive_message}"
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

  def respond_with(resource, _opts = {})
    if resource.persisted?
      render json: {
        user: resource.as_json(:only => [:id, :auth_id])
      }, status: :created
    else
      render json: {
        errors: resource.errors.full_messages
      }, status: :unprocessable_entity
    end
  end
end
