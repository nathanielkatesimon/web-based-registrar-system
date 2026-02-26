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
end
