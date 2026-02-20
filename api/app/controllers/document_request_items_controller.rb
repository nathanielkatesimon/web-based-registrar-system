class DocumentRequestItemsController < ApplicationController
  before_action :set_document_request_item, only: %i[ show update destroy ]

  # GET /document_request_items
  def index
    @document_request_items = DocumentRequestItem.all

    render json: @document_request_items
  end

  # GET /document_request_items/1
  def show
    render json: @document_request_item
  end

  # POST /document_request_items
  def create
    @document_request_item = DocumentRequestItem.new(document_request_item_params)

    if @document_request_item.save
      render json: @document_request_item, status: :created, location: @document_request_item
    else
      render json: @document_request_item.errors, status: :unprocessable_content
    end
  end

  # PATCH/PUT /document_request_items/1
  def update
    if @document_request_item.update(document_request_item_params)
      render json: @document_request_item
    else
      render json: @document_request_item.errors, status: :unprocessable_content
    end
  end

  # DELETE /document_request_items/1
  def destroy
    @document_request_item.destroy!
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_document_request_item
      @document_request_item = DocumentRequestItem.find(params.expect(:id))
    end

    # Only allow a list of trusted parameters through.
    def document_request_item_params
      params.expect(document_request_item: [ :document_request_id, :document_type_id, :quantity, :purpose, :destination, :remarks, :unit_price_cents ])
    end
end
