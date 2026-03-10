# frozen_string_literal: true

require "uri"

class Users::Mailer < Devise::Mailer
  default template_path: "users/mailer"

  def reset_password_instructions(record, token, opts = {})
    @reset_password_url = build_frontend_reset_password_url(record, token)
    super
  end

  private

  def build_frontend_reset_password_url(record, token)
    frontend_url = ENV.fetch("FRONTEND_URL", "http://localhost:3000").chomp("/")
    query = {
      reset_password_token: token,
      type: record.type.to_s.downcase
    }.compact

    "#{frontend_url}/reset-password?#{URI.encode_www_form(query)}"
  end
end
