class Api::V1::StudentRegistrationsController < Devise::RegistrationsController
  prepend_before_action :require_no_authentication, only: [:create]
  prepend_before_action :set_minimum_password_length, only: []

  def create
    build_resource(sign_up_params.merge(type: "Student"))

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
        previous_schools_attributes: [
          :id,
          :school_type,
          :school_name,
          :academic_year_from,
          :academic_year_to,
          :program,
          :completed,
          :_destroy
        ]
      ]
    )
  end

  def respond_with(resource, _opts = {})
    if resource.persisted?
      render json: {
        user: resource.as_json(
          only: [:id, :auth_id, :type],
          include: {
            student_profile: {
              include: :previous_schools
            }
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
