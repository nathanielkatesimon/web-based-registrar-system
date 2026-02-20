require "test_helper"

class DocumentRequestsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @document_request = document_requests(:one)
  end

  test "should get index" do
    get document_requests_url, as: :json
    assert_response :success
  end

  test "should create document_request" do
    assert_difference("DocumentRequest.count") do
      post document_requests_url, params: { document_request: { delivery_method: @document_request.delivery_method, payment_method: @document_request.payment_method, payment_status: @document_request.payment_status, payment_verified_at: @document_request.payment_verified_at, shipping_fee_cents: @document_request.shipping_fee_cents, status: @document_request.status, user_id: @document_request.user_id } }, as: :json
    end

    assert_response :created
  end

  test "should show document_request" do
    get document_request_url(@document_request), as: :json
    assert_response :success
  end

  test "should update document_request" do
    patch document_request_url(@document_request), params: { document_request: { delivery_method: @document_request.delivery_method, payment_method: @document_request.payment_method, payment_status: @document_request.payment_status, payment_verified_at: @document_request.payment_verified_at, shipping_fee_cents: @document_request.shipping_fee_cents, status: @document_request.status, user_id: @document_request.user_id } }, as: :json
    assert_response :success
  end

  test "should destroy document_request" do
    assert_difference("DocumentRequest.count", -1) do
      delete document_request_url(@document_request), as: :json
    end

    assert_response :no_content
  end
end
