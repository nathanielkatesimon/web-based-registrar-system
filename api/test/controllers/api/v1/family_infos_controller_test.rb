require "test_helper"

class Api::V1::FamilyInfosControllerTest < ActionDispatch::IntegrationTest
  setup do
    @student_one = students(:student_one)
    @student_two = students(:student_two)
    @family_info_one = family_infos(:one)
    @family_info_two = family_infos(:two)
  end

  test "should require authentication for show and update" do
    get api_v1_family_info_url(@family_info_one), as: :json
    assert_response :unauthorized

    patch api_v1_family_info_url(@family_info_one),
          params: { family_info: { father_first_name: "Nope" } },
          as: :json
    assert_response :unauthorized
  end

  test "should show requested family_info" do
    sign_in_as(@student_one)

    get api_v1_family_info_url(@family_info_two), as: :json

    assert_response :success

    json_response = JSON.parse(response.body)
    assert_equal @family_info_two.id, json_response["id"]
    assert_equal @family_info_two.user_id, json_response["user_id"]
  end

  test "should show current_user family_info when id is personal_info" do
    sign_in_as(@student_one)

    get api_v1_family_info_url(id: "personal_info"), as: :json

    assert_response :success

    json_response = JSON.parse(response.body)
    assert_equal @family_info_one.id, json_response["id"]
    assert_equal @student_one.id, json_response["user_id"]
  end

  test "should update family_info fields" do
    sign_in_as(@student_one)

    patch api_v1_family_info_url(@family_info_one),
          params: {
            family_info: {
              father_first_name: "UpdatedFather",
              mother_first_name: "UpdatedMother",
              guardian_contact_number: "09175556666"
            }
          },
          as: :json

    assert_response :success

    @family_info_one.reload
    assert_equal "UpdatedFather", @family_info_one.father_first_name
    assert_equal "UpdatedMother", @family_info_one.mother_first_name
    assert_equal "09175556666", @family_info_one.guardian_contact_number
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
