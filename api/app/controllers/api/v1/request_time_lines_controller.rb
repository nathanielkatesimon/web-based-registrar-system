class Api::V1::RequestTimeLinesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_document_request
  before_action :set_request_time_line, only: %i[ show update destroy ]

  # GET /document_requests/:document_request_id/request_time_lines/:id
  def show
    render json: @request_time_line
  end

  # POST /document_requests/:document_request_id/request_time_lines
  def create
    @request_time_line = @document_request.request_time_lines.new(request_time_line_params)

    if @request_time_line.save
      render json: @request_time_line, status: :created
    else
      render json: @request_time_line.errors, status: :unprocessable_content
    end
  end

  # PATCH/PUT /document_requests/:document_request_id/request_time_lines/:id
  def update
    if @request_time_line.update(request_time_line_params)
      render json: @request_time_line
    else
      render json: @request_time_line.errors, status: :unprocessable_content
    end
  end

  # DELETE /document_requests/:document_request_id/request_time_lines/:id
  def destroy
    @request_time_line.destroy!
  end

  private
    def set_document_request
      @document_request = document_requests_scope.find(params.expect(:document_request_id))
    end

    def set_request_time_line
      @request_time_line = @document_request.request_time_lines.find(params.expect(:id))
    end

    def document_requests_scope
      return DocumentRequest.all if current_user.is_a?(Staff)

      current_user.document_requests
    end

    def request_time_line_params
      params.expect(request_time_line: [ :type ])
    end
end
