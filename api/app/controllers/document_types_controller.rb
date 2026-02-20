class DocumentTypesController < ApplicationController
  before_action :set_document_type, only: %i[ show update destroy ]

  # GET /document_types
  def index
    @document_types = DocumentType.all

    render json: @document_types
  end

  # GET /document_types/1
  def show
    render json: @document_type
  end

  # POST /document_types
  def create
    @document_type = DocumentType.new(document_type_params)

    if @document_type.save
      render json: @document_type, status: :created, location: @document_type
    else
      render json: @document_type.errors, status: :unprocessable_content
    end
  end

  # PATCH/PUT /document_types/1
  def update
    if @document_type.update(document_type_params)
      render json: @document_type
    else
      render json: @document_type.errors, status: :unprocessable_content
    end
  end

  # DELETE /document_types/1
  def destroy
    @document_type.destroy!
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_document_type
      @document_type = DocumentType.find(params.expect(:id))
    end

    # Only allow a list of trusted parameters through.
    def document_type_params
      params.expect(document_type: [ :name, :price_cents ])
    end
end
