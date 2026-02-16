# frozen_string_literal: true
# This controller is a customized version of Devise's default SessionsController.
# Devise (https://github.com/heartcombo/devise) is a popular authentication library for Rails that handles sign-up,
# login, and logout out-of-the-box. By default, Devise is designed mostly for
# HTML web applications, but this controller is adapted to support a JSON API,
# which is useful if you're building a mobile app or a frontend in something
# like React, Vue, or Angular that talks to Rails via API calls.
#
# Here's what each action does:
#
# 1. `new` (GET /users/sign_in)
#    - Normally shows a login form in a web app.
#    - Here, it just returns a JSON message telling the client that login is required.
#
# 2. `create` (POST /users/sign_in)
#    - Authenticates a user with their email/password.
#    - If successful, logs the user in and returns a JSON object with their ID and email.
#    - If login fails, returns a JSON error message.
#    - IMPORTANT: Even though this is an API, it still uses cookie-based sessions.
#      This means the browser (or client) will store a session cookie to keep the
#      user logged in for subsequent requests.
#
# 3. `destroy` (DELETE /users/sign_out)
#    - Logs the user out by clearing the session cookie.
#    - Returns an empty JSON response with a "no content" status.
#
# 4. `require_no_authentication` (before action for `create`)
#    - Prevents logged-in users from logging in again.
#    - If the user is already logged in, it returns a JSON message instead of letting
#      them re-login.
#
# Why we have this:
# - Default Devise controllers expect HTML forms and redirects, which aren't suitable for APIs.
# - This version makes Devise API-friendly by always returning JSON responses.
# - We kept cookie-based sessions instead of switching to token-based (JWT) authentication
#   because this API has only one consumer: a Next.js web app.
#   - With a single web app consumer, cookies are simpler to manage and automatically sent
#     with each request.
#   - JWTs are more useful when multiple clients or external apps need to authenticate,
#     or when you want stateless authentication. Here, stateful sessions are simpler.
# - Cookie-based sessions also simplify logout, session expiration, and Devise integration,
#   without needing to manually store or verify tokens on the client.
#
# In short: this controller bridges Devise’s normal HTML login with a JSON API for a single
# web app consumer, using cookie-based sessions to simplify authentication
class Users::SessionsController < Devise::SessionsController
  prepend_before_action :require_no_authentication, only: [:create]
  skip_before_action :verify_authenticity_token, only: [:create, :destroy]
  
  # GET api/v1/resource/sign_in
  def new
    render json: {
      message: "You must sign-in first"
    }, status: :unauthorized
  end

  # POST api/v1/resource/sign_in
  def create
    self.resource = warden.authenticate(auth_options)
    if resource
      sign_in(resource_name, resource)
      render json: {
        user: resource.as_json(:only => [:id, :auth_id])
      }, status: :ok
    else
      render json: { message: "Invalid ID or password" }, status: :unprocessable_entity
    end
  end

  # DELETE api/v1/resource/sign_out
  def destroy
    signed_out = (Devise.sign_out_all_scopes ? sign_out : sign_out(resource_name))
    render json: {}, status: :no_content
  end

  private

  def verify_signed_out_user;end
end
