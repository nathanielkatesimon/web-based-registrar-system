class DocumentRequest < ApplicationRecord
  belongs_to :student, class_name: "Student", foreign_key: :user_id, inverse_of: :document_requests
  has_many :document_request_items, dependent: :destroy
  has_many :notifications, dependent: :destroy, inverse_of: :document_request
  has_many :request_time_lines, -> { order(created_at: :asc) }, dependent: :destroy
  has_one :escalation_ticket, dependent: :destroy, inverse_of: :document_request

  accepts_nested_attributes_for :document_request_items, allow_destroy: true
  has_one_attached :id_verification_photo
  has_one_attached :payment_receipt

  monetize :shipping_fee_cents

  enum :status, {
    on_hold: 0,
    processing: 1,
    completed: 2,
    closed: 3
  }

  enum :delivery_method, {
    self_pickup: 0,
    courier_delivery: 1
  }

  enum :payment_status, {
    paid: 0,
    not_paid: 1,
    under_review: 2
  }, prefix: true

  enum :payment_method, {
    cash: 0,
    online: 1
  }

  validates :id_verification_photo, presence: true
  validates :courier_name, presence: true, if: :courier_delivery?
  validates :request_id, uniqueness: true, allow_nil: true
  validate :payment_receipt_required_for_online

  before_validation :sync_payment_verified_at_with_payment_status

  after_create_commit :assign_request_id!
  after_create_commit :create_request_submitted_timeline!
  after_update_commit :create_status_change_timeline!
  after_update_commit :create_status_change_notification!

  def items
    document_request_items
  end

  def user
    student
  end

  def mark_opened_by_staff!
    return if request_time_lines.exists?(type: :request_opened)

    request_time_lines.create!(type: :request_opened)
  end

  private

  def payment_receipt_required_for_online
    return unless online?
    return if payment_receipt.attached?

    errors.add(:payment_receipt, "must be attached for online payment")
  end

  def sync_payment_verified_at_with_payment_status
    return unless will_save_change_to_payment_status?

    if payment_status_paid?
      self.payment_verified_at ||= Time.current.to_i
    else
      self.payment_verified_at = nil
    end
  end

  def assign_request_id!(attempt = 0)
    return if request_id.present?
    return if attempt >= 10

    request_id_value = "RID#{SecureRandom.random_number(100_000).to_s.rjust(5, "0")}-#{SecureRandom.random_number(1_000_000).to_s.rjust(6, "0")}"

    update_column(:request_id, request_id_value)
  rescue ActiveRecord::RecordNotUnique
    assign_request_id!(attempt + 1)
  end

  def create_request_submitted_timeline!
    return if request_time_lines.exists?(type: :request_submitted)

    request_time_lines.create!(type: :request_submitted)
  end

  def create_status_change_timeline!
    return unless previous_changes.key?("status")

    timeline_type = case status
                    when "on_hold"
                      :request_on_hold
                    when "processing"
                      :request_processed
                    when "completed"
                      :completed
                    when "closed"
                      :request_closed
                    end

    return if timeline_type.blank?
    return if request_time_lines.exists?(type: timeline_type)

    request_time_lines.create!(type: timeline_type)
  end

  def create_status_change_notification!
    return unless previous_changes.key?("status")

    title, message = status_change_notification_content
    return if title.blank? || message.blank?

    notifications.create!(
      student: student,
      kind: :document_request_status,
      title: title,
      message: message,
      link_url: "/student/dashboard/tracker?request=#{request_id.presence || id}"
    )
  end

  def status_change_notification_content
    request_code = request_id.presence || "Request ##{id}"

    case status
    when "processing"
      [
        "Request now processing",
        "#{request_code} is now being processed by the Registrar."
      ]
    when "on_hold"
      [
        "Request placed on hold",
        "#{request_code} was placed on hold. Review the request details for the next steps."
      ]
    when "completed"
      [
        "Request completed",
        "#{request_code} has been completed and is ready for your review."
      ]
    when "closed"
      [
        "Request closed",
        "#{request_code} has been closed."
      ]
    end
  end
end
