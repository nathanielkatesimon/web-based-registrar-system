require "test_helper"
require "stringio"

class DocumentRequestItemTest < ActiveSupport::TestCase
  setup do
    @student = students(:student_one)
    @document_type = document_types(:one)

    @document_request = DocumentRequest.new(
      student: @student,
      status: :on_hold,
      delivery_method: :self_pickup,
      payment_method: :cash,
      payment_status: :not_paid,
      shipping_fee_cents: 5000
    )
    @document_request.id_verification_photo.attach(
      io: StringIO.new("fake-image"),
      filename: "id-photo.jpg",
      content_type: "image/jpeg"
    )
    @document_request.save!
  end

  test "sets unit_price_cents from document_type price" do
    item = DocumentRequestItem.create!(
      document_request: @document_request,
      document_type: @document_type,
      quantity: 2,
      unit_price_cents: 123_456
    )

    assert_equal @document_type.price_cents, item.unit_price_cents
  end
end
