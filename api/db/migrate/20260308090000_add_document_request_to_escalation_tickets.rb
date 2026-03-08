class AddDocumentRequestToEscalationTickets < ActiveRecord::Migration[8.0]
  def change
    add_reference :escalation_tickets, :document_request, foreign_key: true
    # add_index :escalation_tickets, :document_request_id, unique: true
  end
end
