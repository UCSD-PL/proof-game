class LogsController < ApplicationController
    def index
      if(params[:operation])
        if (params[:operation] == "delete_all") 
          Log.delete_all
        end
      end
      @logs = Log.all.sort_by(&:created_at)
      if(params[:filter])
        @logs = @logs.find_all {|l| l.message.match params[:filter]}
      end
    end

    def create

      log = Log.new
      log.message = params[:message].inspect

      group = Group.find_or_create_by_name(current_user.username) 
      log.group = group

      log.save!

      render :nothing => true
    end
end
