require "test_helper"
require "stringio"

class Api::V1::StudentsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @student_one = students(:student_one)
    @student_two = students(:student_two)
    @staff_one = staffs(:staff_one)
    @student_one_profile = student_profiles(:one)
    @student_two_profile = student_profiles(:two)
  end

  test "should require authentication for protected actions" do
    get api_v1_students_url, as: :json
    assert_response :unauthorized

    post api_v1_students_url,
         params: {
           student: {
             auth_id: "2026111111111",
             email: "unauthorized-create@example.com",
             first_name: "No",
             last_name: "Auth"
           }
         },
         as: :json
    assert_response :unauthorized

    get api_v1_student_url(@student_one), as: :json
    assert_response :unauthorized

    patch api_v1_student_url(@student_one),
          params: { student: { first_name: "Nope" } },
          as: :json
    assert_response :unauthorized

    delete api_v1_student_url(@student_one), as: :json
    assert_response :unauthorized
  end

  test "should reject student access to index with forbidden" do
    sign_in_as(@student_one)

    get api_v1_students_url, as: :json

    assert_response :forbidden
  end

  test "should allow staff to list students with profiles" do
    sign_in_as(@staff_one)

    get api_v1_students_url, as: :json

    assert_response :success

    json_response = JSON.parse(response.body)
    ids = json_response.map { |record| record["id"] }

    assert_includes ids, @student_one.id
    assert_includes ids, @student_two.id
    assert_not_includes ids, students(:student_three).id
  end

  test "should filter index by year_level, school_level and status" do
    sign_in_as(@staff_one)

    get "#{api_v1_students_url}?year_level=12&school_level=senior_high&status=currently_enrolled",
        as: :json

    assert_response :success

    json_response = JSON.parse(response.body)
    ids = json_response.map { |record| record["id"] }

    assert_equal [@student_two.id], ids
  end

  test "should filter index by course_or_track for course" do
    sign_in_as(@staff_one)

    get "#{api_v1_students_url}?course_or_track=bachelor_of_science_in_computer_science",
        as: :json

    assert_response :success

    json_response = JSON.parse(response.body)
    ids = json_response.map { |record| record["id"] }

    assert_equal [@student_one.id], ids
  end

  test "should filter index by course_or_track for track" do
    sign_in_as(@staff_one)

    get "#{api_v1_students_url}?course_or_track=academic_track",
        as: :json

    assert_response :success

    json_response = JSON.parse(response.body)
    ids = json_response.map { |record| record["id"] }

    assert_equal [@student_two.id], ids
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
    assert_nil json_response["avatar_url"]
    assert_equal false, json_response["incomplete_personal_info"]
    assert_equal false, json_response["incomplete_family_info"]
    assert_equal false, json_response["incomplete_academic_info"]
  end

  test "should flag incomplete_personal_info when required personal fields are missing" do
    @student_one.update_columns(first_name: "")
    @student_one_profile.update_columns(citizenship: nil)
    sign_in_as(@student_one)

    get api_v1_student_url(id: "personal_info"), as: :json

    assert_response :success

    json_response = JSON.parse(response.body)
    assert_equal true, json_response["incomplete_personal_info"]
  end

  test "should flag incomplete_family_info when no family contact is complete" do
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

    get api_v1_student_url(id: "personal_info"), as: :json

    assert_response :success

    json_response = JSON.parse(response.body)
    assert_equal true, json_response["incomplete_family_info"]
  end

  test "should flag incomplete_academic_info when status-specific academic info is blank" do
    @student_one_profile.update_columns(
      year_level: nil,
      course: "",
      department: "",
      strand: "",
      track: "",
      current_senior_high_school_name: "",
      current_senior_high_program: "",
      current_senior_high_year_from: nil,
      current_senior_high_year_to: nil
    )
    sign_in_as(@student_one)

    get api_v1_student_url(id: "personal_info"), as: :json

    assert_response :success

    json_response = JSON.parse(response.body)
    assert_equal true, json_response["incomplete_academic_info"]
  end

  test "should include avatar_url when student has avatar attached" do
    @student_two.avatar.attach(
      io: StringIO.new("fake-avatar-content"),
      filename: "student-two-avatar.png",
      content_type: "image/png"
    )
    sign_in_as(@student_one)

    get api_v1_student_url(@student_two), as: :json

    assert_response :success

    json_response = JSON.parse(response.body)
    assert json_response["avatar_url"].present?
    assert_includes json_response["avatar_url"], "/rails/active_storage"
  end

  test "should create student with nested profile and school slots" do
    sign_in_as(@staff_one)

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
    assert_equal false, student.claimed
    assert_equal "college", student.student_profile.school_level
    assert_equal "ACLC", student.student_profile.current_college_school_name
    assert_equal "Sample Senior High", student.student_profile.current_senior_high_school_name

    json_response = JSON.parse(response.body)
    assert_equal student.id, json_response["id"]
    assert_equal "2026000000001", json_response["auth_id"]
  end

  test "should create student without optional school slots on create" do
    sign_in_as(@staff_one)

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
    assert_equal false, created_student.claimed
    assert_nil created_student.student_profile.current_senior_high_school_name
  end

  test "should return unprocessable_entity when auth_id format is invalid on create" do
    sign_in_as(@staff_one)

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

  test "should reject create when authenticated user is not staff" do
    sign_in_as(@student_one)

    assert_no_difference("Student.count") do
      post api_v1_students_url,
           params: {
             student: {
               auth_id: "2026000000019",
               email: "forbidden-create@example.com",
               first_name: "Forbidden",
               last_name: "Creator"
             }
           },
           as: :json
    end

    assert_response :forbidden
  end

  test "should auto-generate password for staff create when password params are missing" do
    sign_in_as(@staff_one)

    assert_difference("Student.count", 1) do
      post api_v1_students_url,
           params: {
             student: {
               auth_id: "2026000000033",
               email: "autopass.student@example.com",
               first_name: "Auto",
               last_name: "Password",
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
    assert created_student.encrypted_password.present?
    assert_not created_student.valid_password?("")
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
