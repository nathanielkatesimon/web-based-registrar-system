class Api::V1::DeficienciesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_deficiency, only: %i[show update]
  before_action :authorize_staff!, only: [:update]

  # GET /api/v1/deficiencies/:id
  def show
    render json: @deficiency
  end

  # PATCH/PUT /api/v1/deficiencies/:id
  def update
    if @deficiency.update(deficiency_params)
      render json: @deficiency
    else
      render json: { errors: @deficiency.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def set_deficiency
    @deficiency =
      if params[:id] == "personal_info"
        return render(json: {}, status: :not_found) unless current_user.is_a?(Student)

        current_user.deficiency || current_user.create_deficiency
      else
        Deficiency.find(params[:id])
      end
  rescue ActiveRecord::RecordNotFound
    render json: {}, status: :not_found
  end

  def authorize_staff!
    return if current_user.is_a?(Staff)

    render json: {}, status: :forbidden
  end

  def deficiency_params
    params.require(:deficiency).permit(*Deficiency::FIELDS)
  end
end
