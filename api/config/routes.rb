Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  devise_for :users, controllers: {
    sessions: 'users/sessions',
    registrations: 'users/registrations'
  }

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
