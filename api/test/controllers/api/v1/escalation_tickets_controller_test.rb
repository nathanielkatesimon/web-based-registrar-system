require "test_helper"

class Api::V1::EscalationTicketsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @student = students(:student_one)
    @other_student = students(:student_two)
    @staff = staffs(:staff_one)

    @ticket = EscalationTicket.create!(
      student: @student,
      subject: "Urgent deadline requirement"
    )
    @ticket.escalation_messages.create!(sender: @student, body: "Please help.")
  end

  test "should require authentication for index" do
    get api_v1_escalation_tickets_url, as: :json

    assert_response :unauthorized
  end

  test "student should only see own escalation tickets" do
    other_ticket = EscalationTicket.create!(student: @other_student, subject: "Other concern")
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

    assert_difference("EscalationTicket.count", 1) do
      assert_difference("EscalationMessage.count", 1) do
        post api_v1_escalation_tickets_url,
             params: {
               escalation_ticket: {
                 subject: "Transcript concern",
                 message: "Need urgent assistance for transcript release."
               }
             },
             as: :json
      end
    end

    assert_response :created

    created_ticket = EscalationTicket.order(:id).last
    assert_equal @student.id, created_ticket.student_id
    assert_equal "Transcript concern", created_ticket.subject
    assert_equal "Need urgent assistance for transcript release.", created_ticket.escalation_messages.last.body
  end

  test "staff should not create escalation ticket" do
    sign_in_as(@staff)

    assert_no_difference("EscalationTicket.count") do
      post api_v1_escalation_tickets_url,
           params: {
             escalation_ticket: {
               subject: "Should not be allowed"
             }
           },
           as: :json
    end

    assert_response :forbidden
  end

  test "student should not access another student's ticket" do
    other_ticket = EscalationTicket.create!(student: @other_student, subject: "Private concern")

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
