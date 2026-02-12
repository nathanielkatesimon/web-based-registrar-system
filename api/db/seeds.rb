# db/seeds.rb

# Clear existing data (optional - comment out if you don't want to reset)
puts "Cleaning database..."
PreviousSchool.destroy_all
StudentProfile.destroy_all
Student.destroy_all
Staff.destroy_all
User.destroy_all

puts "Creating users..."

# =============================================================================
# STAFF
# =============================================================================
staff = Staff.create!(
  email: 'staff@example.com',
  password: 'password123',
  password_confirmation: 'password123',
  auth_id: '123456',
  first_name: 'John',
  middle_name: 'dela',
  last_name: 'Cruz',
  extension: 'Jr.'
)
puts "✓ Created Staff: #{staff.full_name} (#{staff.email})"

# =============================================================================
# CURRENTLY ENROLLED - COLLEGE
# =============================================================================
currently_enrolled_college = Student.create!(
  email: 'enrolled.college@example.com',
  password: 'password123',
  password_confirmation: 'password123',
  auth_id: '2025000000001',
  first_name: 'Maria',
  middle_name: 'Santos',
  last_name: 'Garcia',
  extension: nil
)

profile = currently_enrolled_college.build_student_profile(
  # Personal Info
  civil_status: 'single',
  contact_number: '09171234567',
  sex: 'female',
  birthday: Date.new(2005, 3, 15),
  place_of_birth: 'Cebu City',
  citizenship: 'Filipino',
  religion: 'Roman Catholic',

  # Address
  house_number: '123',
  street_name: 'Mango Avenue',
  barangay_name: 'Kamputhaw',
  city_municipality: 'Cebu City',
  province: 'Cebu',

  # Academic Info
  status: 'currently_enrolled',
  school_level: 'college',
  year_level: '1st',
  department: 'computer_studies',
  course: 'bachelor_of_science_in_information_technology'
)

# Build previous schools BEFORE saving
profile.previous_schools.build(
  school_type: 'senior_high',
  school_name: 'Cebu City National Science High School',
  academic_year_from: 2022,
  academic_year_to: 2024,
  program: 'STEM',
  completed: true
)

profile.save!
puts "✓ Created Currently Enrolled College Student: #{currently_enrolled_college.full_name}"

# =============================================================================
# CURRENTLY ENROLLED - SENIOR HIGH
# =============================================================================
currently_enrolled_shs = Student.create!(
  email: 'enrolled.shs@example.com',
  password: 'password123',
  password_confirmation: 'password123',
  auth_id: '2025000000002',
  first_name: 'Pedro',
  middle_name: 'Reyes',
  last_name: 'Mendoza',
  extension: nil
)

currently_enrolled_shs.create_student_profile!(
  # Personal Info
  civil_status: 'single',
  contact_number: '09181234567',
  sex: 'male',
  birthday: Date.new(2008, 7, 22),
  place_of_birth: 'Mandaue City',
  citizenship: 'Filipino',
  religion: 'Roman Catholic',

  # Address
  house_number: '456',
  street_name: 'UN Avenue',
  barangay_name: 'Centro',
  city_municipality: 'Mandaue City',
  province: 'Cebu',

  # Academic Info
  status: 'currently_enrolled',
  school_level: 'senior_high',
  year_level: '11',
  track: 'academic_track',
  strand: 'STEM'
)

puts "✓ Created Currently Enrolled Senior High Student: #{currently_enrolled_shs.full_name}"

# =============================================================================
# TRANSFEREE - COLLEGE
# =============================================================================
transferee_college = Student.create!(
  email: 'transferee.college@example.com',
  password: 'password123',
  password_confirmation: 'password123',
  auth_id: '2025000000003',
  first_name: 'Ana',
  middle_name: 'Lopez',
  last_name: 'Villanueva',
  extension: nil
)

profile = transferee_college.build_student_profile(
  # Personal Info
  civil_status: 'single',
  contact_number: '09191234567',
  sex: 'female',
  birthday: Date.new(2004, 11, 8),
  place_of_birth: 'Lapu-Lapu City',
  citizenship: 'Filipino',
  religion: 'Iglesia ni Cristo',

  # Address
  house_number: '789',
  street_name: 'Basak Street',
  barangay_name: 'Basak',
  city_municipality: 'Lapu-Lapu City',
  province: 'Cebu',

  # Academic Info
  status: 'transferee',
  school_level: 'college',
  year_level: '2nd',
  department: 'business',
  course: 'bachelor_of_science_in_business_administration'
)

