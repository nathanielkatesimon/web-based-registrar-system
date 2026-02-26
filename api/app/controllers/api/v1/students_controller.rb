class Api::V1::StudentsController < ApplicationController
  before_action :authenticate_user!, only: [:show, :update, :destroy]
  before_action :set_student, only: [:show, :update, :destroy]

  # GET /api/v1/students/personal_info
  def show
    render json: @student
  end

  # POST /api/v1/students
  def create
    @student = Student.new(student_params)

    if @student.save
      render json: @student, status: :created
    else
      render json: { errors: @student.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/students/personal_info
  def update
    if @student.update(filtered_student_params)
      refresh_session_for_self_update!
      render json: @student
    else
      render json: { errors: @student.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/students
  def destroy
    @student.destroy
    head :no_content
  end

  private

  def set_student
    @student = if params[:id] == "personal_info"
                 current_user
               else
                 Student.find(params[:id])
               end
  end

  def filtered_student_params
    attrs = student_params.to_h

    if !current_user.is_a?(Student) || current_user != @student
      attrs.except!("email", "password", "password_confirmation")
    end

    attrs
  end

  def refresh_session_for_self_update!
    return unless current_user.is_a?(Student)
    return unless current_user == @student

    # Devise stores auth-related salt in session. Password updates change this salt,
    # so refresh the signed-in session to avoid immediate logout.
    bypass_sign_in(@student, scope: :user)
  end

  def student_params
    params.require(:student).permit(
      :email,
      :password,
      :password_confirmation,
      :auth_id,
      :first_name,
      :middle_name,
      :last_name,
      :extension,
      student_profile_attributes: [
        :id,
        :civil_status,
        :contact_number,
        :sex,
        :birthday,
        :place_of_birth,
        :citizenship,
        :religion,
        :house_number,
        :street_name,
        :barangay_name,
        :city_municipality,
        :province,
        :status,
        :school_level,
        :year_level,
        :course,
        :department,
        :strand,
        :track,
        :current_college_school_name,
        :current_college_program,
        :current_college_level,
        :current_college_year_from,
        :current_college_year_to,
        :current_college_department_track,
        :prev_college_school_name,
        :prev_college_program,
        :prev_college_level,
        :prev_college_year_from,
        :prev_college_year_to,
        :prev_college_department_track,
        :current_senior_high_school_name,
        :current_senior_high_program,
        :current_senior_high_level,
        :current_senior_high_year_from,
        :current_senior_high_year_to,
        :current_senior_high_department_track,
        :prev_senior_high_school_name,
        :prev_senior_high_program,
        :prev_senior_high_level,
        :prev_senior_high_year_from,
        :prev_senior_high_year_to,
        :prev_senior_high_department_track
      ]
    )
  end
end
