class Api::V1::DocumentTypesController < ApplicationController
  before_action :authenticate_user!, only: %i[create update destroy]
  before_action :authorize_staff!, only: %i[create update destroy]
  before_action :set_document_type, only: %i[show update destroy]

  def index
    render json: DocumentType.all
  end

  def show
    render json: @document_type
  end

  def create
    @document_type = DocumentType.new(document_type_params)

    if @document_type.save
      render json: @document_type, status: :created
    else
      render json: @document_type.errors, status: :unprocessable_content
    end
  end

  def update
    if @document_type.update(document_type_params)
      render json: @document_type
    else
      render json: @document_type.errors, status: :unprocessable_content
    end
  end

  def destroy
    @document_type.destroy!
    head :no_content
  end

  private

  def set_document_type
    @document_type = DocumentType.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Document type not found." }, status: :not_found
  end

  def document_type_params
    params.require(:document_type).permit(:name, :price_cents)
  end

  def authorize_staff!
    return if current_user.is_a?(Staff)

    render json: { error: "Staff access required." }, status: :forbidden
  end
end
