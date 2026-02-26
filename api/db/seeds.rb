# db/seeds.rb

puts "Cleaning database..."
StudentProfile.destroy_all
Deficiency.destroy_all
Student.destroy_all
Staff.destroy_all
User.destroy_all

puts "Creating users..."

Staff.create!(
  email: "staff@example.com",
  password: "password123",
  password_confirmation: "password123",
  auth_id: "14-2026-001",
  first_name: "John",
  middle_name: "dela",
  last_name: "Cruz",
  extension: "Jr."
)

seed_students = [
  {
    email: "enrolled.college@example.com",
    auth_id: "2025000000001",
    first_name: "Maria",
    middle_name: "Santos",
    last_name: "Garcia",
    profile: {
      civil_status: "single",
      sex: "female",
      contact_number: "09171234561",
      birthday: Date.new(2006, 2, 10),
      place_of_birth: "Cebu City",
      citizenship: "Filipino",
      religion: "Roman Catholic",
      house_number: "123",
      street_name: "Mango Avenue",
      barangay_name: "Lahug",
      city_municipality: "Cebu City",
      province: "Cebu",
      status: "currently_enrolled",
      school_level: "college",
      year_level: "1st",
      department: "computer_studies",
      course: "bachelor_of_science_in_information_technology",
      current_college_school_name: "ACLC",
      current_college_program: "bachelor_of_science_in_information_technology",
      current_college_level: "1st",
      current_college_department_track: "computer_studies",
      current_senior_high_school_name: "Cebu City National Science High School",
      current_senior_high_program: "STEM",
      current_senior_high_level: "12",
      current_senior_high_year_from: 2022,
      current_senior_high_year_to: 2024,
      current_senior_high_department_track: "academic_track"
    },
    deficiency: {
      enrollment_form: "complied",
      form_138: "complied",
      form_137: "lacking",
      certificate_of_good_moral_character: "complied",
      id_pictures: "complied",
      birth_certificate: "lacking",
      senior_high_school_diploma: "not_included",
      honorable_dismissal: "not_included",
      transcript_of_records: "not_included"
    }
  },
  {
    email: "enrolled.shs@example.com",
    auth_id: "2025000000002",
    first_name: "Pedro",
    middle_name: "Reyes",
    last_name: "Mendoza",
    profile: {
      civil_status: "single",
      sex: "male",
      contact_number: "09171234562",
      birthday: Date.new(2007, 7, 21),
      place_of_birth: "Danao City",
      citizenship: "Filipino",
      religion: "Christian",
      house_number: "45",
      street_name: "Rizal Street",
      barangay_name: "Poblacion",
      city_municipality: "Mandaue City",
      province: "Cebu",
      status: "currently_enrolled",
      school_level: "senior_high",
      year_level: "11",
      track: "academic_track",
      strand: "STEM",
      current_senior_high_school_name: "ACLC",
      current_senior_high_program: "STEM",
      current_senior_high_level: "11",
      current_senior_high_year_from: 2025,
      current_senior_high_year_to: 2026,
      current_senior_high_department_track: "academic_track"
    },
    deficiency: {
      enrollment_form: "complied",
      form_138: "lacking",
      form_137: "not_included",
      certificate_of_good_moral_character: "lacking",
      id_pictures: "complied",
      birth_certificate: "complied",
      senior_high_school_diploma: "not_included",
      honorable_dismissal: "not_included",
      transcript_of_records: "not_included"
    }
  },
  {
    email: "transferee.college@example.com",
    auth_id: "2025000000003",
    first_name: "Ana",
    middle_name: "Lopez",
    last_name: "Villanueva",
    profile: {
      civil_status: "single",
      sex: "female",
      contact_number: "09171234563",
      birthday: Date.new(2005, 11, 3),
      place_of_birth: "Bogo City",
      citizenship: "Filipino",
      religion: "Roman Catholic",
      house_number: "78",
      street_name: "Colon Street",
      barangay_name: "Parian",
      city_municipality: "Cebu City",
      province: "Cebu",
      status: "transferee",
      school_level: "college",
      year_level: "2nd",
      department: "business",
      course: "bachelor_of_science_in_business_administration",
      current_college_school_name: "ACLC",
      current_college_program: "bachelor_of_science_in_business_administration",
      current_college_level: "2nd",
      current_college_department_track: "business",
      prev_college_school_name: "University of San Carlos",
      prev_college_program: "bachelor_of_science_in_business_administration",
      prev_college_level: "1st",
      prev_college_year_from: 2023,
      prev_college_year_to: 2024,
      prev_college_department_track: "business",
      current_senior_high_school_name: "University of San Carlos - Senior High",
      current_senior_high_program: "ABM",
      current_senior_high_level: "12",
      current_senior_high_year_from: 2020,
      current_senior_high_year_to: 2022,
      current_senior_high_department_track: "academic_track"
    },
    deficiency: {
      enrollment_form: "complied",
      form_138: "complied",
      form_137: "complied",
      certificate_of_good_moral_character: "complied",
      id_pictures: "lacking",
      birth_certificate: "complied",
      senior_high_school_diploma: "complied",
      honorable_dismissal: "lacking",
      transcript_of_records: "lacking"
    }
  },
  {
    email: "transferee.shs@example.com",
    auth_id: "2025000000004",
    first_name: "Carlos",
    middle_name: "Torres",
    last_name: "Ramos",
    profile: {
      civil_status: "single",
      sex: "male",
      contact_number: "09171234564",
      birthday: Date.new(2006, 9, 15),
      place_of_birth: "Toledo City",
      citizenship: "Filipino",
      religion: "Christian",
      house_number: "102",
      street_name: "Osmena Boulevard",
      barangay_name: "Carreta",
      city_municipality: "Cebu City",
      province: "Cebu",
      status: "transferee",
      school_level: "senior_high",
      year_level: "12",
      track: "technical_vocational_livelihood",
      strand: "TVL - CSS",
      current_senior_high_school_name: "ACLC",
      current_senior_high_program: "TVL - CSS",
      current_senior_high_level: "12",
      current_senior_high_department_track: "technical_vocational_livelihood",
      prev_senior_high_school_name: "Don Bosco Technology Center",
      prev_senior_high_program: "TVL - Programming",
      prev_senior_high_level: "11",
      prev_senior_high_year_from: 2023,
      prev_senior_high_year_to: 2024,
      prev_senior_high_department_track: "technical_vocational_livelihood"
    },
    deficiency: {
      enrollment_form: "lacking",
      form_138: "complied",
      form_137: "not_included",
      certificate_of_good_moral_character: "lacking",
      id_pictures: "lacking",
      birth_certificate: "complied",
      senior_high_school_diploma: "lacking",
      honorable_dismissal: "not_included",
      transcript_of_records: "not_included"
    }
  }
]

