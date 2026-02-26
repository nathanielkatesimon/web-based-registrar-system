require "test_helper"

class StudentProfileTest < ActiveSupport::TestCase
  test "has valid civil_status enum" do
    profile = StudentProfile.new
    assert_nothing_raised { profile.civil_status = 'single' }
    assert_nothing_raised { profile.civil_status = 'married' }
    assert_nothing_raised { profile.civil_status = 'widower' }
    assert_nothing_raised { profile.civil_status = 'separated' }
  end

  test "has valid status enum" do
    profile = StudentProfile.new
    assert_nothing_raised { profile.status = 'currently_enrolled' }
    assert_nothing_raised { profile.status = 'transferee' }
    assert_nothing_raised { profile.status = 'returnee' }
    assert_nothing_raised { profile.status = 'graduated' }
  end

  test "has valid school_level enum" do
    profile = StudentProfile.new
    assert_nothing_raised { profile.school_level = 'college' }
    assert_nothing_raised { profile.school_level = 'senior_high' }
  end

  test "has valid sex enum" do
    profile = StudentProfile.new
    assert_nothing_raised { profile.sex = 'male' }
    assert_nothing_raised { profile.sex = 'female' }
  end

  test "available_courses returns correct courses for department" do
    profile = StudentProfile.new(student: students(:student_three), department: 'computer_studies')

    assert_equal [
      'diploma_in_web_application_technology',
      'bachelor_of_science_in_information_technology',
      'bachelor_of_science_in_computer_science'
    ], profile.available_courses
  end

  test "available_courses returns empty array without department" do
    profile = StudentProfile.new
    assert_equal [], profile.available_courses
  end

  test "available_strands returns correct strands for track" do
    profile = StudentProfile.new(student: students(:student_three), track: 'academic_track')

    assert_equal %w[STEM ABM HUMSS GA], profile.available_strands
  end

  test "available_strands returns empty array without track" do
    profile = StudentProfile.new
    assert_equal [], profile.available_strands
  end

  test "full_address concatenates address fields" do
    profile = StudentProfile.new(
      student: students(:student_three),
      house_number: '123',
      street_name: 'Main St',
      barangay_name: 'Poblacion',
      city_municipality: 'Cebu City',
      province: 'Cebu'
    )

    assert_equal '123, Main St, Poblacion, Cebu City, Cebu', profile.full_address
  end

  test "full_address handles nil fields" do
    profile = StudentProfile.new(
      student: students(:student_three),
      street_name: 'Main St',
      city_municipality: 'Cebu City'
    )

    assert_equal 'Main St, Cebu City', profile.full_address
  end

  test "supports school slots for college and senior high" do
    profile = StudentProfile.new(
      student: students(:student_three),
      current_college_school_name: "ACLC",
      current_college_program: "bachelor_of_science_in_information_technology",
      current_college_level: "2nd",
      current_college_year_from: 2024,
      current_college_year_to: 2025,
      current_college_department_track: "computer_studies",
      current_senior_high_school_name: "Sample SHS",
      current_senior_high_program: "STEM",
      current_senior_high_level: "12",
      current_senior_high_year_from: 2022,
      current_senior_high_year_to: 2024,
      current_senior_high_department_track: "academic_track"
    )

    assert profile.valid?
  end

  test "supports previous school slots for transferee history" do
    profile = StudentProfile.new(
      student: students(:student_three),
      status: "transferee",
      school_level: "college",
      prev_college_school_name: "Previous College",
      prev_college_program: "bachelor_of_science_in_information_technology",
      prev_college_level: "1st",
      prev_college_year_from: 2023,
      prev_college_year_to: 2024,
      prev_college_department_track: "computer_studies",
      prev_senior_high_school_name: "Previous SHS",
      prev_senior_high_program: "STEM",
      prev_senior_high_level: "12",
      prev_senior_high_year_from: 2021,
      prev_senior_high_year_to: 2023,
      prev_senior_high_department_track: "academic_track"
    )

    assert profile.valid?
  end
end
