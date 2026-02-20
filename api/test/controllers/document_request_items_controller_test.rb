require "test_helper"

class DocumentRequestItemsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @document_request_item = document_request_items(:one)
  end

  test "should get index" do
    get document_request_items_url, as: :json
    assert_response :success
  end

  test "should create document_request_item" do
    assert_difference("DocumentRequestItem.count") do
      post document_request_items_url, params: { document_request_item: { destination: @document_request_item.destination, document_request_id: @document_request_item.document_request_id, document_type_id: @document_request_item.document_type_id, purpose: @document_request_item.purpose, quantity: @document_request_item.quantity, remarks: @document_request_item.remarks, unit_price_cents: @document_request_item.unit_price_cents } }, as: :json
    end

    assert_response :created
  end

  test "should show document_request_item" do
    get document_request_item_url(@document_request_item), as: :json
    assert_response :success
  end

  test "should update document_request_item" do
    patch document_request_item_url(@document_request_item), params: { document_request_item: { destination: @document_request_item.destination, document_request_id: @document_request_item.document_request_id, document_type_id: @document_request_item.document_type_id, purpose: @document_request_item.purpose, quantity: @document_request_item.quantity, remarks: @document_request_item.remarks, unit_price_cents: @document_request_item.unit_price_cents } }, as: :json
    assert_response :success
  end

  test "should destroy document_request_item" do
    assert_difference("DocumentRequestItem.count", -1) do
      delete document_request_item_url(@document_request_item), as: :json
    end

    assert_response :no_content
  end
end
