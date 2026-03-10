class Notification < ApplicationRecord
  belongs_to :student, class_name: "Student", foreign_key: :student_id, inverse_of: :notifications
  belongs_to :document_request, inverse_of: :notifications

  enum :kind, {
    document_request_status: 0
  }

  validates :title, presence: true
  validates :message, presence: true
  validates :link_url, presence: true
  validates :kind, presence: true

  scope :latest_first, -> { order(created_at: :desc, id: :desc) }

  after_create_commit :broadcast_created!

  def mark_as_read!
    return if read_at.present?

    update!(read_at: Time.current)
  end

  def read?
    read_at.present?
  end

  def as_api_json
    {
      id: id,
      kind: kind,
      title: title,
      message: message,
      link_url: link_url,
      read_at: read_at,
      created_at: created_at,
      document_request: {
        id: document_request.id,
        request_id: document_request.request_id,
        status: document_request.status
      }
    }
  end

  private

  def broadcast_created!
    ActionCable.server.broadcast(
      "notifications:student:#{student_id}",
      {
        event: "notification_created",
        notification: as_api_json
      }
    )
  end
end
