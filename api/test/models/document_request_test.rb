require "test_helper"
require "stringio"

class DocumentRequestTest < ActiveSupport::TestCase
  setup do
    @student = students(:student_one)
  end

  test "requires id_verification_photo" do
    request = build_cash_pickup_request

    assert_not request.valid?
    assert_includes request.errors[:id_verification_photo], "can't be blank"
  end

  test "requires payment_receipt when payment_method is online" do
    request = build_cash_pickup_request(payment_method: :online)
    request.id_verification_photo.attach(image_io("id-photo.jpg"))

    assert_not request.valid?
    assert_includes request.errors[:payment_receipt], "must be attached for online payment"
  end

  test "requires courier_name for courier_delivery" do
    request = build_cash_pickup_request(delivery_method: :courier_delivery)
    request.id_verification_photo.attach(image_io("id-photo.jpg"))

    assert_not request.valid?
    assert_includes request.errors[:courier_name], "can't be blank"
  end

  private

  def build_cash_pickup_request(overrides = {})
    DocumentRequest.new({
      student: @student,
      status: :on_hold,
      delivery_method: :self_pickup,
      payment_method: :cash,
      payment_status: :not_paid,
      shipping_fee_cents: 5000
    }.merge(overrides))
  end

  def image_io(filename)
    {
      io: StringIO.new("fake-image"),
      filename: filename,
      content_type: "image/jpeg"
    }
  end
end
