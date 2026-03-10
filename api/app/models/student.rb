class Student < User
  PERSONAL_INFO_REQUIRED_STUDENT_FIELDS = %i[first_name last_name].freeze
  PERSONAL_INFO_REQUIRED_PROFILE_FIELDS = %i[
    civil_status
    contact_number
    sex
    birthday
    citizenship
    barangay_name
    city_municipality
    province
  ].freeze
  FAMILY_INFO_CONTACT_PREFIXES = %w[father mother guardian].freeze

  has_one :student_profile, foreign_key: :user_id, inverse_of: :student, dependent: :destroy
  has_one :family_info, foreign_key: :user_id, inverse_of: :student, dependent: :destroy
  has_one :deficiency, foreign_key: :user_id, inverse_of: :student, dependent: :destroy
  has_many :document_requests, foreign_key: :user_id, inverse_of: :student, dependent: :destroy
  has_many :notifications, foreign_key: :student_id, inverse_of: :student, dependent: :destroy
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

  def incomplete_personal_info?
    missing_personal_info_fields.any?
  end

  def incomplete_family_info?
    family_info_complete_contacts.empty?
  end

  def incomplete_academic_info?
    !academic_info_present_for_status?
  end

  def missing_personal_info_fields
    missing_fields = []

    PERSONAL_INFO_REQUIRED_STUDENT_FIELDS.each do |field|
      missing_fields << field if blank_required_value?(public_send(field))
    end

    profile = student_profile
    PERSONAL_INFO_REQUIRED_PROFILE_FIELDS.each do |field|
      value = profile&.public_send(field)
      missing_fields << :"student_profile.#{field}" if blank_required_value?(value)
    end

    missing_fields
  end

  def family_info_complete_contacts
    FAMILY_INFO_CONTACT_PREFIXES.select do |prefix|
      family_contact_complete?(prefix)
    end
  end

  def claimable?
    !claimed?
  end

  private

  def blank_required_value?(value)
    value.respond_to?(:strip) ? value.strip.blank? : value.blank?
  end

  def family_contact_complete?(prefix)
    return false unless family_info

    first_name = family_info.public_send("#{prefix}_first_name")
    last_name = family_info.public_send("#{prefix}_last_name")
    contact_number = family_info.public_send("#{prefix}_contact_number")
    email_address = family_info.public_send("#{prefix}_email_address")

    name_complete = !blank_required_value?(first_name) && !blank_required_value?(last_name)
    contact_complete = !blank_required_value?(contact_number) || !blank_required_value?(email_address)

    name_complete && contact_complete
  end

  def academic_info_present_for_status?
    profile = student_profile
    return false unless profile

    status = profile.status
    school_level = profile.school_level
    return false if blank_required_value?(status) || blank_required_value?(school_level)

    is_college = school_level == "college"

    case status
    when "graduated"
      graduated_fields_present?(profile, is_college)
    when "transferee"
      transferee_fields_present?(profile, is_college)
    when "currently_enrolled", "returnee"
      current_or_returnee_fields_present?(profile, is_college)
    else
      false
    end
  end

  def current_or_returnee_fields_present?(profile, is_college)
    return false if blank_required_value?(profile.year_level)

    if is_college
      core_present = !blank_required_value?(profile.course) && !blank_required_value?(profile.department)
      shs_present = !blank_required_value?(profile.current_senior_high_program) ||
                    !blank_required_value?(profile.current_senior_high_school_name) ||
                    profile.current_senior_high_year_from.present? ||
                    profile.current_senior_high_year_to.present?
      core_present || shs_present
    else
      !blank_required_value?(profile.strand) || !blank_required_value?(profile.track)
    end
  end

  def transferee_fields_present?(profile, is_college)
    return false if blank_required_value?(profile.year_level)

    if is_college
      current_present = !blank_required_value?(profile.course) && !blank_required_value?(profile.department)
      previous_present = !blank_required_value?(profile.prev_college_program) ||
                         !blank_required_value?(profile.prev_college_school_name) ||
                         profile.prev_college_year_from.present? ||
                         profile.prev_college_year_to.present?
      shs_present = !blank_required_value?(profile.current_senior_high_program) ||
                    !blank_required_value?(profile.current_senior_high_school_name) ||
                    profile.current_senior_high_year_from.present? ||
                    profile.current_senior_high_year_to.present?
      current_present || previous_present || shs_present
    else
      current_present = !blank_required_value?(profile.strand) || !blank_required_value?(profile.track)
      previous_present = !blank_required_value?(profile.prev_senior_high_program) ||
                         !blank_required_value?(profile.prev_senior_high_school_name) ||
                         profile.prev_senior_high_year_from.present? ||
                         profile.prev_senior_high_year_to.present?
      current_present || previous_present
    end
  end

  def graduated_fields_present?(profile, is_college)
    if is_college
      !blank_required_value?(profile.course) ||
        !blank_required_value?(profile.department) ||
        profile.prev_college_year_from.present? ||
        profile.prev_college_year_to.present?
    else
      !blank_required_value?(profile.strand) ||
        !blank_required_value?(profile.track) ||
        profile.prev_senior_high_year_from.present? ||
        profile.prev_senior_high_year_to.present?
    end
  end

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
