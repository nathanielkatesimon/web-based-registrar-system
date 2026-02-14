class StudentProfile < ApplicationRecord
  attr_accessor :registration_flow

  belongs_to :student,
    class_name: "Student",
    foreign_key: :user_id,
    inverse_of: :student_profile,
    optional: true
  has_many :previous_schools, dependent: :destroy

  accepts_nested_attributes_for :previous_schools,
    allow_destroy: true,
    reject_if: :all_blank

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

  # Validations
  validates :school_level, presence: true
  validates :status, presence: true
  validates :year_level, presence: true

  # College validations
  validates :course,
    inclusion: { in: COLLEGE_COURSES },
    if: :college?
  validates :department,
    inclusion: { in: DEPARTMENT_COURSES.keys },
    if: :college?

  # Senior High validations
  validates :strand,
    inclusion: { in: SENIOR_HIGH_STRANDS },
    if: :senior_high?
  validates :track,
    inclusion: { in: TRACK_STRANDS.keys },
    if: :senior_high?

  # Custom validations
  validate :year_level_matches_school_level
  validate :course_matches_department
  validate :strand_matches_track
  validate :graduated_requires_previous_college_information, if: :registration_flow?

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

  private

  def year_level_matches_school_level
    return unless school_level.present? && year_level.present?

    if college? && !%w[1st 2nd 3rd 4th].include?(year_level)
      errors.add(:year_level, 'must be 1st, 2nd, 3rd, or 4th for college')
    elsif senior_high? && !%w[11 12].include?(year_level)
      errors.add(:year_level, 'must be 11 or 12 for senior high')
    end
  end

  def course_matches_department
    return unless college? && course.present? && department.present?

    valid_courses = DEPARTMENT_COURSES[department] || []
    unless valid_courses.include?(course)
      errors.add(:course, "is not valid for #{department} department")
    end
  end

  def strand_matches_track
    return unless senior_high? && strand.present? && track.present?

    valid_strands = TRACK_STRANDS[track] || []
    unless valid_strands.include?(strand)
      errors.add(:strand, "is not valid for #{track}")
    end
  end

  def graduated_requires_previous_college_information
    return unless status == 'graduated'

    college_schools = previous_schools.select do |ps|
      !ps.marked_for_destruction?
    end

    return unless college_schools.empty?

    errors.add(:base, 'Must add previous school information if already graduated')
  end

  def registration_flow?
    registration_flow == true
  end
end
