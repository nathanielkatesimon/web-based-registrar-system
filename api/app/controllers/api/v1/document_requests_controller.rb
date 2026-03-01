class Api::V1::DocumentRequestsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_document_request, only: %i[ show update destroy ]

  # GET /document_requests
  def index
    @document_requests = current_user.document_requests

    render json: @document_requests
  end

  # GET /document_requests/1
  def show
    render json: @document_request
  end

  # POST /document_requests
  def create
    @document_request = current_user.document_requests.new(document_request_params)

    if @document_request.save
      render json: @document_request, status: :created
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
      @document_request = current_user.document_requests.find(params.expect(:id))
    end

    # Only allow a list of trusted parameters through.
    def document_request_params
      params.require(:document_request).permit([
        :status,
        :delivery_method,
        :courier_name,
        :payment_method,
        :payment_status,
        :payment_verified_at,
        :shipping_fee_cents,
        :id_verification_photo,
        :payment_receipt,
        document_request_items_attributes: [
            :id,
            :document_type_id,
            :quantity,
            :purpose,
            :destination,
            :remarks,
            :_destroy
        ]
      ])
    end
end
