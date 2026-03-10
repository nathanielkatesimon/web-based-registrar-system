Rails.application.routes.draw do
  mount ActionCable.server => "/cable"

  get "up" => "rails/health#show", as: :rails_health_check

  devise_for :users, skip: :all

  devise_scope :user do
    post "api/v1/users/sign_in", to: "users/sessions#create", as: :user_session
    delete "api/v1/users/sign_out", to: "users/sessions#destroy", as: :destroy_user_session
    post "api/v1/users/password", to: "users/passwords#create", as: :user_password
    put "api/v1/users/password", to: "users/passwords#update"
    patch "api/v1/users/password", to: "users/passwords#update"

    post "api/v1/students/registrations", to: "api/v1/student_registrations#create"
    post "api/v1/staffs/registrations", to: "api/v1/staff_registrations#create"
  end

  namespace :api do
    namespace :v1 do
      get "auth/session", to: "auth_sessions#show"
      #  resources :student_profiles, except: [:create, :destroy]
      resources :students
      resources :staffs
      resources :family_infos, only: [:show, :update]
      resources :deficiencies, only: [:show, :update]
      resources :notifications, only: [:index] do
        member do
          patch :read
        end
      end
      resources :document_request_items
      resources :document_types
      resources :document_requests do
        resources :request_time_lines, except: [:index]
      end
      resources :escalation_tickets, only: [:index, :show, :create] do
        member do
          patch :close
          patch :reopen
        end

        resources :escalation_messages, path: :messages, only: [:index, :create]
      end
    end
  end
end
