require "test_helper"

class Api::V1::DocumentRequestsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @student = students(:student_one)
    @other_student = students(:student_two)
    @document_type_one = document_types(:one)
    @document_type_two = document_types(:two)

    @document_request = DocumentRequest.create!(
      user_id: @student.id,
      status: 0,
      delivery_method: 0,
      payment_method: 0,
      payment_status: 0,
      payment_verified_at: 1_739_980_800,
      shipping_fee_cents: 10_000
    )
  end

  test "should require authentication for index" do
    get api_v1_document_requests_url, as: :json

    assert_response :unauthorized
  end

  test "should get only current_user document_requests" do
    own_request = @document_request
    other_request = DocumentRequest.create!(
      user_id: @other_student.id,
      status: 0,
      delivery_method: 1,
      payment_method: 1,
      payment_status: 0,
      payment_verified_at: 1_739_980_801,
      shipping_fee_cents: 5_000
    )

    sign_in_as(@student)

    get api_v1_document_requests_url, as: :json

    assert_response :success

    json_response = JSON.parse(response.body)
    ids = json_response.map { |record| record["id"] }

    assert_includes ids, own_request.id
    assert_not_includes ids, other_request.id
  end

  test "should create document_request with nested document_request_items" do
    sign_in_as(@student)

    assert_difference("DocumentRequest.count") do
      assert_difference("DocumentRequestItem.count") do
        post api_v1_document_requests_url,
             params: {
               document_request: {
                 user_id: @student.id,
                 status: 0,
                 delivery_method: 1,
                 payment_method: 1,
                 payment_status: 0,
                 payment_verified_at: 1_739_980_800,
                 shipping_fee_cents: 15_000,
                 document_request_items_attributes: [
                   {
                     document_type_id: @document_type_one.id,
                     quantity: 2,
                     purpose: "Scholarship",
                     destination: 0,
                     remarks: "Rush",
                     unit_price_cents: @document_type_one.price_cents
                   }
                 ]
               }
             },
             as: :json
      end
    end

    assert_response :created

    created_request = DocumentRequest.order(:id).last
    assert_equal @student.id, created_request.user_id
    assert_equal 1, created_request.document_request_items.count
    assert_equal @document_type_one.id, created_request.document_request_items.first.document_type_id
  end

  test "should update nested document_request_items including destroy" do
    sign_in_as(@student)

    existing_item = @document_request.document_request_items.create!(
      document_type: @document_type_one,
      quantity: 1,
      purpose: "Initial",
      destination: 0,
      remarks: "Keep copy",
      unit_price_cents: @document_type_one.price_cents
    )

    patch api_v1_document_request_url(@document_request),
          params: {
            document_request: {
              delivery_method: 2,
              document_request_items_attributes: [
                {
                  id: existing_item.id,
                  _destroy: true
                },
                {
                  document_type_id: @document_type_two.id,
                  quantity: 3,
                  purpose: "Transfer",
                  destination: 1,
                  remarks: "For school transfer",
                  unit_price_cents: @document_type_two.price_cents
                }
              ]
            }
          },
          as: :json

    assert_response :success

    @document_request.reload
    assert_not DocumentRequestItem.exists?(existing_item.id)
    assert_equal 1, @document_request.document_request_items.count

    item = @document_request.document_request_items.first
    assert_equal @document_type_two.id, item.document_type_id
    assert_equal 3, item.quantity
  end

  test "should return unprocessable_content when nested item uses non existing document_type" do
    sign_in_as(@student)

    assert_no_difference("DocumentRequest.count") do
      assert_no_difference("DocumentRequestItem.count") do
        post api_v1_document_requests_url,
             params: {
               document_request: {
                 user_id: @student.id,
                 status: 0,
                 delivery_method: 1,
                 payment_method: 1,
                 payment_status: 0,
                 payment_verified_at: 1_739_980_800,
                 shipping_fee_cents: 15_000,
                 document_request_items_attributes: [
                   {
                     document_type_id: 999_999_999,
                     quantity: 1,
                     purpose: "Invalid type",
                     destination: 0,
                     remarks: "Should fail",
                     unit_price_cents: 5000
                   }
                 ]
               }
             },
             as: :json
      end
    end

    assert_response :unprocessable_content
  end

  private

  def sign_in_as(user)
    post "/api/v1/users/sign_in",
         params: {
           user: {
             auth_id: user.auth_id,
             password: "password123"
           }
         },
         as: :json

    assert_response :success
  end
end
