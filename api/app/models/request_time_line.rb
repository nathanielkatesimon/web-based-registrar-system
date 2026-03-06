class RequestTimeLine < ApplicationRecord
  self.inheritance_column = :_type_disabled

  belongs_to :document_request

  enum :type, {
    request_processed: 0,
    request_forwarded_to_head_office: 1,
    waiting_for_approval: 2,
    approved_by_head_office: 3,
    declined_by_head_office: 4,
    completed: 5,
    ready_for_shipping: 6,
    ready_for_pick_up: 7,
    document_shipped: 8,
    request_opened: 9,
    request_submitted: 10,
    request_on_hold: 11,
    request_closed: 12
  }

  validates :type, presence: true
end
