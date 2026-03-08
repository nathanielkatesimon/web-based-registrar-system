class Api::V1::StaffsController < ApplicationController
  before_action :set_staff, only: [:show, :update, :destroy]

  # GET /api/v1/staffs/:id
  def show
    render json: staff_json(@staff)
  end

  # POST /api/v1/staffs
  def create
    @staff = Staff.new(staff_params)

    if @staff.save
      render json: staff_json(@staff), status: :created
    else
      render json: { errors: @staff.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/staffs/:id
  def update
    if @staff.update(staff_params)
      render json: staff_json(@staff)
    else
      render json: { errors: @staff.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/staffs/:id
  def destroy
    @staff.destroy
    head :no_content
  end

  private

  def set_staff
    @staff = Staff.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Staff not found' }, status: :not_found
  end

  def staff_params
    params.require(:staff).permit(
      :email,
      :password,
      :password_confirmation,
      :avatar,
      :auth_id,
      :first_name,
      :middle_name,
      :last_name,
      :extension
    )
  end

  def staff_json(staff)
    {
      id: staff.id,
      type: staff.type,
      email: staff.email,
      auth_id: staff.auth_id,
      first_name: staff.first_name,
      middle_name: staff.middle_name,
      last_name: staff.last_name,
      extension: staff.extension,
      full_name: staff.full_name,
      avatar_url: staff.avatar.attached? ? Rails.application.routes.url_helpers.rails_blob_path(staff.avatar, only_path: true) : nil,
      created_at: staff.created_at,
      updated_at: staff.updated_at
    }
  end
end
