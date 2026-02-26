require "test_helper"

class Api::V1::StudentsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @student_one = students(:student_one)
    @student_two = students(:student_two)
    @staff_one = staffs(:staff_one)
    @student_one_profile = student_profiles(:one)
    @student_two_profile = student_profiles(:two)
  end

  test "should require authentication for protected actions" do
    get api_v1_student_url(@student_one), as: :json
    assert_response :unauthorized

    patch api_v1_student_url(@student_one),
          params: { student: { first_name: "Nope" } },
          as: :json
    assert_response :unauthorized

    delete api_v1_student_url(@student_one), as: :json
    assert_response :unauthorized
  end

  test "should show the student matching requested id" do
    sign_in_as(@student_one)

    get api_v1_student_url(@student_two), as: :json

    assert_response :success

    json_response = JSON.parse(response.body)
    assert_equal @student_two.id, json_response["id"]
    assert_equal @student_two.auth_id, json_response["auth_id"]
    assert_equal @student_two.first_name, json_response["first_name"]
    assert_equal @student_two.last_name, json_response["last_name"]

    assert json_response.key?("student_profile")
    assert_equal @student_two_profile.id, json_response["student_profile"]["id"]
  end

  test "should show current_user when id is personal_info" do
    sign_in_as(@student_one)

    get api_v1_student_url(id: "personal_info"), as: :json

    assert_response :success

    json_response = JSON.parse(response.body)
    assert_equal @student_one.id, json_response["id"]
    assert_equal @student_one.auth_id, json_response["auth_id"]
    assert_equal @student_one_profile.id, json_response["student_profile"]["id"]
  end

  test "should create student with nested profile and school slots" do
    assert_difference("Student.count", 1) do
      assert_difference("StudentProfile.count", 1) do
        post api_v1_students_url,
             params: {
               student: {
                 auth_id: "2026000000001",
                 email: "new.student@example.com",
                 password: "password123",
                 password_confirmation: "password123",
                 first_name: "New",
                 middle_name: "Sample",
                 last_name: "Student",
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
                   current_senior_high_school_name: "Sample Senior High",
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
    assert_equal "2026000000001", student.auth_id
    assert_equal "college", student.student_profile.school_level
    assert_equal "ACLC", student.student_profile.current_college_school_name
    assert_equal "Sample Senior High", student.student_profile.current_senior_high_school_name

    json_response = JSON.parse(response.body)
    assert_equal student.id, json_response["id"]
    assert_equal "2026000000001", json_response["auth_id"]
  end

  test "should create student without optional school slots on create" do
    assert_difference("Student.count", 1) do
      post api_v1_students_url,
           params: {
             student: {
               auth_id: "2026000000002",
               email: "invalid.student@example.com",
               password: "password123",
               password_confirmation: "password123",
               first_name: "Invalid",
               last_name: "Student",
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

    created_student = Student.order(:id).last
    assert_equal "2026000000002", created_student.auth_id
    assert_nil created_student.student_profile.current_senior_high_school_name
  end

  test "should return unprocessable_entity when auth_id format is invalid on create" do
    assert_no_difference("Student.count") do
      post api_v1_students_url,
           params: {
             student: {
               auth_id: "shortid",
               email: "invalid-auth@example.com",
               password: "password123",
               password_confirmation: "password123",
               first_name: "Bad",
               last_name: "Auth"
             }
           },
           as: :json
    end

    assert_response :unprocessable_entity

    json_response = JSON.parse(response.body)
    assert json_response.key?("errors")
    assert_includes json_response["errors"].join(" "), "Student USN must be 11 to 13 characters"
  end

  test "should update student basic fields" do
    sign_in_as(@student_one)

    patch api_v1_student_url(@student_two),
          params: {
            student: {
              first_name: "Updated",
              middle_name: "Middle",
              extension: "Jr"
            }
          },
          as: :json

    assert_response :success

    @student_one.reload
    @student_two.reload
    assert_equal "Updated", @student_two.first_name
    assert_equal "Middle", @student_two.middle_name
    assert_equal "Jr", @student_two.extension
    assert_not_equal "Updated", @student_one.first_name
  end

  test "should update nested student_profile fields" do
    sign_in_as(@student_two)

    patch api_v1_student_url(@student_two),
          params: {
            student: {
              student_profile_attributes: {
                id: @student_two_profile.id,
                contact_number: "09119998888",
                city_municipality: "Lapu-Lapu City",
                strand: "ABM",
                track: "academic_track"
              }
            }
          },
          as: :json

    assert_response :success

    @student_two_profile.reload
    @student_one_profile.reload
    assert_equal "09119998888", @student_two_profile.contact_number
    assert_equal "Lapu-Lapu City", @student_two_profile.city_municipality
    assert_equal "ABM", @student_two_profile.strand
    assert_not_equal "09119998888", @student_one_profile.contact_number
  end

  test "should update school slot fields" do
    sign_in_as(@student_one)

    patch api_v1_student_url(@student_two),
          params: {
            student: {
              student_profile_attributes: {
                id: @student_two_profile.id,
                prev_college_school_name: "Transfer College",
                prev_college_program: "bachelor_of_science_in_information_technology",
                prev_college_level: "1st",
                prev_college_year_from: 2023,
                prev_college_year_to: 2024,
                prev_college_department_track: "computer_studies"
              }
            }
          },
          as: :json

    assert_response :success
    @student_two_profile.reload
    assert_equal "Transfer College", @student_two_profile.prev_college_school_name
  end

  test "should filter credential updates when current user is not target student" do
    sign_in_as(@student_one)

    original_email = @student_two.email
    patch api_v1_student_url(@student_two),
          params: {
            student: {
              email: "blocked-change@example.com",
              password: "newpassword123",
              password_confirmation: "newpassword123",
              first_name: "AllowedUpdate"
            }
          },
          as: :json

    assert_response :success

    @student_two.reload
    assert_equal original_email, @student_two.email
    assert_equal "AllowedUpdate", @student_two.first_name
    assert @student_two.valid_password?("password123")
    assert_not @student_two.valid_password?("newpassword123")
  end

  test "should filter credential updates when current user is not a student" do
    sign_in_as(@staff_one)

    original_email = @student_one.email
    patch api_v1_student_url(@student_one),
          params: {
            student: {
              email: "blocked-by-staff@example.com",
              password: "newpassword123",
              password_confirmation: "newpassword123",
              first_name: "UpdatedByStaff"
            }
          },
          as: :json

    assert_response :success

    @student_one.reload
    assert_equal original_email, @student_one.email
    assert_equal "UpdatedByStaff", @student_one.first_name
    assert @student_one.valid_password?("password123")
    assert_not @student_one.valid_password?("newpassword123")
  end

  test "should destroy student matching requested id" do
    student = Student.create!(
      auth_id: "2026000000099",
      email: "to-delete@example.com",
      password: "password123",
      password_confirmation: "password123",
      first_name: "Delete",
      last_name: "Me",
      type: "Student"
    )
    sign_in_as(student)

    assert_difference("Student.count", -1) do
      delete api_v1_student_url(@student_one), as: :json
    end

    assert_response :no_content
    assert_not Student.exists?(@student_one.id)
    assert Student.exists?(student.id)
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
