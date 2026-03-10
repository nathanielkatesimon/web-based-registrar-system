require "test_helper"

class Api::V1::NotificationsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @student = students(:student_one)
    @other_student = students(:student_two)
    @staff = staffs(:staff_one)

    @document_request = DocumentRequest.new(
      user_id: @student.id,
      status: :on_hold,
      delivery_method: :self_pickup,
      payment_method: :cash,
      payment_status: :not_paid,
      shipping_fee_cents: 10_000
    )
    @document_request.id_verification_photo.attach(id_photo_file)
    @document_request.save!

    @notification = Notification.create!(
      student: @student,
      document_request: @document_request,
      kind: :document_request_status,
      title: "Request now processing",
      message: "#{@document_request.request_id} is now being processed by the Registrar.",
      link_url: "/student/dashboard/tracker?request=#{@document_request.request_id}"
    )
  end

  test "should require authentication for index" do
    get api_v1_notifications_url, as: :json

    assert_response :unauthorized
  end

  test "should list only current student notifications" do
    other_request = DocumentRequest.new(
      user_id: @other_student.id,
      status: :processing,
      delivery_method: :self_pickup,
      payment_method: :cash,
      payment_status: :paid,
      shipping_fee_cents: 5_000
    )
    other_request.id_verification_photo.attach(id_photo_file)
    other_request.save!

    Notification.create!(
      student: @other_student,
      document_request: other_request,
      kind: :document_request_status,
      title: "Request completed",
      message: "#{other_request.request_id} has been completed.",
      link_url: "/student/dashboard/tracker?request=#{other_request.request_id}"
    )

    sign_in_as(@student)

    get api_v1_notifications_url, as: :json

    assert_response :success

    json_response = JSON.parse(response.body)

    assert_equal 1, json_response.length
    assert_equal @notification.id, json_response.first["id"]
    assert_equal @document_request.request_id, json_response.first.dig("document_request", "request_id")
    assert_equal "/student/dashboard/tracker?request=#{@document_request.request_id}", json_response.first["link_url"]
  end

  test "should mark own notification as read" do
    sign_in_as(@student)

    patch read_api_v1_notification_url(@notification), as: :json

    assert_response :success
    assert @notification.reload.read_at.present?
  end

  test "should reject staff access with forbidden" do
    sign_in_as(@staff)

    get api_v1_notifications_url, as: :json

    assert_response :forbidden
  end

  test "should not allow reading another student's notification" do
    other_request = DocumentRequest.new(
      user_id: @other_student.id,
      status: :processing,
      delivery_method: :self_pickup,
      payment_method: :cash,
      payment_status: :paid,
      shipping_fee_cents: 5_000
    )
    other_request.id_verification_photo.attach(id_photo_file)
    other_request.save!

    other_notification = Notification.create!(
      student: @other_student,
      document_request: other_request,
      kind: :document_request_status,
      title: "Request completed",
      message: "#{other_request.request_id} has been completed.",
      link_url: "/student/dashboard/tracker?request=#{other_request.request_id}"
    )

    sign_in_as(@student)

    patch read_api_v1_notification_url(other_notification), as: :json

    assert_response :not_found
  end

  private

  def id_photo_file
    Rack::Test::UploadedFile.new(
      Rails.root.join("test/fixtures/files/id_verification_photo.jpg"),
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
