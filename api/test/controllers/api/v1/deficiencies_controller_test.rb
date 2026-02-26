require "test_helper"

class Api::V1::DeficienciesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @student_one = students(:student_one)
    @student_two = students(:student_two)
    @staff_one = staffs(:staff_one)
    @deficiency_one = deficiencies(:one)
    @deficiency_two = deficiencies(:two)
  end

  test "should require authentication for show and update" do
    get api_v1_deficiency_url(@deficiency_one), as: :json
    assert_response :unauthorized

    patch api_v1_deficiency_url(@deficiency_one),
          params: { deficiency: { enrollment_form: "lacking" } },
          as: :json
    assert_response :unauthorized
  end

  test "should show requested deficiency by id" do
    sign_in_as(@student_one)

    get api_v1_deficiency_url(@deficiency_two), as: :json

    assert_response :success

    json_response = JSON.parse(response.body)
    assert_equal @deficiency_two.id, json_response["id"]
    assert_equal @deficiency_two.user_id, json_response["user_id"]
  end

  test "should show current student deficiency when id is personal_info" do
    sign_in_as(@student_one)

    get api_v1_deficiency_url(id: "personal_info"), as: :json

    assert_response :success

    json_response = JSON.parse(response.body)
    assert_equal @deficiency_one.id, json_response["id"]
    assert_equal @student_one.id, json_response["user_id"]
  end

  test "should return not_found for personal_info when current_user is staff" do
    sign_in_as(@staff_one)

    get api_v1_deficiency_url(id: "personal_info"), as: :json

    assert_response :not_found
  end

  test "should allow staff to update deficiency" do
    sign_in_as(@staff_one)

    patch api_v1_deficiency_url(@deficiency_one),
          params: {
            deficiency: {
              enrollment_form: "lacking",
              form_138: "complied"
            }
          },
          as: :json

    assert_response :success

    @deficiency_one.reload
    assert_equal "lacking", @deficiency_one.enrollment_form
    assert_equal "complied", @deficiency_one.form_138
  end

  test "should reject student update with forbidden" do
    sign_in_as(@student_one)

    patch api_v1_deficiency_url(@deficiency_two),
          params: { deficiency: { transcript_of_records: "complied" } },
          as: :json

    assert_response :forbidden
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
