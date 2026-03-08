class Student < User
  has_one :student_profile, foreign_key: :user_id, inverse_of: :student, dependent: :destroy
  has_one :family_info, foreign_key: :user_id, inverse_of: :student, dependent: :destroy
  has_one :deficiency, foreign_key: :user_id, inverse_of: :student, dependent: :destroy
  has_many :document_requests, foreign_key: :user_id, inverse_of: :student, dependent: :destroy
  has_many :escalation_tickets, foreign_key: :student_id, inverse_of: :student, dependent: :destroy

  accepts_nested_attributes_for :student_profile

  after_create :build_default_profile
  after_create :build_default_family_info
  after_create :build_default_deficiency

  delegate :civil_status, :contact_number, :sex, :birthday, :place_of_birth,
           :citizenship, :religion, :house_number, :street_name, :barangay_name,
           :city_municipality, :province, :status, :school_level, :year_level,
           :course, :department, :strand, :track,
           to: :student_profile, allow_nil: true

  private

  def build_default_profile
    create_student_profile unless student_profile
  end

  def build_default_family_info
    create_family_info unless family_info
  end

  def build_default_deficiency
    create_deficiency unless deficiency
  end
end
