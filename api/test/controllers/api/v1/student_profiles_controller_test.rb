require "test_helper"

class Api::V1::StudentProfilesControllerTest < ActionDispatch::IntegrationTest
  setup do
    # Create users and student profiles with valid data
    @user = students(:student_one)
    @student_profile = @user.student_profile
    @another_user = students(:student_two)
    @another_student_profile = @another_user.student_profile
  end

  # INDEX Tests
  test "should get index" do
    get api_v1_student_profiles_url, as: :json
    assert_response :success

    json_response = JSON.parse(response.body)
    assert_equal 2, json_response.length
  end

  test "index should return all student profiles" do
    get api_v1_student_profiles_url, as: :json

    json_response = JSON.parse(response.body)
    profile_ids = json_response.map { |p| p["id"] }

    assert_includes profile_ids, @student_profile.id
    assert_includes profile_ids, @another_student_profile.id
  end

  # SHOW Tests
  test "should show student profile" do
    get api_v1_student_profile_url(@student_profile), as: :json
    assert_response :success

    json_response = JSON.parse(response.body)
    assert_equal @student_profile.id, json_response["id"]
    assert_equal @student_profile.contact_number, json_response["contact_number"]
    assert_equal @student_profile.civil_status, json_response["civil_status"]
  end

  test "should return not found for non-existent student profile" do
    get api_v1_student_profile_url(id: 999999), as: :json
    assert_response :not_found

    json_response = JSON.parse(response.body)
    assert_empty json_response
  end

  test "should update student profile" do
    patch api_v1_student_profile_url(@student_profile),
          params: {
            student_profile: {
              civil_status: "married",
              contact_number: "09111222333",
              city_municipality: "Mandaue City"
            }
          },
          as: :json

    assert_response :success

    json_response = JSON.parse(response.body)
    assert_equal "married", json_response["civil_status"]
    assert_equal "09111222333", json_response["contact_number"]
    assert_equal "Mandaue City", json_response["city_municipality"]

    # Verify the database was updated
    @student_profile.reload
    assert_equal "married", @student_profile.civil_status
    assert_equal "09111222333", @student_profile.contact_number
  end

  test "should update with partial attributes" do
    original_civil_status = @student_profile.civil_status

    patch api_v1_student_profile_url(@student_profile),
          params: {
            student_profile: {
              contact_number: "09555666777"
            }
          },
          as: :json

    assert_response :success

    @student_profile.reload
    assert_equal "09555666777", @student_profile.contact_number
    # Other attributes should remain unchanged
    assert_equal original_civil_status, @student_profile.civil_status
  end

  test "should return unprocessable_entity for missing required fields" do
    patch api_v1_student_profile_url(@student_profile),
          params: {
            student_profile: {
              school_level: nil # Required field
            }
          },
          as: :json

    assert_response :unprocessable_entity

    json_response = JSON.parse(response.body)
    assert json_response.key?("school_level") || json_response.key?("errors")
  end

  test "should return unprocessable_entity for invalid enum value" do
    patch api_v1_student_profile_url(@student_profile),
          params: {
            student_profile: {
              civil_status: "invalid_status" # Not in enum
            }
          },
          as: :json

    assert_response :unprocessable_entity
  end

  test "should return not found when updating non-existent profile" do
    patch api_v1_student_profile_url(id: 999999),
          params: {
            student_profile: {
              civil_status: "married"
            }
          },
          as: :json

    assert_response :not_found
  end

  test "should update college student profile fields" do
    patch api_v1_student_profile_url(@student_profile),
          params: {
            student_profile: {
              school_level: "college",
              year_level: "4th",
              course: "bachelor_of_science_in_information_technology",
              department: "computer_studies"
            }
          },
          as: :json

    assert_response :success

    @student_profile.reload
    assert_equal "college", @student_profile.school_level
    assert_equal "4th", @student_profile.year_level
    assert_equal "bachelor_of_science_in_information_technology", @student_profile.course
    assert_equal "computer_studies", @student_profile.department
  end

  test "should return unprocessable_entity for invalid course-department combination" do
    patch api_v1_student_profile_url(@student_profile),
          params: {
            student_profile: {
              school_level: "college",
              course: "bachelor_of_science_in_information_technology",
              department: "business" # Wrong department for this course
            }
          },
          as: :json

    assert_response :unprocessable_entity

    json_response = JSON.parse(response.body)
    assert json_response.key?("course") || json_response.key?("errors")
  end

  test "should return unprocessable_entity for invalid college year level" do
    patch api_v1_student_profile_url(@student_profile),
          params: {
            student_profile: {
              school_level: "college",
              year_level: "11" # Invalid for college
            }
          },
          as: :json

    assert_response :unprocessable_entity

    json_response = JSON.parse(response.body)
    assert json_response.key?("year_level") || json_response.key?("errors")
  end

  test "should update senior high student profile fields" do
    patch api_v1_student_profile_url(@another_student_profile),
          params: {
            student_profile: {
              school_level: "senior_high",
              year_level: "11",
              strand: "ABM",
              track: "academic_track"
            }
          },
          as: :json

    assert_response :success

    @another_student_profile.reload
    assert_equal "senior_high", @another_student_profile.school_level
    assert_equal "11", @another_student_profile.year_level
    assert_equal "ABM", @another_student_profile.strand
    assert_equal "academic_track", @another_student_profile.track
  end

  test "should return unprocessable_entity for invalid strand-track combination" do
    patch api_v1_student_profile_url(@another_student_profile),
          params: {
            student_profile: {
              school_level: "senior_high",
              strand: "ABM",
              track: "technical_vocational_livelihood" # Wrong track for ABM
            }
          },
          as: :json

    assert_response :unprocessable_entity

    json_response = JSON.parse(response.body)
    assert json_response.key?("strand") || json_response.key?("errors")
  end

  test "should return unprocessable_entity for invalid senior high year level" do
    patch api_v1_student_profile_url(@another_student_profile),
          params: {
            student_profile: {
              school_level: "senior_high",
              year_level: "1st" # Invalid for senior high
            }
          },
          as: :json

    assert_response :unprocessable_entity

    json_response = JSON.parse(response.body)
    assert json_response.key?("year_level") || json_response.key?("errors")
  end

  test "should update address fields" do
    patch api_v1_student_profile_url(@student_profile),
          params: {
            student_profile: {
              house_number: "789",
              street_name: "New Street",
              barangay_name: "Barangay 3",
              city_municipality: "Lapu-Lapu City",
              province: "Cebu"
            }
          },
          as: :json

    assert_response :success

    @student_profile.reload
    assert_equal "789", @student_profile.house_number
    assert_equal "New Street", @student_profile.street_name
    assert_equal "Lapu-Lapu City", @student_profile.city_municipality
  end

  test "should update personal information fields" do
    patch api_v1_student_profile_url(@student_profile),
          params: {
            student_profile: {
              sex: "female",
              birthday: "2001-03-25",
              place_of_birth: "Cebu City",
              citizenship: "Filipino",
              religion: "Islam"
            }
          },
          as: :json

    assert_response :success

    @student_profile.reload
    assert_equal "female", @student_profile.sex
    assert_equal Date.parse("2001-03-25"), @student_profile.birthday
    assert_equal "Islam", @student_profile.religion
  end

  test "should update civil status enum" do
    patch api_v1_student_profile_url(@student_profile),
          params: {
            student_profile: {
              civil_status: "widower"
            }
          },
          as: :json

    assert_response :success

    @student_profile.reload
    assert_equal "widower", @student_profile.civil_status
  end

  test "should update status enum" do
    patch api_v1_student_profile_url(@student_profile),
          params: {
            student_profile: {
              status: "transferee"
            }
          },
          as: :json

    assert_response :success

    @student_profile.reload
    assert_equal "transferee", @student_profile.status
  end

  test "should not allow updating with unpermitted parameters" do
    # Attempt to update with a parameter not in the whitelist
    original_id = @student_profile.id
    original_created_at = @student_profile.created_at

    patch api_v1_student_profile_url(@student_profile),
          params: {
            student_profile: {
              id: 999,
              created_at: 1.year.ago,
              contact_number: "09888999000"
            }
          },
          as: :json

    @student_profile.reload
    # ID and created_at should not change (strong parameters protection)
    assert_equal original_id, @student_profile.id
    assert_equal original_created_at.to_i, @student_profile.created_at.to_i
    # But permitted parameter should update
    assert_equal "09888999000", @student_profile.contact_number
  end

  test "should update with nested previous_schools attributes" do
    patch api_v1_student_profile_url(@student_profile),
          params: {
            student_profile: {
              previous_schools_attributes: [
                {
                  id: @student_profile.previous_schools.first.id,
                  school_type: "senior_high",
                  school_name: "Test Senior High"
                }
              ]
            }
          },
          as: :json

    assert_response :success

    @student_profile.reload
    assert_equal 2, @student_profile.previous_schools.count
    assert_equal "Test Senior High", @student_profile.previous_schools.first.school_name
  end

  test "should validate invalid course for college level" do
    patch api_v1_student_profile_url(@student_profile),
          params: {
            student_profile: {
              school_level: "college",
              course: "invalid_course_name",
              department: "computer_studies"
            }
          },
          as: :json

    assert_response :unprocessable_entity
  end

  test "should validate invalid strand for senior high level" do
    patch api_v1_student_profile_url(@another_student_profile),
          params: {
            student_profile: {
              school_level: "senior_high",
              strand: "invalid_strand",
              track: "academic_track"
            }
          },
          as: :json

    assert_response :unprocessable_entity
  end

  test "should validate all valid civil status values" do
    %w[single married widower separated].each do |status|
      patch api_v1_student_profile_url(@student_profile),
            params: {
              student_profile: {
                civil_status: status
              }
            },
            as: :json

      assert_response :success
      @student_profile.reload
      assert_equal status, @student_profile.civil_status
    end
  end

  test "should validate all valid status enum values" do
    %w[currently_enrolled transferee returnee graduated].each do |status|
      patch api_v1_student_profile_url(@student_profile),
            params: {
              student_profile: {
                status: status
              }
            },
            as: :json

      assert_response :success
      @student_profile.reload
      assert_equal status, @student_profile.status
    end
  end
end
