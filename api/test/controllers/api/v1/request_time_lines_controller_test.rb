require "test_helper"

class Api::V1::RequestTimeLinesControllerTest < ActionDispatch::IntegrationTest
  include ActionDispatch::TestProcess::FixtureFile

  setup do
    @student = students(:student_one)
    @other_student = students(:student_two)
    @staff = staffs(:staff_one)

    @document_request = build_document_request_for(@student, 1_739_980_900)
    @other_document_request = build_document_request_for(@other_student, 1_739_980_901)

    @request_time_line = @document_request.request_time_lines.create!(type: :request_processed)
    @other_request_time_line = @other_document_request.request_time_lines.create!(type: :request_processed)
  end

  test "should require authentication for show" do
    get api_v1_document_request_request_time_line_url(@document_request, @request_time_line), as: :json

    assert_response :unauthorized
  end

  test "should create request_time_line for own document_request" do
    sign_in_as(@student)

    assert_difference("RequestTimeLine.count", 1) do
      post api_v1_document_request_request_time_lines_url(@document_request),
           params: {
             request_time_line: {
               type: :waiting_for_approval
             }
           },
           as: :json
    end

    assert_response :created
    assert_equal "waiting_for_approval", @document_request.request_time_lines.order(:id).last.type
  end

  test "should update request_time_line for own document_request" do
    sign_in_as(@student)

    patch api_v1_document_request_request_time_line_url(@document_request, @request_time_line),
          params: {
            request_time_line: {
              type: :document_shipped
            }
          },
          as: :json

    assert_response :success
    assert_equal "document_shipped", @request_time_line.reload.type
  end

  test "should destroy request_time_line for own document_request" do
    sign_in_as(@student)

    assert_difference("RequestTimeLine.count", -1) do
      delete api_v1_document_request_request_time_line_url(@document_request, @request_time_line), as: :json
    end

    assert_response :no_content
  end

  test "should not access another users request_time_line" do
    sign_in_as(@student)

    get api_v1_document_request_request_time_line_url(@other_document_request, @other_request_time_line), as: :json

    assert_response :not_found
  end

  test "staff should access request_time_line" do
    sign_in_as(@staff)

    get api_v1_document_request_request_time_line_url(@document_request, @request_time_line), as: :json

    assert_response :success
  end

  private

  def build_document_request_for(student, payment_verified_at)
    request = DocumentRequest.new(
      user_id: student.id,
      status: :on_hold,
      delivery_method: :self_pickup,
      payment_method: :cash,
      payment_status: :not_paid,
      payment_verified_at: payment_verified_at,
      shipping_fee_cents: 5_000
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
