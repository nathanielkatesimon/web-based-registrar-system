require "test_helper"

class Api::V1::EscalationTicketsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @student = students(:student_one)
    @other_student = students(:student_two)
    @staff = staffs(:staff_one)
    @student_request = create_document_request_for(@student)
    @other_student_request = create_document_request_for(@other_student)

    @ticket = EscalationTicket.create!(
      student: @student,
      document_request: @student_request,
      subject: "Urgent deadline requirement"
    )
    @ticket.escalation_messages.create!(sender: @student, body: "Please help.")
  end

  test "should require authentication for index" do
    get api_v1_escalation_tickets_url, as: :json

    assert_response :unauthorized
  end

  test "student should only see own escalation tickets" do
    other_ticket = EscalationTicket.create!(
      student: @other_student,
      document_request: @other_student_request,
      subject: "Other concern"
    )
    other_ticket.escalation_messages.create!(sender: @other_student, body: "Hello")

    sign_in_as(@student)

    get api_v1_escalation_tickets_url, as: :json

    assert_response :success
    json_response = JSON.parse(response.body)
    ids = json_response.map { |record| record["id"] }

    assert_includes ids, @ticket.id
    assert_not_includes ids, other_ticket.id
  end

  test "student should create escalation ticket with initial message" do
    sign_in_as(@student)
    second_request = create_document_request_for(@student)

    assert_difference("EscalationTicket.count", 1) do
      assert_difference("EscalationMessage.count", 1) do
        post api_v1_escalation_tickets_url,
             params: {
               escalation_ticket: {
                 subject: "Transcript concern",
                 message: "Need urgent assistance for transcript release.",
                 document_request_id: second_request.id
               }
             },
             as: :json
      end
    end

    assert_response :created

    created_ticket = EscalationTicket.order(:id).last
    assert_equal @student.id, created_ticket.student_id
    assert_equal second_request.id, created_ticket.document_request_id
    assert_equal "Transcript concern", created_ticket.subject
    assert_equal "Need urgent assistance for transcript release.", created_ticket.escalation_messages.last.body
  end

  test "student should return existing escalation ticket for the same document request" do
    sign_in_as(@student)

    assert_no_difference("EscalationTicket.count") do
      post api_v1_escalation_tickets_url,
           params: {
             escalation_ticket: {
               subject: "Another subject",
               message: "Trying to recreate",
               document_request_id: @student_request.id
             }
           },
           as: :json
    end

    assert_response :success
    json_response = JSON.parse(response.body)
    assert_equal @ticket.id, json_response["id"]
    assert_equal @student_request.id, json_response.dig("document_request", "id")
  end

  test "staff should not create escalation ticket" do
    sign_in_as(@staff)

    assert_no_difference("EscalationTicket.count") do
      post api_v1_escalation_tickets_url,
           params: {
             escalation_ticket: {
               subject: "Should not be allowed",
               document_request_id: @student_request.id
             }
           },
           as: :json
    end

    assert_response :forbidden
  end

  test "student should not create escalation ticket without document_request_id" do
    sign_in_as(@student)

    assert_no_difference("EscalationTicket.count") do
      post api_v1_escalation_tickets_url,
           params: {
             escalation_ticket: {
               subject: "Missing request"
             }
           },
           as: :json
    end

    assert_response :unprocessable_entity
  end

  test "student should not access another student's ticket" do
    other_ticket = EscalationTicket.create!(
      student: @other_student,
      document_request: @other_student_request,
      subject: "Private concern"
    )

    sign_in_as(@student)

    get api_v1_escalation_ticket_url(other_ticket), as: :json

    assert_response :not_found
  end

  test "staff should close and reopen escalation ticket" do
    sign_in_as(@staff)

    patch close_api_v1_escalation_ticket_url(@ticket), as: :json
    assert_response :success

    @ticket.reload
    assert_equal "closed", @ticket.status
    assert_not_nil @ticket.closed_at
    assert_equal @staff.id, @ticket.closed_by_id

    patch reopen_api_v1_escalation_ticket_url(@ticket), as: :json
    assert_response :success

    @ticket.reload
    assert_equal "open", @ticket.status
    assert_nil @ticket.closed_at
    assert_nil @ticket.closed_by_id
  end

  test "student should not close escalation ticket" do
    sign_in_as(@student)

    patch close_api_v1_escalation_ticket_url(@ticket), as: :json

    assert_response :forbidden
  end

  test "should find escalation ticket by ticket_code" do
    sign_in_as(@staff)

    get api_v1_escalation_ticket_url(@ticket.ticket_code), as: :json

    assert_response :success
    json_response = JSON.parse(response.body)
    assert_equal @ticket.ticket_code, json_response["ticket_code"]
    assert_equal @student_request.id, json_response.dig("document_request", "id")
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
