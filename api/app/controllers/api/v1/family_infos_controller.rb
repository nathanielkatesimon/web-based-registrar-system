class Api::V1::FamilyInfosController < ApplicationController
  before_action :authenticate_user!
  before_action :set_family_info, only: [:show, :update]

  # GET /api/v1/family_infos/:id
  def show
    render json: @family_info
  end

  # PATCH/PUT /api/v1/family_infos/:id
  def update
    if @family_info.update(family_info_params)
      render json: @family_info
    else
      render json: { errors: @family_info.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def set_family_info
    @family_info =
      if params[:id] == "personal_info"
        if current_user.respond_to?(:family_info)
          current_user.family_info || current_user.try(:create_family_info)
        end
      else
        FamilyInfo.find(params[:id])
      end

    raise ActiveRecord::RecordNotFound unless @family_info
  end

  def family_info_params
    params.require(:family_info).permit(
      :father_first_name,
      :father_middle_name,
      :father_last_name,
      :father_extension,
      :father_home_address,
      :father_occupation,
      :father_office_company_name,
      :father_company_address,
      :father_contact_number,
      :father_email_address,
      :mother_first_name,
      :mother_middle_name,
      :mother_last_name,
      :mother_extension,
      :mother_home_address,
      :mother_occupation,
      :mother_office_company_name,
      :mother_company_address,
      :mother_contact_number,
      :mother_email_address,
      :guardian_first_name,
      :guardian_middle_name,
      :guardian_last_name,
      :guardian_extension,
      :guardian_home_address,
      :guardian_occupation,
      :guardian_office_company_name,
      :guardian_company_address,
      :guardian_contact_number,
      :guardian_email_address
    )
  end
end
