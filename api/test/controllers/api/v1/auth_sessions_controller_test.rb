require "test_helper"
require "stringio"

class Api::V1::AuthSessionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @student_one = students(:student_one)
  end

  test "should return unauthorized when user is not signed in" do
    get "/api/v1/auth/session", as: :json

    assert_response :unauthorized

    json_response = JSON.parse(response.body)
    assert_equal "Not signed in", json_response["message"]
  end

  test "should return current user payload with csrf token when signed in" do
    sign_in_as(@student_one)

    get "/api/v1/auth/session", as: :json

    assert_response :success

    json_response = JSON.parse(response.body)
    user_payload = json_response["user"]
    assert user_payload.present?
    assert_equal @student_one.id, user_payload["id"]
    assert_equal @student_one.auth_id, user_payload["auth_id"]
    assert_equal "Student", user_payload["type"]
    assert_equal @student_one.first_name, user_payload["first_name"]
    assert_equal @student_one.middle_name, user_payload["middle_name"]
    assert_equal @student_one.last_name, user_payload["last_name"]
    assert_equal @student_one.extension, user_payload["extension"]
    assert_equal @student_one.full_name, user_payload["full_name"]
    assert_nil user_payload["avatar_url"]
    assert_equal false, user_payload["incomplete_personal_info"]
    assert_equal false, user_payload["incomplete_family_info"]
    assert_equal false, user_payload["incomplete_academic_info"]
    assert json_response["csrf_token"].present?
  end

  test "should include completeness flags in session payload for student" do
    @student_one.update_columns(first_name: "")
    student_profiles(:one).update_columns(year_level: nil, course: "", department: "", strand: "", track: "")
    family_infos(:one).update_columns(
      father_first_name: "",
      father_last_name: "",
      father_contact_number: "",
      father_email_address: "",
      mother_first_name: "",
      mother_last_name: "",
      mother_contact_number: "",
      mother_email_address: "",
      guardian_first_name: "",
      guardian_last_name: "",
      guardian_contact_number: "",
      guardian_email_address: ""
    )

    sign_in_as(@student_one)
    get "/api/v1/auth/session", as: :json

    assert_response :success

    user_payload = JSON.parse(response.body)["user"]
    assert_equal true, user_payload["incomplete_personal_info"]
    assert_equal true, user_payload["incomplete_family_info"]
    assert_equal true, user_payload["incomplete_academic_info"]
  end

  test "should include avatar_url in current user payload when avatar is attached" do
    @student_one.avatar.attach(
      io: StringIO.new("fake-avatar-content"),
      filename: "student-one-avatar.png",
      content_type: "image/png"
    )
    sign_in_as(@student_one)

    get "/api/v1/auth/session", as: :json

    assert_response :success

    json_response = JSON.parse(response.body)
    assert json_response["user"]["avatar_url"].present?
    assert_includes json_response["user"]["avatar_url"], "/rails/active_storage"
  end

  private

  def sign_in_as(user)
    post "/api/v1/users/sign_in",
         params: {
           user: {
             auth_id: user.auth_id,
             password: "password123"
           }
         },
         as: :json

    assert_response :success
  end
end
