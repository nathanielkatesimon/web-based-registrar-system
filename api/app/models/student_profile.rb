class StudentProfile < ApplicationRecord
  belongs_to :user

  # Enums
  enum status: {
    currently_enrolled: 'currently_enrolled',
    transferee: 'transferee',
    returnee: 'returnee',
    graduated: 'graduated'
  }
  
  enum school_level: {
    college: 'college',
    senior_high: 'senior_high'
  }
  
  enum sex: {
    male: 'male',
    female: 'female'
  }
  
  # College courses
  COLLEGE_COURSES = [
    'diploma_in_web_application_technology',
    'diploma_in_office_administration_technology',
    'diploma_in_office_management_technology',
    'diploma_in_hotel_and_restaurant_technology',
    'bachelor_of_science_in_information_technology',
    'bachelor_of_science_in_computer_science',
    'bachelor_of_science_in_business_administration',
    'bachelor_of_science_in_hospitality_management'
  ].freeze
  
  # Senior High strands
  SENIOR_HIGH_STRANDS = [
    'STEM', 'ABM', 'HUMSS', 'GA',
    'TVL - CSS', 'TVL - Programming',
    'TVL - Animation', 'TVL - HE'
  ].freeze
  
  validates :school_level, presence: true, if: -> { user&.type == 'Student' }
  validates :course, inclusion: { in: COLLEGE_COURSES }, if: -> { college? }
  validates :strand, inclusion: { in: SENIOR_HIGH_STRANDS }, if: -> { senior_high? }
  validates :year_level, presence: true
  
  validate :year_level_matches_school_level
  
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
end
