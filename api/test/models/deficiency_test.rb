require "test_helper"

class DeficiencyTest < ActiveSupport::TestCase
  test "requires student association" do
    deficiency = Deficiency.new

    assert_not deficiency.valid?
    assert_includes deficiency.errors[:student], "must exist"
  end

  test "defaults all statuses to not_included for new student" do
    student = Student.create!(
      auth_id: "2026000000222",
      email: "deficiency.defaults@example.com",
      password: "password123",
      password_confirmation: "password123",
      first_name: "Def",
      last_name: "Defaults",
      type: "Student"
    )

    deficiency = student.deficiency
    assert_not_nil deficiency

    Deficiency::FIELDS.each do |field|
      assert_equal "not_included", deficiency.public_send(field)
    end
  end

  test "accepts valid enum values" do
    deficiency = Deficiency.new(
      student: students(:student_three),
      enrollment_form: :lacking
    )

    assert deficiency.valid?
    assert_equal "lacking", deficiency.enrollment_form
  end
end
