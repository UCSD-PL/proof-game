class WelcomeController < ApplicationController
    def index
      @info = UserInfo.find_or_create_by_username current_user.username

      if(params[:template])
        render :template => "welcome/"+params[:template] and return
      end
    end
end
