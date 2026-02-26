require "test_helper"

class FamilyInfoTest < ActiveSupport::TestCase
  test "requires student association" do
    family_info = FamilyInfo.new

    assert_not family_info.valid?
    assert_includes family_info.errors[:student], "must exist"
  end

  test "allows blank family fields" do
    family_info = FamilyInfo.new(student: students(:student_three))

    assert family_info.valid?
  end
end
