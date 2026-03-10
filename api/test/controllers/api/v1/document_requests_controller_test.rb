require "test_helper"

class Api::V1::DocumentRequestsControllerTest < ActionDispatch::IntegrationTest
  include ActionDispatch::TestProcess::FixtureFile

  setup do
    @student = students(:student_one)
    @other_student = students(:student_two)
    @staff = staffs(:staff_one)
    @document_type_one = document_types(:one)
    @document_type_two = document_types(:two)

    @document_request = DocumentRequest.new(
      user_id: @student.id,
      status: :on_hold,
      delivery_method: :self_pickup,
      payment_method: :cash,
      payment_status: :not_paid,
      payment_verified_at: 1_739_980_800,
      shipping_fee_cents: 10_000
    )
    @document_request.id_verification_photo.attach(id_photo_file)
    @document_request.save!
  end

  test "should require authentication for index" do
    get api_v1_document_requests_url, as: :json

    assert_response :unauthorized
  end

  test "should get only current_user document_requests" do
    own_request = @document_request
    own_ticket = EscalationTicket.create!(
      student: @student,
      document_request: own_request,
      subject: "Follow-up on request"
    )
    other_request = DocumentRequest.new(
      user_id: @other_student.id,
      status: :on_hold,
      delivery_method: :self_pickup,
      payment_method: :cash,
      payment_status: :not_paid,
      payment_verified_at: 1_739_980_801,
      shipping_fee_cents: 5_000
    )
    other_request.id_verification_photo.attach(id_photo_file)
    other_request.save!

    sign_in_as(@student)

    get api_v1_document_requests_url, as: :json

    assert_response :success

    json_response = JSON.parse(response.body)
    ids = json_response.map { |record| record["id"] }

    assert_includes ids, own_request.id
    assert_not_includes ids, other_request.id
    own_request_payload = json_response.find { |record| record["id"] == own_request.id }
    assert_equal own_ticket.id, own_request_payload.dig("escalation_ticket", "id")
  end

  test "should create document_request with nested document_request_items" do
    sign_in_as(@student)

    assert_difference("DocumentRequest.count") do
      assert_difference("DocumentRequestItem.count") do
        assert_difference("RequestTimeLine.count", 1) do
          post api_v1_document_requests_url,
               params: {
                 document_request: {
                   user_id: @other_student.id,
                   status: :on_hold,
                   delivery_method: :courier_delivery,
                   courier_name: "LBC",
                   payment_method: :online,
                   payment_status: :under_review,
                   payment_verified_at: 1_739_980_800,
                   shipping_fee_cents: 15_000,
                   id_verification_photo: id_photo_file,
                   payment_receipt: payment_receipt_file,
                   document_request_items_attributes: [
                     {
                       document_type_id: @document_type_one.id,
                       quantity: 2,
                       purpose: "Scholarship",
                       destination: 0,
                       remarks: "Rush",
                       unit_price_cents: 999_999
                     }
                   ]
                 }
               }
        end
      end
    end

    assert_response :created

    created_request = DocumentRequest.order(:id).last
    assert_equal @student.id, created_request.user_id
    assert_equal 1, created_request.document_request_items.count
    assert_equal @document_type_one.id, created_request.document_request_items.first.document_type_id
    assert_equal @document_type_one.price_cents, created_request.document_request_items.first.unit_price_cents
    assert created_request.request_time_lines.exists?(type: :request_submitted)
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
              delivery_method: :courier_delivery,
              courier_name: "J&T",
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
          }, as: :json

    assert_response :success

    @document_request.reload
    assert_not DocumentRequestItem.exists?(existing_item.id)
    assert_equal 1, @document_request.document_request_items.count

    item = @document_request.document_request_items.first
    assert_equal @document_type_two.id, item.document_type_id
    assert_equal 3, item.quantity
  end

  test "should create notification when status changes" do
    sign_in_as(@staff)

    assert_difference("Notification.count", 1) do
      patch api_v1_document_request_url(@document_request),
            params: { document_request: { status: :processing } },
            as: :json
    end

    assert_response :success

    notification = Notification.order(:id).last
    assert_equal @student.id, notification.student_id
    assert_equal @document_request.id, notification.document_request_id
    assert_equal "document_request_status", notification.kind
    assert_equal "/student/dashboard/tracker?request=#{@document_request.reload.request_id}", notification.link_url
    assert_match(/being processed/i, notification.message)
  end

  test "should return unprocessable_content when nested item uses non existing document_type" do
    sign_in_as(@student)

    assert_no_difference("DocumentRequest.count") do
      assert_no_difference("DocumentRequestItem.count") do
        post api_v1_document_requests_url,
             params: {
               document_request: {
                 status: :on_hold,
                 delivery_method: :courier_delivery,
                 courier_name: "LBC",
                 payment_method: :online,
                 payment_status: :under_review,
                 payment_verified_at: 1_739_980_800,
                 shipping_fee_cents: 15_000,
                 id_verification_photo: id_photo_file,
                 payment_receipt: payment_receipt_file,
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
             }
      end
    end

    assert_response :unprocessable_content
  end

  test "should return unprocessable_content when online payment has no receipt" do
    sign_in_as(@student)

    assert_no_difference("DocumentRequest.count") do
      post api_v1_document_requests_url,
           params: {
             document_request: {
               status: :on_hold,
               delivery_method: :self_pickup,
               payment_method: :online,
               payment_status: :under_review,
               shipping_fee_cents: 5000,
               id_verification_photo: id_photo_file,
               document_request_items_attributes: [
                 {
                   document_type_id: @document_type_one.id,
                   quantity: 1
                 }
               ]
             }
           }
    end

    assert_response :unprocessable_content
  end

  test "should return unprocessable_content when courier delivery has no courier_name" do
    sign_in_as(@student)

    assert_no_difference("DocumentRequest.count") do
      post api_v1_document_requests_url,
           params: {
             document_request: {
               status: :on_hold,
               delivery_method: :courier_delivery,
               payment_method: :cash,
               payment_status: :not_paid,
               shipping_fee_cents: 5000,
               id_verification_photo: id_photo_file,
               document_request_items_attributes: [
                 {
                   document_type_id: @document_type_one.id,
                   quantity: 1
                 }
               ]
             }
           }
    end

    assert_response :unprocessable_content
  end

  test "should not allow accessing another users document request" do
    other_request = DocumentRequest.new(
      user_id: @other_student.id,
      status: :on_hold,
      delivery_method: :self_pickup,
      payment_method: :cash,
      payment_status: :not_paid,
      shipping_fee_cents: 5000
    )
    other_request.id_verification_photo.attach(id_photo_file)
    other_request.save!

    sign_in_as(@student)

    get api_v1_document_request_url(other_request), as: :json

    assert_response :not_found
  end

  test "should add request_opened timeline only once when staff views document_request" do
    assert_not @document_request.request_time_lines.exists?(type: :request_opened)

    sign_in_as(@staff)

    assert_difference("RequestTimeLine.where(type: :request_opened).count", 1) do
      get api_v1_document_request_url(@document_request), as: :json
      assert_response :success
    end

    assert_no_difference("RequestTimeLine.where(type: :request_opened).count") do
      get api_v1_document_request_url(@document_request), as: :json
      assert_response :success
    end
  end

  private

  def id_photo_file
    Rack::Test::UploadedFile.new(
      Rails.root.join("test/fixtures/files/id_verification_photo.jpg"),
      "image/jpeg"
    )
  end

  def payment_receipt_file
    Rack::Test::UploadedFile.new(
      Rails.root.join("test/fixtures/files/payment_receipt.jpg"),
      "image/jpeg"
    )
  end

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
