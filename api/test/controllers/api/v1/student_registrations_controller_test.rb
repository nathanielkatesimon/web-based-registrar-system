require "test_helper"

class Api::V1::StudentRegistrationsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @original_frontend_url = ENV["FRONTEND_URL"]
    ENV["FRONTEND_URL"] = "http://localhost:3000"
    ActionMailer::Base.deliveries.clear
  end

  teardown do
    ENV["FRONTEND_URL"] = @original_frontend_url
  end

  test "should create student with nested profile and school slots" do
    assert_difference("Student.count", 1) do
      assert_difference("StudentProfile.count", 1) do
        post "/api/v1/students/registrations",
             params: {
               user: {
                 auth_id: "2026000000999",
                 email: "self.registered.student@example.com",
                 password: "password123",
                 password_confirmation: "password123",
                 first_name: "Self",
                 middle_name: "Sign",
                 last_name: "Up",
                 student_profile_attributes: {
                   school_level: "college",
                   status: "currently_enrolled",
                   year_level: "1st",
                   department: "computer_studies",
                   course: "bachelor_of_science_in_information_technology",
                   current_college_school_name: "ACLC",
                   current_college_program: "bachelor_of_science_in_information_technology",
                   current_college_level: "1st",
                   current_college_department_track: "computer_studies",
                   current_senior_high_school_name: "Self Signup Senior High",
                   current_senior_high_program: "STEM",
                   current_senior_high_level: "12",
                   current_senior_high_year_from: 2022,
                   current_senior_high_year_to: 2024,
                   current_senior_high_department_track: "academic_track"
                 }
               }
             },
             as: :json
      end
    end

    assert_response :created

    student = Student.order(:id).last
    assert_equal "Student", student.type
    assert_equal "2026000000999", student.auth_id
    assert_equal true, student.claimed
    assert_equal "college", student.student_profile.school_level
    assert_equal "ACLC", student.student_profile.current_college_school_name

    json_response = JSON.parse(response.body)
    assert_equal student.id, json_response["user"]["id"]
    assert_equal "Student", json_response["user"]["type"]
    assert_equal student.student_profile.id, json_response["user"]["student_profile"]["id"]
  end

  test "should allow signup when previous school is missing for non-graduated status" do
    assert_difference("Student.count", 1) do
      post "/api/v1/students/registrations",
           params: {
             user: {
               auth_id: "2026000000777",
               email: "invalid.self.registered.student@example.com",
               password: "password123",
               password_confirmation: "password123",
               student_profile_attributes: {
                 school_level: "college",
                 status: "currently_enrolled",
                 year_level: "1st",
                 department: "computer_studies",
                 course: "bachelor_of_science_in_information_technology"
               }
             }
           },
           as: :json
    end

    assert_response :created
  end

  test "should send claim instructions when unclaimed student already exists" do
    generated_password = SecureRandom.alphanumeric(16)
    existing_student = Student.create!(
      auth_id: "2026000000666",
      email: "precreated.student@example.com",
      password: generated_password,
      password_confirmation: generated_password,
      first_name: "Pre",
      last_name: "Created",
      claimed: false
    )

    assert_no_difference("Student.count") do
      post "/api/v1/students/registrations",
           params: {
             user: {
               auth_id: existing_student.auth_id,
               email: existing_student.email,
               password: "password123",
               password_confirmation: "password123",
               first_name: "Pre",
               last_name: "Created"
             }
           },
           as: :json
    end

    assert_response :accepted

    existing_student.reload
    assert existing_student.reset_password_token.present?

    json_response = JSON.parse(response.body)
    assert_equal true, json_response["claim_required"]
    assert_includes json_response["message"], "created by a staff"

    mail = ActionMailer::Base.deliveries.last
    assert_not_nil mail
    assert_equal [existing_student.email], mail.to
    assert_equal "Create your password", mail.subject
    assert_includes mail.body.encoded, "This account was already created by a staff."
    assert_includes mail.body.encoded, "mode=claim"
  end
end
