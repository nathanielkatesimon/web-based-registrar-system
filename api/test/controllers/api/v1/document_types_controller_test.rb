require "test_helper"

class Api::V1::DocumentTypesControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get api_v1_document_types_url, as: :json
    assert_response :success

    payload = JSON.parse(response.body)

    assert_kind_of Array, payload
    assert_equal DocumentType.count, payload.length

    expected_ids = DocumentType.pluck(:id).sort
    returned_ids = payload.map { |item| item["id"] }.sort
    assert_equal expected_ids, returned_ids

    payload.each do |item|
      assert_includes item.keys, "id"
      assert_includes item.keys, "name"
      assert_includes item.keys, "price_cents"
    end
  end
end