seed_students.each do |attrs|
  student = Student.create!(
    email: attrs[:email],
    password: "password123",
    password_confirmation: "password123",
    auth_id: attrs[:auth_id],
    first_name: attrs[:first_name],
    middle_name: attrs[:middle_name],
    last_name: attrs[:last_name]
  )

  student.student_profile.update!(attrs[:profile])
  student.deficiency.update!(attrs[:deficiency]) if attrs[:deficiency].present?
end

[
  { name: "Certificate of Good Moral Character", price_cents: 5_000 },
  { name: "Honorable Dismissal", price_cents: 10_000 },
  { name: "Form 137", price_cents: 20_000 },
  { name: "Form 138 (Grade 11)", price_cents: 10_000 },
  { name: "Form 138 (Grade 12)", price_cents: 10_000 },
  { name: "Original Transcript of Records (TOR) per Page", price_cents: 20_000 },
  { name: "Original Diploma", price_cents: 5_000 },
  { name: "Certificate of Grades", price_cents: 5_000 },
  { name: "Transfer Credentials for College", price_cents: 50_000 },
  { name: "Transfer Credentials for Senior High School", price_cents: 45_000 },
  { name: "Certified True Copy of TOR", price_cents: 5_000 },
  { name: "Certified True Copy of Diploma", price_cents: 5_000 },
  { name: "Certificate of Graduation", price_cents: 5_000 },
  { name: "Certificate of Enrollment", price_cents: 5_000 },
  { name: "Certificate of GWA/GPA", price_cents: 5_000 },
  { name: "Certificate of Scholarship", price_cents: 5_000 }
].each do |attrs|
  DocumentType.find_or_create_by!(name: attrs[:name]) do |document_type|
    document_type.price_cents = attrs[:price_cents]
  end
end

puts "Seed completed successfully!"
puts "Total Users created: #{User.count}"
puts "  - Staff: #{Staff.count}"
puts "  - Students: #{Student.count}"
puts "Total Document Types: #{DocumentType.count}"
puts "Total Student Profiles: #{StudentProfile.count}"
puts "Total Deficiencies: #{Deficiency.count}"