# Build previous schools
profile.previous_schools.build(
  school_type: 'senior_high',
  school_name: 'University of San Carlos - Senior High',
  academic_year_from: 2020,
  academic_year_to: 2022,
  program: 'ABM',
  completed: true
)

profile.previous_schools.build(
  school_type: 'college',
  school_name: 'University of San Carlos',
  academic_year_from: 2022,
  academic_year_to: 2024,
  program: 'Bachelor of Science in Accountancy',
  completed: false
)

profile.save!
puts "✓ Created Transferee College Student: #{transferee_college.full_name}"

# =============================================================================
# TRANSFEREE - SENIOR HIGH
# =============================================================================
transferee_shs = Student.create!(
  email: 'transferee.shs@example.com',
  password: 'password123',
  password_confirmation: 'password123',
  auth_id: '2025000000004',
  first_name: 'Carlos',
  middle_name: 'Torres',
  last_name: 'Ramos',
  extension: nil
)

profile = transferee_shs.build_student_profile(
  # Personal Info
  civil_status: 'single',
  contact_number: '09201234567',
  sex: 'male',
  birthday: Date.new(2007, 5, 30),
  place_of_birth: 'Talisay City',
  citizenship: 'Filipino',
  religion: 'Born Again Christian',

  # Address
  house_number: '321',
  street_name: 'Tabunok Road',
  barangay_name: 'Tabunok',
  city_municipality: 'Talisay City',
  province: 'Cebu',

  # Academic Info
  status: 'transferee',
  school_level: 'senior_high',
  year_level: '12',
  track: 'technical_vocational_livelihood',
  strand: 'TVL - CSS'
)

profile.previous_schools.build(
  school_type: 'senior_high',
  school_name: 'Don Bosco Technology Center',
  academic_year_from: 2023,
  academic_year_to: 2024,
  program: 'TVL - Programming',
  completed: false
)

profile.save!
puts "✓ Created Transferee Senior High Student: #{transferee_shs.full_name}"

# =============================================================================
# RETURNEE - COLLEGE
# =============================================================================
returnee_college = Student.create!(
  email: 'returnee.college@example.com',
  password: 'password123',
  password_confirmation: 'password123',
  auth_id: '2025000000005',
  first_name: 'Elena',
  middle_name: 'Aquino',
  last_name: 'Bautista',
  extension: nil
)

profile = returnee_college.build_student_profile(
  # Personal Info
  civil_status: 'married',
  contact_number: '09211234567',
  sex: 'female',
  birthday: Date.new(2003, 1, 12),
  place_of_birth: 'Cebu City',
  citizenship: 'Filipino',
  religion: 'Roman Catholic',

  # Address
  house_number: '654',
  street_name: 'Colon Street',
  barangay_name: 'Pari-an',
  city_municipality: 'Cebu City',
  province: 'Cebu',

  # Academic Info
  status: 'returnee',
  school_level: 'college',
  year_level: '3rd',
  department: 'computer_studies',
  course: 'bachelor_of_science_in_computer_science'
)

profile.previous_schools.build(
  school_type: 'senior_high',
  school_name: 'Cebu Eastern College',
  academic_year_from: 2019,
  academic_year_to: 2021,
  program: 'STEM',
  completed: true
)

profile.previous_schools.build(
  school_type: 'college',
  school_name: 'Your Institution Name',
  academic_year_from: 2021,
  academic_year_to: 2023,
  program: 'Bachelor of Science in Computer Science',
  completed: false
)

profile.save!
puts "✓ Created Returnee College Student: #{returnee_college.full_name}"

# =============================================================================
# RETURNEE - SENIOR HIGH
# =============================================================================
returnee_shs = Student.create!(
  email: 'returnee.shs@example.com',
  password: 'password123',
  password_confirmation: 'password123',
  auth_id: '2025000000006',
  first_name: 'Roberto',
  middle_name: 'Fernandez',
  last_name: 'Santos',
  extension: 'III'
)

profile = returnee_shs.build_student_profile(
  # Personal Info
  civil_status: 'single',
  contact_number: '09221234567',
  sex: 'male',
  birthday: Date.new(2006, 9, 18),
  place_of_birth: 'Consolacion',
  citizenship: 'Filipino',
  religion: 'Seventh-day Adventist',

  # Address
  house_number: '987',
  street_name: 'Cansaga Road',
  barangay_name: 'Cansaga',
  city_municipality: 'Consolacion',
  province: 'Cebu',

  # Academic Info
  status: 'returnee',
  school_level: 'senior_high',
  year_level: '12',
  track: 'academic_track',
  strand: 'HUMSS'
)

