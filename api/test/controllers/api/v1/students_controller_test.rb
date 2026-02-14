require "test_helper"

class Api::V1::StudentsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @student_one = students(:student_one)
    @student_two = students(:student_two)
    @student_one_profile = student_profiles(:one)
    @student_two_profile = student_profiles(:two)
  end

  test "should get index" do
    get api_v1_students_url, as: :json

    assert_response :success

    json_response = JSON.parse(response.body)
    assert json_response.key?("students")

    student_ids = json_response["students"].map { |student| student["id"] }
    assert_includes student_ids, @student_one.id
    assert_includes student_ids, @student_two.id
  end

  test "should show student" do
    get api_v1_student_url(@student_one), as: :json

    assert_response :success

    json_response = JSON.parse(response.body)
    assert_equal @student_one.id, json_response["id"]
    assert_equal @student_one.auth_id, json_response["auth_id"]
    assert_equal @student_one.first_name, json_response["first_name"]
    assert_equal @student_one.last_name, json_response["last_name"]

    assert json_response.key?("student_profile")
    assert_equal @student_one_profile.id, json_response["student_profile"]["id"]
  end

  test "should return not found for show when student does not exist" do
    get api_v1_student_url(id: 999_999), as: :json

    assert_response :not_found

    json_response = JSON.parse(response.body)
    assert_equal "Student not found", json_response["error"]
  end

  test "should create student with nested profile and previous schools" do
    assert_difference("Student.count", 1) do
      assert_difference("StudentProfile.count", 1) do
        assert_difference("PreviousSchool.count", 1) do
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
                     previous_schools_attributes: [
                       {
                         school_type: "senior_high",
                         school_name: "Sample Senior High",
                         academic_year_from: 2022,
                         academic_year_to: 2024,
                         program: "STEM"
                       }
                     ]
                   }
                 }
               },
               as: :json
        end
      end
    end

    assert_response :created

    student = Student.order(:id).last
    assert_equal "2026000000001", student.auth_id
    assert_equal "college", student.student_profile.school_level
    assert_equal 1, student.student_profile.previous_schools.count
    assert_equal "senior_high", student.student_profile.previous_schools.first.school_type

    json_response = JSON.parse(response.body)
    assert_equal student.id, json_response["id"]
    assert_equal "2026000000001", json_response["auth_id"]
  end

  test "should create student without previous schools on create" do
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
    assert_equal 0, created_student.student_profile.previous_schools.count
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
    patch api_v1_student_url(@student_one),
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
    assert_equal "Updated", @student_one.first_name
    assert_equal "Middle", @student_one.middle_name
    assert_equal "Jr", @student_one.extension

    json_response = JSON.parse(response.body)
    assert_equal "Updated", json_response["first_name"]
  end

  test "should update nested student_profile fields" do
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
    assert_equal "09119998888", @student_two_profile.contact_number
    assert_equal "Lapu-Lapu City", @student_two_profile.city_municipality
    assert_equal "ABM", @student_two_profile.strand
  end

  test "should destroy previous school via nested attributes on update" do
    previous_school = previous_schools(:three)

    assert_difference("PreviousSchool.count", -1) do
      patch api_v1_student_url(@student_one),
            params: {
              student: {
                student_profile_attributes: {
                  id: @student_one_profile.id,
                  previous_schools_attributes: [
                    {
                      id: previous_school.id,
                      _destroy: true
                    }
                  ]
                }
              }
            },
            as: :json
    end

    assert_response :success
    assert_not PreviousSchool.exists?(previous_school.id)
  end

  test "should return unprocessable_entity for invalid nested update" do
    patch api_v1_student_url(@student_one),
          params: {
            student: {
              student_profile_attributes: {
                id: @student_one_profile.id,
                school_level: "college",
                year_level: "11",
                status: "currently_enrolled",
                department: "computer_studies",
                course: "bachelor_of_science_in_information_technology"
              }
            }
          },
          as: :json

    assert_response :unprocessable_entity

    json_response = JSON.parse(response.body)
    assert json_response.key?("errors")
    assert_includes json_response["errors"].join(" "), "must be 1st, 2nd, 3rd, or 4th for college"
  end

  test "should return not found for update when student does not exist" do
    patch api_v1_student_url(id: 999_999),
          params: {
            student: {
              first_name: "Nope"
            }
          },
          as: :json

    assert_response :not_found

    json_response = JSON.parse(response.body)
    assert_equal "Student not found", json_response["error"]
  end

  test "should destroy student" do
    student = Student.create!(
      auth_id: "2026000000099",
      email: "to-delete@example.com",
      password: "password123",
      password_confirmation: "password123",
      first_name: "Delete",
      last_name: "Me",
      type: "Student"
    )

    assert_difference("Student.count", -1) do
      delete api_v1_student_url(student), as: :json
    end

    assert_response :no_content
  end

  test "should return not found for destroy when student does not exist" do
    delete api_v1_student_url(id: 999_999), as: :json

    assert_response :not_found

    json_response = JSON.parse(response.body)
    assert_equal "Student not found", json_response["error"]
  end
end
