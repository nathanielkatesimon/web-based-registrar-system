require "test_helper"

class StudentProfilesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @student_profile = student_profiles(:one)
  end

  test "should get index" do
    get student_profiles_url, as: :json
    assert_response :success
  end

  test "should create student_profile" do
    assert_difference("StudentProfile.count") do
      post student_profiles_url, params: { student_profile: { barangay_name: @student_profile.barangay_name, birthday: @student_profile.birthday, citizenship: @student_profile.citizenship, city_municipality: @student_profile.city_municipality, civil_status: @student_profile.civil_status, contact_number: @student_profile.contact_number, course: @student_profile.course, department: @student_profile.department, house_number: @student_profile.house_number, place_of_birth: @student_profile.place_of_birth, province: @student_profile.province, religion: @student_profile.religion, school_level: @student_profile.school_level, sex: @student_profile.sex, status: @student_profile.status, strand: @student_profile.strand, street_name: @student_profile.street_name, track: @student_profile.track, user_id: @student_profile.user_id, year_level: @student_profile.year_level } }, as: :json
    end

    assert_response :created
  end

  test "should show student_profile" do
    get student_profile_url(@student_profile), as: :json
    assert_response :success
  end

  test "should update student_profile" do
    patch student_profile_url(@student_profile), params: { student_profile: { barangay_name: @student_profile.barangay_name, birthday: @student_profile.birthday, citizenship: @student_profile.citizenship, city_municipality: @student_profile.city_municipality, civil_status: @student_profile.civil_status, contact_number: @student_profile.contact_number, course: @student_profile.course, department: @student_profile.department, house_number: @student_profile.house_number, place_of_birth: @student_profile.place_of_birth, province: @student_profile.province, religion: @student_profile.religion, school_level: @student_profile.school_level, sex: @student_profile.sex, status: @student_profile.status, strand: @student_profile.strand, street_name: @student_profile.street_name, track: @student_profile.track, user_id: @student_profile.user_id, year_level: @student_profile.year_level } }, as: :json
    assert_response :success
  end

  test "should destroy student_profile" do
    assert_difference("StudentProfile.count", -1) do
      delete student_profile_url(@student_profile), as: :json
    end

    assert_response :no_content
  end
end
