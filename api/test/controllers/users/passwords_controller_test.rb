require "test_helper"

class Users::PasswordsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @student = students(:student_one)
    @original_frontend_url = ENV["FRONTEND_URL"]
    ENV["FRONTEND_URL"] = "http://localhost:3000"
    ActionMailer::Base.deliveries.clear
  end

  teardown do
    ENV["FRONTEND_URL"] = @original_frontend_url
  end

  test "should send reset password instructions to frontend url" do
    post "/api/v1/users/password",
         params: {
           user: {
             email: @student.email
           }
         },
         as: :json

    assert_response :success

    @student.reload
    assert @student.reset_password_token.present?

    mail = ActionMailer::Base.deliveries.last
    assert_not_nil mail
    assert_equal [@student.email], mail.to
    assert_includes mail.body.encoded, "http://localhost:3000/reset-password?"
    assert_includes mail.body.encoded, "reset_password_token="
    assert_includes mail.body.encoded, "type=student"
  end

  test "should reset password with valid token" do
    raw_token, encrypted_token = Devise.token_generator.generate(User, :reset_password_token)
    @student.update_columns(
      claimed: false,
      reset_password_token: encrypted_token,
      reset_password_sent_at: Time.current
    )

    put "/api/v1/users/password",
        params: {
          user: {
            reset_password_token: raw_token,
            password: "newpassword123",
            password_confirmation: "newpassword123"
          }
        },
        as: :json

    assert_response :success
    @student.reload
    assert @student.valid_password?("newpassword123")
    assert_equal true, @student.claimed
  end
end
