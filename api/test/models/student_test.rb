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
end
