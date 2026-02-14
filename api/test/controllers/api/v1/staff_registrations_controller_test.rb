require "test_helper"

class Api::V1::StaffRegistrationsControllerTest < ActionDispatch::IntegrationTest
  test "should create staff" do
    assert_difference("Staff.count", 1) do
      post "/api/v1/staffs/registrations",
           params: {
             user: {
               auth_id: "14-2026-011",
               email: "self.registered.staff@example.com",
               password: "password123",
               password_confirmation: "password123",
               first_name: "Self",
               middle_name: "Staff",
               last_name: "Signup"
             }
           },
           as: :json
    end

    assert_response :created

    staff = Staff.order(:id).last
    assert_equal "Staff", staff.type
    assert_equal "14-2026-011", staff.auth_id

    json_response = JSON.parse(response.body)
    assert_equal staff.id, json_response["user"]["id"]
    assert_equal "Staff", json_response["user"]["type"]
  end

  test "should reject invalid staff auth_id format" do
    assert_no_difference("Staff.count") do
      post "/api/v1/staffs/registrations",
           params: {
             user: {
               auth_id: "staff_id_is_too_long",
               email: "invalid.staff.signup@example.com",
               password: "password123",
               password_confirmation: "password123"
             }
           },
           as: :json
    end

    assert_response :unprocessable_entity

    json_response = JSON.parse(response.body)
    assert_includes json_response["errors"].join(" "), "Employee ID invalid"
  end
end
