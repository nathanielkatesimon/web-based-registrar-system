require "test_helper"

class StudentProfileTest < ActiveSupport::TestCase
  # Enum tests
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

  # Presence validations
  test "requires school_level" do
    profile = StudentProfile.new(student: students(:student_three), status: 'currently_enrolled', year_level: '1st')
    assert_not profile.valid?
    assert_includes profile.errors[:school_level], "can't be blank"
  end

  test "requires status" do
    profile = StudentProfile.new(student: students(:student_three), school_level: 'college', year_level: '1st')
    assert_not profile.valid?
    assert_includes profile.errors[:status], "can't be blank"
  end

  test "requires year_level" do
    profile = StudentProfile.new(student: students(:student_three), school_level: 'college', status: 'currently_enrolled')
    assert_not profile.valid?
    assert_includes profile.errors[:year_level], "can't be blank"
  end

  # College course validations
  test "college requires valid course" do
    profile = StudentProfile.new(
      student: students(:student_three),
      school_level: 'college',
      status: 'currently_enrolled',
      year_level: '1st',
      department: 'computer_studies',
      course: 'invalid_course'
    )

    assert_not profile.valid?
    assert_includes profile.errors[:course], "is not included in the list"
  end

  test "college accepts valid courses" do
    profile = StudentProfile.new(
      student: students(:student_three),
      school_level: 'college',
      status: 'currently_enrolled',
      year_level: '1st',
      department: 'computer_studies',
      course: 'bachelor_of_science_in_information_technology'
    )

    profile.previous_schools.build(
      school_type: 'senior_high',
      school_name: 'Test High School',
      program: "STEM",
      academic_year_from: 2020,
      academic_year_to: 2022
    )

    assert profile.valid?
  end

  test "college requires valid department" do
    profile = StudentProfile.new(
      student: students(:student_three),
      school_level: 'college',
      status: 'currently_enrolled',
      year_level: '1st',
      department: 'invalid_department',
      course: 'bachelor_of_science_in_information_technology'
    )

    assert_not profile.valid?
    assert_includes profile.errors[:department], "is not included in the list"
  end

  # Senior high strand validations
  test "senior high requires valid strand" do
    profile = StudentProfile.new(
      student: students(:student_three),
      school_level: 'senior_high',
      status: 'currently_enrolled',
      year_level: '11',
      track: 'academic_track',
      strand: 'invalid_strand'
    )

    assert_not profile.valid?
    assert_includes profile.errors[:strand], "is not included in the list"
  end

  test "senior high accepts valid strands" do
    profile = StudentProfile.new(
      student: students(:student_three),
      school_level: 'senior_high',
      status: 'currently_enrolled',
      year_level: '11',
      track: 'academic_track',
      strand: 'STEM'
    )

    assert profile.valid?
  end

  test "senior high requires valid track" do
    profile = StudentProfile.new(
      student: students(:student_three),
      school_level: 'senior_high',
      status: 'currently_enrolled',
      year_level: '11',
      track: 'invalid_track',
      strand: 'STEM'
    )

    assert_not profile.valid?
    assert_includes profile.errors[:track], "is not included in the list"
  end

  # year_level_matches_school_level validation
  test "college requires year level 1st, 2nd, 3rd, or 4th" do
    profile = StudentProfile.new(
      student: students(:student_three),
      school_level: 'college',
      status: 'currently_enrolled',
      year_level: '11',
      department: 'computer_studies',
      course: 'bachelor_of_science_in_information_technology'
    )

    assert_not profile.valid?
    assert_includes profile.errors[:year_level], 'must be 1st, 2nd, 3rd, or 4th for college'
  end

  test "college accepts valid year levels" do
    %w[1st 2nd 3rd 4th].each do |year|
      profile = StudentProfile.new(
        student: students(:student_three),
        school_level: 'college',
        status: 'currently_enrolled',
        year_level: year,
        department: 'computer_studies',
        course: 'bachelor_of_science_in_information_technology'
      )

      profile.previous_schools.build(
        school_type: 'senior_high',
        school_name: 'Test High School',
        program: 'STEM',
        academic_year_from: 2020,
        academic_year_to: 2022
      )

      assert profile.valid?, "Should accept #{year} for college"
    end
  end

  test "senior high requires year level 11 or 12" do
    profile = StudentProfile.new(
      student: students(:student_three),
      school_level: 'senior_high',
      status: 'currently_enrolled',
      year_level: '1st',
      track: 'academic_track',
      strand: 'STEM'
    )

    assert_not profile.valid?
    assert_includes profile.errors[:year_level], 'must be 11 or 12 for senior high'
  end

  test "senior high accepts valid year levels" do
    %w[11 12].each do |year|
      profile = StudentProfile.new(
        student: students(:student_three),
        school_level: 'senior_high',
        status: 'currently_enrolled',
        year_level: year,
        track: 'academic_track',
        strand: 'STEM'
      )

      assert profile.valid?, "Should accept #{year} for senior high"
    end
  end

  # course_matches_department validation
  test "course must match department" do
    profile = StudentProfile.new(
      student: students(:student_three),
      school_level: 'college',
      status: 'currently_enrolled',
      year_level: '1st',
      department: 'computer_studies',
      course: 'bachelor_of_science_in_business_administration'
    )

    assert_not profile.valid?
    assert_includes profile.errors[:course], "is not valid for computer_studies department"
  end

  test "computer studies department courses are valid" do
    courses = [
      'diploma_in_web_application_technology',
      'bachelor_of_science_in_information_technology',
      'bachelor_of_science_in_computer_science'
    ]

    courses.each do |course|
      profile = StudentProfile.new(
        student: students(:student_three),
        school_level: 'college',
        status: 'currently_enrolled',
        year_level: '1st',
        department: 'computer_studies',
        course: course
      )

      profile.previous_schools.build(
        school_type: 'senior_high',
        school_name: 'Test High School',
        program: "STEM",
        academic_year_from: 2020,
        academic_year_to: 2022
      )

      assert profile.valid?, "#{course} should be valid for computer_studies"
    end
  end

  test "business department courses are valid" do
    courses = [
      'diploma_in_office_administration_technology',
      'diploma_in_office_management_technology',
      'bachelor_of_science_in_business_administration'
    ]

    courses.each do |course|
      profile = StudentProfile.new(
        student: students(:student_three),
        school_level: 'college',
        status: 'currently_enrolled',
        year_level: '1st',
        department: 'business',
        course: course
      )

      profile.previous_schools.build(
        school_type: 'senior_high',
        school_name: 'Test High School',
        program: "STEM",
        academic_year_from: 2020,
        academic_year_to: 2022
      )

      assert profile.valid?, "#{course} should be valid for business"
    end
  end

  test "culinary department courses are valid" do
    courses = [
      'diploma_in_hotel_and_restaurant_technology',
      'bachelor_of_science_in_hospitality_management'
    ]

    courses.each do |course|
      profile = StudentProfile.new(
        student: students(:student_three),
        school_level: 'college',
        status: 'currently_enrolled',
        year_level: '1st',
        department: 'culinary',
        course: course
      )

      profile.previous_schools.build(
        school_type: 'senior_high',
        school_name: 'Test High School',
        program: "STEM",
        academic_year_from: 2020,
        academic_year_to: 2022
      )

      assert profile.valid?, "#{course} should be valid for culinary"
    end
  end

  # strand_matches_track validation
  test "strand must match track" do
    profile = StudentProfile.new(
      student: students(:student_three),
      school_level: 'senior_high',
      status: 'currently_enrolled',
      year_level: '11',
      track: 'academic_track',
      strand: 'TVL - CSS'
    )

    assert_not profile.valid?
    assert_includes profile.errors[:strand], "is not valid for academic_track"
  end

  test "academic track strands are valid" do
    strands = %w[STEM ABM HUMSS GA]

    strands.each do |strand|
      profile = StudentProfile.new(
        student: students(:student_three),
        school_level: 'senior_high',
        status: 'currently_enrolled',
        year_level: '11',
        track: 'academic_track',
        strand: strand
      )

      assert profile.valid?, "#{strand} should be valid for academic_track"
    end
  end

  test "technical vocational livelihood strands are valid" do
    strands = ['TVL - CSS', 'TVL - Programming', 'TVL - Animation', 'TVL - HE']

    strands.each do |strand|
      profile = StudentProfile.new(
        student: students(:student_three),
        school_level: 'senior_high',
        status: 'currently_enrolled',
        year_level: '11',
        track: 'technical_vocational_livelihood',
        strand: strand
      )

      assert profile.valid?, "#{strand} should be valid for technical_vocational_livelihood"
    end
  end

  # previous_schools_required validation
  test "college currently_enrolled requires senior high school" do
    profile = StudentProfile.new(
      student: students(:student_three),
      school_level: 'college',
      status: 'currently_enrolled',
      year_level: '1st',
      department: 'computer_studies',
      course: 'bachelor_of_science_in_information_technology'
    )

    assert_not profile.valid?
    assert_includes profile.errors[:base], 'Must add previous senior high school information'

    profile.previous_schools.build(
      school_type: 'senior_high',
      school_name: 'Test Senior High',
      academic_year_from: 2020,
      academic_year_to: 2022,
      program: 'STEM'
    )

    assert profile.valid?
  end

  test "college transferee requires both senior high and college history" do
    profile = StudentProfile.new(
      student: students(:student_three),
      school_level: 'college',
      status: 'transferee',
      year_level: '2nd',
      department: 'computer_studies',
      course: 'bachelor_of_science_in_information_technology'
    )

    assert_not profile.valid?
    assert_includes profile.errors[:base], 'Must add previous senior high school information'
    assert_includes profile.errors[:base], 'Must add previous college information'

    profile.previous_schools.build(
      school_type: 'senior_high',
      school_name: 'Test Senior High',
      academic_year_from: 2020,
      academic_year_to: 2022,
      program: 'STEM'
    )

    profile.valid?
    assert_not profile.valid?
    assert_includes profile.errors[:base], 'Must add previous college information'

    profile.previous_schools.build(
      school_type: 'college',
      school_name: 'Test College',
      academic_year_from: 2022,
      academic_year_to: 2023,
      program: 'BS IT'
    )

    assert profile.valid?
  end

  test "college returnee requires both senior high and college history" do
    profile = StudentProfile.new(
      student: students(:student_three),
      school_level: 'college',
      status: 'returnee',
      year_level: '3rd',
      department: 'business',
      course: 'bachelor_of_science_in_business_administration'
    )

    assert_not profile.valid?
    assert_includes profile.errors[:base], 'Must add previous senior high school information'
    assert_includes profile.errors[:base], 'Must add previous college information'

    profile.previous_schools.build(
      school_type: 'senior_high',
      school_name: 'Test Senior High',
      academic_year_from: 2018,
      academic_year_to: 2020,
      program: 'ABM'
    )
    profile.previous_schools.build(
      school_type: 'college',
      school_name: 'Previous College',
      academic_year_from: 2020,
      academic_year_to: 2022,
      program: 'BSBA'
    )

    assert profile.valid?
  end

  test "college graduated requires both senior high and college history" do
    profile = StudentProfile.new(
      student: students(:student_three),
      school_level: 'college',
      status: 'graduated',
      year_level: '4th',
      department: 'culinary',
      course: 'bachelor_of_science_in_hospitality_management'
    )

    assert_not profile.valid?

    profile.previous_schools.build(
      school_type: 'senior_high',
      school_name: 'Test Senior High',
      academic_year_from: 2016,
      academic_year_to: 2018,
      program: 'TVL - HE'
    )
    profile.previous_schools.build(
      school_type: 'college',
      school_name: 'Same College',
      academic_year_from: 2018,
      academic_year_to: 2022,
      program: 'BSHM',
      completed: true
    )

    assert profile.valid?
  end

  test "senior high transferee requires senior high history" do
    profile = StudentProfile.new(
      student: students(:student_three),
      school_level: 'senior_high',
      status: 'transferee',
      year_level: '12',
      track: 'academic_track',
      strand: 'STEM'
    )

    assert_not profile.valid?
    assert_includes profile.errors[:base], 'Must add previous senior high school information'

    profile.previous_schools.build(
      school_type: 'senior_high',
      school_name: 'Previous Senior High',
      academic_year_from: 2023,
      academic_year_to: 2024,
      program: 'STEM'
    )

    assert profile.valid?
  end

  test "senior high returnee requires senior high history" do
    profile = StudentProfile.new(
      student: students(:student_three),
      school_level: 'senior_high',
      status: 'returnee',
      year_level: '12',
      track: 'technical_vocational_livelihood',
      strand: 'TVL - CSS'
    )

    assert_not profile.valid?

    profile.previous_schools.build(
      school_type: 'senior_high',
      school_name: 'Same Senior High',
      academic_year_from: 2022,
      academic_year_to: 2023,
      program: 'TVL - CSS'
    )

    assert profile.valid?
  end

  test "senior high graduated requires senior high history" do
    profile = StudentProfile.new(
      student: students(:student_three),
      school_level: 'senior_high',
      status: 'graduated',
      year_level: '12',
      track: 'academic_track',
      strand: 'ABM'
    )

    assert_not profile.valid?

    profile.previous_schools.build(
      school_type: 'senior_high',
      school_name: 'Same Senior High',
      academic_year_from: 2021,
      academic_year_to: 2023,
      program: 'ABM',
      completed: true
    )

    assert profile.valid?
  end

  test "senior high currently_enrolled does not require previous schools" do
    profile = StudentProfile.new(
      student: students(:student_three),
      school_level: 'senior_high',
      status: 'currently_enrolled',
      year_level: '11',
      track: 'academic_track',
      strand: 'HUMSS'
    )

    profile.valid?
    assert_not_includes profile.errors[:base], 'Must add previous senior high school information'
  end

  # Helper method tests
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

  test "requires_senior_high_history? returns true for college students" do
    profile = StudentProfile.new(student: students(:student_three), school_level: 'college', status: 'currently_enrolled')
    assert profile.requires_senior_high_history?

    profile.status = 'transferee'
    assert profile.requires_senior_high_history?

    profile.status = 'returnee'
    assert profile.requires_senior_high_history?

    profile.status = 'graduated'
    assert profile.requires_senior_high_history?
  end

  test "requires_senior_high_history? returns false for senior high students" do
    profile = StudentProfile.new(student: students(:student_three), school_level: 'senior_high', status: 'currently_enrolled')
    assert_not profile.requires_senior_high_history?
  end

  test "requires_college_history? returns true for college transferee, returnee, graduated" do
    profile = StudentProfile.new(student: students(:student_three), school_level: 'college', status: 'transferee')
    assert profile.requires_college_history?

    profile.status = 'returnee'
    assert profile.requires_college_history?

    profile.status = 'graduated'
    assert profile.requires_college_history?
  end

  test "requires_college_history? returns false for college currently_enrolled" do
    profile = StudentProfile.new(student: students(:student_three), school_level: 'college', status: 'currently_enrolled')
    assert_not profile.requires_college_history?
  end

  test "requires_previous_senior_high_only? returns true for senior high transferee, returnee, graduated" do
    profile = StudentProfile.new(student: students(:student_three), school_level: 'senior_high', status: 'transferee')
    assert profile.requires_previous_senior_high_only?

    profile.status = 'returnee'
    assert profile.requires_previous_senior_high_only?

    profile.status = 'graduated'
    assert profile.requires_previous_senior_high_only?
  end

  test "requires_previous_senior_high_only? returns false for currently_enrolled senior high" do
    profile = StudentProfile.new(student: students(:student_three), school_level: 'senior_high', status: 'currently_enrolled')
    assert_not profile.requires_previous_senior_high_only?
  end

  # Association tests
  test "accepts nested attributes for previous_schools" do
    profile = StudentProfile.new(
      student: students(:student_three),
      school_level: 'college',
      status: 'transferee',
      year_level: '2nd',
      department: 'computer_studies',
      course: 'bachelor_of_science_in_information_technology',
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
      school_level: 'college',
      status: 'currently_enrolled',
      year_level: '1st',
      department: 'computer_studies',
      course: 'bachelor_of_science_in_information_technology',
      previous_schools_attributes: [
        {
          school_type: 'senior_high',
          school_name: 'Test Senior High',
          academic_year_from: 2020,
          academic_year_to: 2022
        },
        {
          school_type: '',
          school_name: '',
          academic_year_from: nil,
          academic_year_to: nil
        }
      ]
    )

    assert_equal 1, profile.previous_schools.size
  end

  test "allows destroy on nested previous_schools" do
    profile = StudentProfile.create!(
      student: students(:student_three),
      school_level: 'college',
      status: 'transferee',
      year_level: '2nd',
      department: 'computer_studies',
      course: 'bachelor_of_science_in_information_technology',
      previous_schools_attributes: [
        {
          school_type: 'senior_high',
          school_name: 'Test Senior High',
          program: "STEM",
          academic_year_from: 2020,
          academic_year_to: 2022
        },
        {
          school_type: 'college',
          school_name: 'Previous College',
          program: "STEM",
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
