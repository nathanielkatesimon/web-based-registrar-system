require "test_helper"
require "stringio"

class RequestTimeLineTest < ActiveSupport::TestCase
  setup do
    @student = students(:student_one)

    @document_request = DocumentRequest.new(
      user_id: @student.id,
      status: :on_hold,
      delivery_method: :self_pickup,
      payment_method: :cash,
      payment_status: :not_paid,
      shipping_fee_cents: 5_000
    )
    @document_request.id_verification_photo.attach(image_io("id-photo.jpg"))
    @document_request.save!
  end

  test "is invalid without type" do
    request_time_line = @document_request.request_time_lines.new(type: nil)

    assert_not request_time_line.valid?
    assert_includes request_time_line.errors[:type], "can't be blank"
  end

  test "has expected enum values" do
    expected_types = {
      "request_processed" => 0,
      "request_forwarded_to_head_office" => 1,
      "waiting_for_approval" => 2,
      "approved_by_head_office" => 3,
      "declined_by_head_office" => 4,
      "completed" => 5,
      "ready_for_shipping" => 6,
      "ready_for_pick_up" => 7,
      "document_shipped" => 8,
      "request_opened" => 9,
      "request_submitted" => 10,
      "request_on_hold" => 11,
      "request_closed" => 12
    }

    assert_equal expected_types, RequestTimeLine.types
  end

  private

  def image_io(filename)
    {
      io: StringIO.new("fake-image"),
      filename: filename,
      content_type: "image/jpeg"
    }
  end
end
