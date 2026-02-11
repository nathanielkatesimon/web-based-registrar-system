class PreviousSchoolSerializer < ActiveModel::Serializer
  attributes :id, :school_type, :school_name, :academic_year_from,
             :academic_year_to, :academic_year_range, :program, :completed
end
