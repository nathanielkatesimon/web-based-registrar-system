require "test_helper"

class Api::V1::EscalationMessagesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @student = students(:student_one)
    @other_student = students(:student_two)
    @staff = staffs(:staff_one)
    @student_request = create_document_request_for(@student)
    @other_student_request = create_document_request_for(@other_student)

    @ticket = EscalationTicket.create!(
      student: @student,
      document_request: @student_request,
      subject: "Urgent concern"
    )
    @ticket.escalation_messages.create!(sender: @student, body: "First message")
  end

  test "should require authentication for messages index" do
    get api_v1_escalation_ticket_escalation_messages_url(@ticket), as: :json

    assert_response :unauthorized
  end

  test "student should list own ticket messages" do
    sign_in_as(@student)

    get api_v1_escalation_ticket_escalation_messages_url(@ticket), as: :json

    assert_response :success
    json_response = JSON.parse(response.body)
    assert_equal 1, json_response.length
  end

  test "student should not list other student's ticket messages" do
    other_ticket = EscalationTicket.create!(
      student: @other_student,
      document_request: @other_student_request,
      subject: "Other student concern"
    )

    sign_in_as(@student)

    get api_v1_escalation_ticket_escalation_messages_url(other_ticket), as: :json

    assert_response :not_found
  end

  test "student should create message when ticket is open" do
    sign_in_as(@student)

    assert_difference("EscalationMessage.count", 1) do
      post api_v1_escalation_ticket_escalation_messages_url(@ticket),
           params: {
             escalation_message: {
               body: "Follow up message"
             }
           },
           as: :json
    end

    assert_response :created
    assert_equal "Follow up message", @ticket.escalation_messages.order(:id).last.body
  end

  test "student should not create message when ticket is closed" do
    @ticket.close_by_staff!(@staff)
    sign_in_as(@student)

    assert_no_difference("EscalationMessage.count") do
      post api_v1_escalation_ticket_escalation_messages_url(@ticket),
           params: {
             escalation_message: {
               body: "I should not be able to send this"
             }
           },
           as: :json
    end

    assert_response :unprocessable_entity
    json_response = JSON.parse(response.body)
    assert_includes json_response["errors"].join(" "), "closed"
  end

  test "staff can still create message when ticket is closed" do
    @ticket.close_by_staff!(@staff)
    sign_in_as(@staff)

    assert_difference("EscalationMessage.count", 1) do
      post api_v1_escalation_ticket_escalation_messages_url(@ticket),
           params: {
             escalation_message: {
               body: "Staff follow-up after closure"
             }
           },
           as: :json
    end

    assert_response :created
  end

  private

  def create_document_request_for(student)
    request = DocumentRequest.new(
      user_id: student.id,
      status: :on_hold,
      delivery_method: :self_pickup,
      payment_method: :cash,
      payment_status: :not_paid,
      shipping_fee_cents: 100
    )
    request.id_verification_photo.attach(id_photo_file)
    request.save!
    request
  end

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