profile.previous_schools.build(
  school_type: 'senior_high',
  school_name: 'Your Institution Name',
  academic_year_from: 2022,
  academic_year_to: 2023,
  program: 'HUMSS',
  completed: false
)

profile.save!
puts "✓ Created Returnee Senior High Student: #{returnee_shs.full_name}"

# =============================================================================
# GRADUATED - COLLEGE
# =============================================================================
graduated_college = Student.create!(
  email: 'graduated.college@example.com',
  password: 'password123',
  password_confirmation: 'password123',
  auth_id: '2025000000007',
  first_name: 'Isabella',
  middle_name: 'Diaz',
  last_name: 'Martinez',
  extension: nil
)

profile = graduated_college.build_student_profile(
  # Personal Info
  civil_status: 'single',
  contact_number: '09231234567',
  sex: 'female',
  birthday: Date.new(2001, 4, 25),
  place_of_birth: 'Cebu City',
  citizenship: 'Filipino',
  religion: 'Roman Catholic',

  # Address
  house_number: '147',
  street_name: 'Gorordo Avenue',
  barangay_name: 'Lahug',
  city_municipality: 'Cebu City',
  province: 'Cebu',

  # Academic Info
  status: 'graduated',
  school_level: 'college',
  year_level: '4th',
  department: 'culinary',
  course: 'bachelor_of_science_in_hospitality_management'
)

profile.previous_schools.build(
  school_type: 'senior_high',
  school_name: 'Southwestern University PHINMA',
  academic_year_from: 2017,
  academic_year_to: 2019,
  program: 'TVL - HE',
  completed: true
)

profile.previous_schools.build(
  school_type: 'college',
  school_name: 'Your Institution Name',
  academic_year_from: 2019,
  academic_year_to: 2024,
  program: 'Bachelor of Science in Hospitality Management',
  completed: true
)

profile.save!
puts "✓ Created Graduated College Student: #{graduated_college.full_name}"

# =============================================================================
# GRADUATED - SENIOR HIGH
# =============================================================================
graduated_shs = Student.create!(
  email: 'graduated.shs@example.com',
  password: 'password123',
  password_confirmation: 'password123',
  auth_id: '2025000000008',
  first_name: 'Miguel',
  middle_name: 'Castro',
  last_name: 'Hernandez',
  extension: nil
)

profile = graduated_shs.build_student_profile(
  # Personal Info
  civil_status: 'single',
  contact_number: '09241234567',
  sex: 'male',
  birthday: Date.new(2006, 12, 5),
  place_of_birth: 'Minglanilla',
  citizenship: 'Filipino',
  religion: 'Aglipayan',

  # Address
  house_number: '258',
  street_name: 'Lipata Road',
  barangay_name: 'Lipata',
  city_municipality: 'Minglanilla',
  province: 'Cebu',

  # Academic Info
  status: 'graduated',
  school_level: 'senior_high',
  year_level: '12',
  track: 'technical_vocational_livelihood',
  strand: 'TVL - Animation'
)

profile.previous_schools.build(
  school_type: 'senior_high',
  school_name: 'Your Institution Name',
  academic_year_from: 2022,
  academic_year_to: 2024,
  program: 'TVL - Animation',
  completed: true
)

profile.save!
puts "✓ Created Graduated Senior High Student: #{graduated_shs.full_name}"

# =============================================================================
# SUMMARY
# =============================================================================
puts "\n=========================================="
puts "Seed completed successfully!"
puts "=========================================="
puts "Total Users created: #{User.count}"
puts "  - Staff: #{Staff.count}"
puts "  - Students: #{Student.count}"
puts "Total Student Profiles: #{StudentProfile.count}"
puts "Total Previous Schools: #{PreviousSchool.count}"
puts "\n=========================================="
puts "LOGIN CREDENTIALS (all passwords: password123)"
puts "=========================================="
puts "Staff:"
puts "  Email: staff@example.com"
puts "\nCurrently Enrolled College:"
puts "  Email: enrolled.college@example.com"
puts "\nCurrently Enrolled Senior High:"
puts "  Email: enrolled.shs@example.com"
puts "\nTransferee College:"
puts "  Email: transferee.college@example.com"
puts "\nTransferee Senior High:"
puts "  Email: transferee.shs@example.com"
puts "\nReturnee College:"
puts "  Email: returnee.college@example.com"
puts "\nReturnee Senior High:"
puts "  Email: returnee.shs@example.com"
puts "\nGraduated College:"
puts "  Email: graduated.college@example.com"
puts "\nGraduated Senior High:"
puts "  Email: graduated.shs@example.com"
puts "=========================================="
