class PreviousSchool < ApplicationRecord
  belongs_to :student_profile

  enum :school_type, {
    senior_high: 'senior_high',
    college: 'college'
  }

  validates :school_name, presence: true
  validates :school_type, presence: true
  validates :academic_year_from, presence: true,
    numericality: { greater_than: 1900, less_than_or_equal_to: ->(_) { Date.current.year + 10 } }
  validates :academic_year_to, presence: true,
    numericality: { greater_than: 1900, less_than_or_equal_to: ->(_) { Date.current.year + 10 } }
  validates :program, presence: true

  validate :academic_year_to_after_from

  def academic_year_range
    "#{academic_year_from}-#{academic_year_to}"
  end

  private

  def academic_year_to_after_from
    return unless academic_year_from.present? && academic_year_to.present?

    if academic_year_to <= academic_year_from
      errors.add(:academic_year_to, 'must be after academic year from')
    end
  end
end
