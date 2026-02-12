class StudentProfileSerializer < ActiveModel::Serializer
  attributes :id, :civil_status, :contact_number, :sex, :birthday,
             :place_of_birth, :citizenship, :religion, :house_number,
             :street_name, :barangay_name, :city_municipality, :province,
             :full_address, :status, :school_level, :year_level, :course,
             :department, :strand, :track

  has_many :previous_schools
end
