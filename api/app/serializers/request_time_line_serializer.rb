class RequestTimeLineSerializer < ActiveModel::Serializer
  attributes :id, :type, :created_at, :updated_at
end
