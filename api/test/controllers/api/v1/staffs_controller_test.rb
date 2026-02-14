require "test_helper"

class Api::V1::StaffsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @staff_one = staffs(:staff_one)
    @staff_two = staffs(:staff_two)
  end

  test "should show staff" do
    get api_v1_staff_url(@staff_one), as: :json

    assert_response :success

    json_response = JSON.parse(response.body)
    assert_equal @staff_one.id, json_response["id"]
    assert_equal @staff_one.type, json_response["type"]
    assert_equal @staff_one.auth_id, json_response["auth_id"]
    assert_equal @staff_one.email, json_response["email"]
    assert_equal @staff_one.first_name, json_response["first_name"]
    assert_equal @staff_one.middle_name, json_response["middle_name"]
    assert_equal @staff_one.last_name, json_response["last_name"]
    assert_equal @staff_one.extension, json_response["extension"]
    assert_equal @staff_one.full_name, json_response["full_name"]
  end

  test "should return not found for show when staff does not exist" do
    get api_v1_staff_url(id: 999_999), as: :json

    assert_response :not_found

    json_response = JSON.parse(response.body)
    assert_equal "Staff not found", json_response["error"]
  end

  test "should create staff" do
    assert_difference("Staff.count", 1) do
      post api_v1_staffs_url,
           params: {
             staff: {
               auth_id: "14-2026-011",
               email: "registrar3@example.com",
               password: "password123",
               password_confirmation: "password123",
               first_name: "Maria",
               middle_name: "Santos",
               last_name: "Lopez",
               extension: "Sr.",
               type: "Student"
             }
           },
           as: :json
    end

    assert_response :created

    staff = Staff.order(:id).last
    assert_equal "Staff", staff.type
    assert_equal "14-2026-011", staff.auth_id
    assert_equal "registrar3@example.com", staff.email
    assert_equal "Maria", staff.first_name

    json_response = JSON.parse(response.body)
    assert_equal staff.id, json_response["id"]
    assert_equal "Staff", json_response["type"]
    assert_equal "14-2026-011", json_response["auth_id"]
  end

  test "should return unprocessable_entity when auth_id format is invalid on create" do
    assert_no_difference("Staff.count") do
      post api_v1_staffs_url,
           params: {
             staff: {
               auth_id: "staff_id_too_long",
               email: "invalid.staff@example.com",
               password: "password123",
               password_confirmation: "password123",
               first_name: "Invalid",
               last_name: "Staff"
             }
           },
           as: :json
    end

    assert_response :unprocessable_entity

    json_response = JSON.parse(response.body)
    assert json_response.key?("errors")
    assert_includes json_response["errors"].join(" "), "Employee ID invalid"
  end

  test "should return unprocessable_entity when email is duplicate on create" do
    assert_no_difference("Staff.count") do
      post api_v1_staffs_url,
           params: {
             staff: {
               auth_id: "staff_004",
               email: @staff_one.email,
               password: "password123",
               password_confirmation: "password123",
               first_name: "Duplicate",
               last_name: "Email"
             }
           },
           as: :json
    end

    assert_response :unprocessable_entity

    json_response = JSON.parse(response.body)
    assert json_response.key?("errors")
    assert_includes json_response["errors"].join(" "), "Email has already been taken"
  end

  test "should update staff" do
    patch api_v1_staff_url(@staff_one),
          params: {
            staff: {
              first_name: "Updated",
              middle_name: "Middle",
              extension: "III"
            }
          },
          as: :json

    assert_response :success

    @staff_one.reload
    assert_equal "Updated", @staff_one.first_name
    assert_equal "Middle", @staff_one.middle_name
    assert_equal "III", @staff_one.extension

    json_response = JSON.parse(response.body)
    assert_equal "Updated", json_response["first_name"]
    assert_equal "Middle", json_response["middle_name"]
    assert_equal "III", json_response["extension"]
  end

  test "should return unprocessable_entity for invalid update" do
    patch api_v1_staff_url(@staff_one),
          params: {
            staff: {
              auth_id: "this_is_longer_than_ten"
            }
          },
          as: :json

    assert_response :unprocessable_entity

    json_response = JSON.parse(response.body)
    assert json_response.key?("errors")
    assert_includes json_response["errors"].join(" "), "Employee ID invalid"
  end

  test "should return not found for update when staff does not exist" do
    patch api_v1_staff_url(id: 999_999),
          params: {
            staff: {
              first_name: "Nope"
            }
          },
          as: :json

    assert_response :not_found

    json_response = JSON.parse(response.body)
    assert_equal "Staff not found", json_response["error"]
  end

  test "should destroy staff" do
    staff = Staff.create!(
      auth_id: "14-2026-011",
      email: "to-delete-staff@example.com",
      password: "password123",
      password_confirmation: "password123",
      first_name: "Delete",
      last_name: "Me",
      type: "Staff"
    )

    assert_difference("Staff.count", -1) do
      delete api_v1_staff_url(staff), as: :json
    end

    assert_response :no_content
  end

  test "should return not found for destroy when staff does not exist" do
    delete api_v1_staff_url(id: 999_999), as: :json

    assert_response :not_found

    json_response = JSON.parse(response.body)
    assert_equal "Staff not found", json_response["error"]
  end
end
