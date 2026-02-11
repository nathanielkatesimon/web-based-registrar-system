class Api::V1::StudentProfilesController < ApplicationController
  before_action :set_student_profile, only: %i[ show update ]

  # GET /api/v1/student_profiles
  def index
    @student_profiles = StudentProfile.all

    render json: @student_profiles
  end

  # GET /api/v1/student_profiles/1
  def show
    render json: @student_profile
  end

  # PATCH/PUT /api/v1/student_profiles/1
  def update
    if @student_profile.update(student_profile_params)
      render json: @student_profile
    else
      render json: @student_profile.errors, status: :unprocessable_content
    end
  rescue
    render json: {}, status: :unprocessable_content
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_student_profile
      @student_profile = StudentProfile.find(params.expect(:id))

    rescue
      render json: {}, status: :not_found
    end

    # Only allow a list of trusted parameters through.
    def student_profile_params
      params.expect(student_profile: [
        :user_id, :civil_status, :contact_number, :sex, :birthday, :place_of_birth,
        :citizenship, :religion, :house_number, :street_name, :barangay_name, :city_municipality,
        :province, :status, :school_level, :year_level, :course, :department, :strand, :track,
        {
          previous_schools_attributes: [
          [ :id, :school_type, :school_name, :academic_year_from, :academic_year_to, :program, :completed ]
          ]
        }
      ])
    end
end
