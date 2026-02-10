class Student < User
  has_one :student_profile, foreign_key: :user_id, dependent: :destroy
  accepts_nested_attributes_for :student_profile
  
  after_create :build_default_profile
  
  # Enums for better type safety
  enum civil_status: {
    single: 'single',
    married: 'married',
    widower: 'widower',
    separated: 'separated'
  }, _prefix: true

  delegate :civil_status, :contact_number, :sex, :birthday, :place_of_birth,
           :citizenship, :religion, :house_number, :street_name, :barangay_name,
           :city_municipality, :province, :status, :school_level, :year_level,
           :course, :department, :strand, :track,
           to: :student_profile, allow_nil: true

  private
  
  def build_default_profile
    create_student_profile unless student_profile
  end
end
