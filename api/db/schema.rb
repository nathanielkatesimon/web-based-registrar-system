# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_02_27_010000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "record_id", null: false
    t.string "record_type", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.string "content_type"
    t.datetime "created_at", null: false
    t.string "filename", null: false
    t.string "key", null: false
    t.text "metadata"
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "document_request_items", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "destination"
    t.bigint "document_request_id", null: false
    t.bigint "document_type_id", null: false
    t.string "purpose"
    t.integer "quantity"
    t.string "remarks"
    t.integer "unit_price_cents"
    t.datetime "updated_at", null: false
    t.index ["document_request_id"], name: "index_document_request_items_on_document_request_id"
    t.index ["document_type_id"], name: "index_document_request_items_on_document_type_id"
  end

  create_table "document_requests", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "delivery_method"
    t.integer "payment_method"
    t.integer "payment_status"
    t.integer "payment_verified_at"
    t.integer "shipping_fee_cents"
    t.integer "status"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["user_id"], name: "index_document_requests_on_user_id"
  end

  create_table "document_types", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name"
    t.integer "price_cents"
    t.datetime "updated_at", null: false
  end

  create_table "family_infos", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "father_company_address"
    t.string "father_contact_number"
    t.string "father_email_address"
    t.string "father_extension"
    t.string "father_first_name"
    t.string "father_home_address"
    t.string "father_last_name"
    t.string "father_middle_name"
    t.string "father_occupation"
    t.string "father_office_company_name"
    t.string "guardian_company_address"
    t.string "guardian_contact_number"
    t.string "guardian_email_address"
    t.string "guardian_extension"
    t.string "guardian_first_name"
    t.string "guardian_home_address"
    t.string "guardian_last_name"
    t.string "guardian_middle_name"
    t.string "guardian_occupation"
    t.string "guardian_office_company_name"
    t.string "mother_company_address"
    t.string "mother_contact_number"
    t.string "mother_email_address"
    t.string "mother_extension"
    t.string "mother_first_name"
    t.string "mother_home_address"
    t.string "mother_last_name"
    t.string "mother_middle_name"
    t.string "mother_occupation"
    t.string "mother_office_company_name"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["user_id"], name: "index_family_infos_on_user_id", unique: true
  end

  create_table "student_profiles", force: :cascade do |t|
    t.string "barangay_name"
    t.date "birthday"
    t.string "citizenship"
    t.string "city_municipality"
    t.string "civil_status"
    t.string "contact_number"
    t.string "course"
    t.datetime "created_at", null: false
    t.string "current_college_department_track"
    t.string "current_college_level"
    t.string "current_college_program"
    t.string "current_college_school_name"
    t.integer "current_college_year_from"
    t.integer "current_college_year_to"
    t.string "current_senior_high_department_track"
    t.string "current_senior_high_level"
    t.string "current_senior_high_program"
    t.string "current_senior_high_school_name"
    t.integer "current_senior_high_year_from"
    t.integer "current_senior_high_year_to"
    t.string "department"
    t.string "house_number"
    t.string "place_of_birth"
    t.string "prev_college_department_track"
    t.string "prev_college_level"
    t.string "prev_college_program"
    t.string "prev_college_school_name"
    t.integer "prev_college_year_from"
    t.integer "prev_college_year_to"
    t.string "prev_senior_high_department_track"
    t.string "prev_senior_high_level"
    t.string "prev_senior_high_program"
    t.string "prev_senior_high_school_name"
    t.integer "prev_senior_high_year_from"
    t.integer "prev_senior_high_year_to"
    t.string "province"
    t.string "religion"
    t.string "school_level"
    t.string "sex"
    t.string "status"
    t.string "strand"
    t.string "street_name"
    t.string "track"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.string "year_level"
    t.index ["user_id"], name: "index_student_profiles_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "auth_id", default: "", null: false
    t.datetime "created_at", null: false
    t.string "email", default: ""
    t.string "encrypted_password", default: "", null: false
    t.string "extension"
    t.string "first_name"
    t.string "last_name"
    t.string "middle_name"
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.string "type", null: false
    t.datetime "updated_at", null: false
    t.index ["auth_id"], name: "index_users_on_auth_id", unique: true
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["type"], name: "index_users_on_type"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "document_request_items", "document_requests"
  add_foreign_key "document_request_items", "document_types"
  add_foreign_key "document_requests", "users"
  add_foreign_key "family_infos", "users"
  add_foreign_key "student_profiles", "users"
end
