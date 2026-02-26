class Api::V1::AvatarsController < ApplicationController
  before_action :authenticate_user!
  
  def index;end
end