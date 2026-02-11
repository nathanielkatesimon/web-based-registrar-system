class StaffSerializer < ActiveModel::Serializer
  attributes :id, :type, :email, :auth_id, :first_name, :middle_name,
             :last_name, :extension, :full_name, :created_at, :updated_at
end