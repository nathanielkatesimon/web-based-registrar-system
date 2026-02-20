Rails.application.routes.draw do
  resources :document_request_items
  resources :document_types
  resources :document_requests
  get "up" => "rails/health#show", as: :rails_health_check

  devise_for :users, skip: :all

  devise_scope :user do
    post "api/v1/users/sign_in", to: "users/sessions#create", as: :user_session
    delete "api/v1/users/sign_out", to: "users/sessions#destroy", as: :destroy_user_session

    post "api/v1/students/registrations", to: "api/v1/student_registrations#create"
    post "api/v1/staffs/registrations", to: "api/v1/staff_registrations#create"
  end

  namespace :api do
    namespace :v1 do
      get "auth/session", to: "auth_sessions#show"
      #  resources :student_profiles, except: [:create, :destroy]
      resources :students
      resources :staffs
    end
  end
end
