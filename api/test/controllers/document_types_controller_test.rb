require "test_helper"

class DocumentTypesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @document_type = document_types(:one)
  end

  test "should get index" do
    get document_types_url, as: :json
    assert_response :success
  end

  test "should create document_type" do
    assert_difference("DocumentType.count") do
      post document_types_url, params: { document_type: { name: @document_type.name, price_cents: @document_type.price_cents } }, as: :json
    end

    assert_response :created
  end

  test "should show document_type" do
    get document_type_url(@document_type), as: :json
    assert_response :success
  end

  test "should update document_type" do
    patch document_type_url(@document_type), params: { document_type: { name: @document_type.name, price_cents: @document_type.price_cents } }, as: :json
    assert_response :success
  end

  test "should destroy document_type" do
    assert_difference("DocumentType.count", -1) do
      delete document_type_url(@document_type), as: :json
    end

    assert_response :no_content
  end
end
