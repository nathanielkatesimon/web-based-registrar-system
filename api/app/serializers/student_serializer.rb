class StudentSerializer < ActiveModel::Serializer
  include Rails.application.routes.url_helpers

  attributes :id, :type, :email, :auth_id, :first_name, :middle_name,
             :last_name, :extension, :full_name, :avatar_url, :created_at, :updated_at

  has_one :student_profile
  has_one :family_info

  def avatar_url
    return unless object.avatar.attached?

    rails_blob_path(object.avatar, only_path: true)
  end
end
