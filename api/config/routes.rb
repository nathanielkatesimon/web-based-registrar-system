Rails.application.routes.draw do
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
      resources :student_profiles, except: [:create, :destroy]
      resources :students
      resources :staffs

      # Additional helpful routes
      get 'students/filter/by_status/:status', to: 'students#index'
      get 'students/filter/by_school_level/:school_level', to: 'students#index'
    end
  end
end
