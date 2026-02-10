class StudentProfilesController < ApplicationController
  before_action :set_student_profile, only: %i[ show update destroy ]

  # GET /student_profiles
  def index
    @student_profiles = StudentProfile.all

    render json: @student_profiles
  end

  # GET /student_profiles/1
  def show
    render json: @student_profile
  end

  # POST /student_profiles
  def create
    @student_profile = StudentProfile.new(student_profile_params)

    if @student_profile.save
      render json: @student_profile, status: :created, location: @student_profile
    else
      render json: @student_profile.errors, status: :unprocessable_content
    end
  end

  # PATCH/PUT /student_profiles/1
  def update
    if @student_profile.update(student_profile_params)
      render json: @student_profile
    else
      render json: @student_profile.errors, status: :unprocessable_content
    end
  end

  # DELETE /student_profiles/1
  def destroy
    @student_profile.destroy!
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_student_profile
      @student_profile = StudentProfile.find(params.expect(:id))
    end

    # Only allow a list of trusted parameters through.
    def student_profile_params
      params.expect(student_profile: [ :user_id, :civil_status, :contact_number, :sex, :birthday, :place_of_birth, :citizenship, :religion, :house_number, :street_name, :barangay_name, :city_municipality, :province, :status, :school_level, :year_level, :course, :department, :strand, :track ])
    end
end
