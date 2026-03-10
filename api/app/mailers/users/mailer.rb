# frozen_string_literal: true

require "uri"

class Users::Mailer < Devise::Mailer
  default template_path: "users/mailer"

  def reset_password_instructions(record, token, opts = {})
    @reset_password_url = build_frontend_password_url(record, token)
    super
  end

  def account_claim_instructions(record, token, opts = {})
    @resource = record
    @claim_account_url = build_frontend_password_url(record, token, mode: "claim")
    devise_mail(record, :account_claim_instructions, opts.merge(subject: "Create your password"))
  end

  private

  def build_frontend_password_url(record, token, mode: nil)
    frontend_url = ENV.fetch("FRONTEND_URL", "http://localhost:3000").chomp("/")
    query = {
      reset_password_token: token,
      type: record.type.to_s.downcase,
      mode: mode
    }.compact

    "#{frontend_url}/reset-password?#{URI.encode_www_form(query)}"
  end
end
