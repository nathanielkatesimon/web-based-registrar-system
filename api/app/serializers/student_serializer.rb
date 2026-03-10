class StudentSerializer < ActiveModel::Serializer
  include Rails.application.routes.url_helpers

  attributes :id, :type, :email, :auth_id, :first_name, :middle_name,
             :last_name, :extension, :claimed, :full_name, :avatar_url,
             :incomplete_personal_info, :incomplete_family_info, :incomplete_academic_info,
             :created_at, :updated_at

  has_one :student_profile
  has_one :family_info
  has_one :deficiency

  def avatar_url
    return unless object.avatar.attached?

    rails_blob_path(object.avatar, only_path: true)
  end

  def incomplete_personal_info
    object.incomplete_personal_info?
  end

  def incomplete_family_info
    object.incomplete_family_info?
  end

  def incomplete_academic_info
    object.incomplete_academic_info?
  end
end
