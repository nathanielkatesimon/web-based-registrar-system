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

  test "supports request_opened and request_submitted enum values" do
    assert_equal 9, RequestTimeLine.types["request_opened"]
    assert_equal 10, RequestTimeLine.types["request_submitted"]
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
