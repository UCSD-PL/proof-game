class WelcomeController < ApplicationController
    def index
        if(params[:template])
          render :template => "welcome/"+params[:template] and return
        end
    end
end
