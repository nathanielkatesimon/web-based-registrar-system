class DocumentRequestsController < ApplicationController
  before_action :set_document_request, only: %i[ show update destroy ]

  # GET /document_requests
  def index
    @document_requests = DocumentRequest.all

    render json: @document_requests
  end

  # GET /document_requests/1
  def show
    render json: @document_request
  end

  # POST /document_requests
  def create
    @document_request = DocumentRequest.new(document_request_params)

    if @document_request.save
      render json: @document_request, status: :created, location: @document_request
    else
      render json: @document_request.errors, status: :unprocessable_content
    end
  end

  # PATCH/PUT /document_requests/1
  def update
    if @document_request.update(document_request_params)
      render json: @document_request
    else
      render json: @document_request.errors, status: :unprocessable_content
    end
  end

  # DELETE /document_requests/1
  def destroy
    @document_request.destroy!
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_document_request
      @document_request = DocumentRequest.find(params.expect(:id))
    end

    # Only allow a list of trusted parameters through.
    def document_request_params
      params.expect(document_request: [ :user_id, :status, :delivery_method, :payment_method, :payment_status, :payment_verified_at, :shipping_fee_cents ])
    end
end
