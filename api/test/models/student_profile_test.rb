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

  test "accepts nested attributes for previous_schools" do
    profile = StudentProfile.new(
      student: students(:student_three),
      previous_schools_attributes: [
        {
          school_type: 'senior_high',
          school_name: 'Test Senior High',
          academic_year_from: 2020,
          academic_year_to: 2022,
          program: 'STEM'
        },
        {
          school_type: 'college',
          school_name: 'Previous College',
          academic_year_from: 2022,
          academic_year_to: 2023,
          program: 'BS IT'
        }
      ]
    )

    assert profile.valid?
    assert_equal 2, profile.previous_schools.size
  end

  test "rejects blank nested attributes for previous_schools" do
    profile = StudentProfile.new(
      student: students(:student_three),
      previous_schools_attributes: [
        {
          school_type: 'senior_high',
          school_name: 'Test Senior High',
          academic_year_from: 2020,
          academic_year_to: 2022,
          program: 'STEM'
        },
        {
          school_type: '',
          school_name: '',
          academic_year_from: nil,
          academic_year_to: nil,
          program: ''
        }
      ]
    )

    assert_equal 1, profile.previous_schools.size
  end

  test "allows destroy on nested previous_schools" do
    profile = StudentProfile.create!(
      student: students(:student_three),
      previous_schools_attributes: [
        {
          school_type: 'senior_high',
          school_name: 'Test Senior High',
          program: 'STEM',
          academic_year_from: 2020,
          academic_year_to: 2022
        },
        {
          school_type: 'college',
          school_name: 'Previous College',
          program: 'BS IT',
          academic_year_from: 2022,
          academic_year_to: 2023
        }
      ]
    )

    school_to_destroy = profile.previous_schools.first

    profile.update(
      previous_schools_attributes: [
        { id: school_to_destroy.id, _destroy: '1' }
      ]
    )

    assert_equal 1, profile.previous_schools.reload.size
  end
end
