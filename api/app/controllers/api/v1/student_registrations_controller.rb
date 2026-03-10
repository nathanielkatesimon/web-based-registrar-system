class Api::V1::StudentRegistrationsController < Devise::RegistrationsController
  prepend_before_action :reject_authenticated_user, only: [:create]
  prepend_before_action :set_minimum_password_length, only: []
  skip_before_action :verify_authenticity_token, only: [:create]

  def create
    existing_claimable_student = Student.find_by(auth_id: sign_up_params[:auth_id], claimed: false)
    if existing_claimable_student
      existing_claimable_student.deliver_account_claim_instructions!
      render json: {
        claim_required: true,
        message: "This account was already created by a staff. We sent an email so you can create your password."
      }, status: :accepted
      return
    end

    build_resource(sign_up_params.merge(type: "Student", claimed: true))
    resource.student_profile.registration_flow = true if resource.student_profile

    resource.save
    yield resource if block_given?
    if resource.persisted?
      if resource.active_for_authentication?
        sign_up(resource_name, resource)
        respond_with resource, location: after_sign_up_path_for(resource)
      else
        expire_data_after_sign_in!
        respond_with resource, location: after_inactive_sign_up_path_for(resource)
      end
    else
      clean_up_passwords resource
      set_minimum_password_length
      respond_with resource
    end
  end

  private

  def reject_authenticated_user
    return unless user_signed_in?

    render json: { message: I18n.t("devise.failure.already_authenticated") }, status: :ok
  end

  def sign_up_params
    params.require(:user).permit(
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

  def respond_with(resource, _opts = {})
    if resource.persisted?
      render json: {
        user: resource.as_json(
          only: [:id, :auth_id, :type, :claimed],
          include: {
            student_profile: {}
          }
        )
      }, status: :created
    else
      render json: {
        errors: resource.errors.full_messages
      }, status: :unprocessable_entity
    end
  end
end
