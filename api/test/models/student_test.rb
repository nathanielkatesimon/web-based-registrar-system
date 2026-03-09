require "test_helper"

class StudentTest < ActiveSupport::TestCase
  test "creates blank student_profile, family_info, and deficiency after create" do
    student = Student.create!(
      auth_id: "2026000000111",
      email: "callback.student@example.com",
      password: "password123",
      password_confirmation: "password123",
      first_name: "Callback",
      last_name: "Student",
      type: "Student"
    )

    assert_not_nil student.student_profile
    assert_not_nil student.family_info
    assert_not_nil student.deficiency
    assert_equal student.id, student.family_info.user_id
    assert_equal student.id, student.deficiency.user_id
  end

  test "incomplete_personal_info? returns false when required personal fields are complete" do
    student = students(:student_one)

    assert_not student.incomplete_personal_info?
    assert_empty student.missing_personal_info_fields
  end

  test "incomplete_personal_info? returns true when required personal fields are missing" do
    student = students(:student_one)
    student.update_columns(first_name: "  ")
    student.student_profile.update_columns(contact_number: nil, province: "")

    assert student.incomplete_personal_info?
    assert_includes student.missing_personal_info_fields, :first_name
    assert_includes student.missing_personal_info_fields, :"student_profile.contact_number"
    assert_includes student.missing_personal_info_fields, :"student_profile.province"
  end

  test "incomplete_family_info? returns false when at least one contact has name and contact info" do
    student = students(:student_one)

    assert_not student.incomplete_family_info?
    assert_includes student.family_info_complete_contacts, "father"
  end

  test "incomplete_family_info? returns true when no contact has both name and contact info" do
    student = students(:student_one)
    student.family_info.update_columns(
      father_first_name: "",
      father_last_name: "",
      father_contact_number: "",
      father_email_address: "",
      mother_first_name: "",
      mother_last_name: "",
      mother_contact_number: "",
      mother_email_address: "",
      guardian_first_name: "",
      guardian_last_name: "",
      guardian_contact_number: "",
      guardian_email_address: ""
    )

    assert student.incomplete_family_info?
    assert_empty student.family_info_complete_contacts
  end

  test "incomplete_academic_info? returns false when status-specific academic info exists" do
    student = students(:student_one)

    assert_not student.incomplete_academic_info?
  end

  test "incomplete_academic_info? returns true when current status academic info is blank" do
    student = students(:student_one)
    student.student_profile.update_columns(
      year_level: nil,
      course: "",
      department: "",
      strand: "",
      track: "",
      current_senior_high_school_name: "",
      current_senior_high_program: "",
      current_senior_high_year_from: nil,
      current_senior_high_year_to: nil
    )

    assert student.incomplete_academic_info?
  end
end
