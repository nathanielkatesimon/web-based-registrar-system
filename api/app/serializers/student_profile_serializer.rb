class StudentProfileSerializer < ActiveModel::Serializer
  attributes :id, :civil_status, :contact_number, :sex, :birthday,
             :place_of_birth, :citizenship, :religion, :house_number,
             :street_name, :barangay_name, :city_municipality, :province,
             :full_address, :status, :school_level, :year_level, :course,
             :department, :strand, :track,
             :current_college_school_name, :current_college_program, :current_college_level,
             :current_college_year_from, :current_college_year_to, :current_college_department_track,
             :prev_college_school_name, :prev_college_program, :prev_college_level,
             :prev_college_year_from, :prev_college_year_to, :prev_college_department_track,
             :current_senior_high_school_name, :current_senior_high_program, :current_senior_high_level,
             :current_senior_high_year_from, :current_senior_high_year_to, :current_senior_high_department_track,
             :prev_senior_high_school_name, :prev_senior_high_program, :prev_senior_high_level,
             :prev_senior_high_year_from, :prev_senior_high_year_to, :prev_senior_high_department_track
end
