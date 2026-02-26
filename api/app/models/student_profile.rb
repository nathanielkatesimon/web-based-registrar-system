class StudentProfile < ApplicationRecord
  attr_accessor :registration_flow

  belongs_to :student,
    class_name: "Student",
    foreign_key: :user_id,
    inverse_of: :student_profile,
    optional: true

  # Enums
  enum :civil_status, {
    single: 'single',
    married: 'married',
    widower: 'widower',
    separated: 'separated'
  }

  enum :status, {
    currently_enrolled: 'currently_enrolled',
    transferee: 'transferee',
    returnee: 'returnee',
    graduated: 'graduated'
  }

  enum :school_level, {
    college: 'college',
    senior_high: 'senior_high'
  }

  enum :sex, {
    male: 'male',
    female: 'female'
  }

  # Department => Courses mapping
  DEPARTMENT_COURSES = {
    'computer_studies' => [
      'diploma_in_web_application_technology',
      'bachelor_of_science_in_information_technology',
      'bachelor_of_science_in_computer_science'
    ],
    'business' => [
      'diploma_in_office_administration_technology',
      'diploma_in_office_management_technology',
      'bachelor_of_science_in_business_administration'
    ],
    'culinary' => [
      'diploma_in_hotel_and_restaurant_technology',
      'bachelor_of_science_in_hospitality_management'
    ]
  }.freeze

  # Track => Strands mapping
  TRACK_STRANDS = {
    'academic_track' => ['STEM', 'ABM', 'HUMSS', 'GA'],
    'technical_vocational_livelihood' => [
      'TVL - CSS',
      'TVL - Programming',
      'TVL - Animation',
      'TVL - HE'
    ]
  }.freeze

  # All courses (flattened)
  COLLEGE_COURSES = DEPARTMENT_COURSES.values.flatten.freeze

  # All strands (flattened)
  SENIOR_HIGH_STRANDS = TRACK_STRANDS.values.flatten.freeze

  # Scopes for filtering valid options
  def available_courses
    return [] unless department.present?
    DEPARTMENT_COURSES[department] || []
  end

  def available_strands
    return [] unless track.present?
    TRACK_STRANDS[track] || []
  end

  def full_address
    [house_number, street_name, barangay_name, city_municipality, province]
      .compact.join(', ')
  end
end
