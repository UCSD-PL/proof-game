class LogsController < ApplicationController
    def index
      if(params[:operation])
        if (params[:operation] == "delete_all") 
          Log.delete_all
        end
      end
      @logs = Log.all
      if(params[:filter])
        @logs = @logs.find_all {|l| l.message.match params[:filter]}
      end
    end

    def create

      log = Log.new
      log.message = params[:message].inspect

      if params[:group_name]
        group = Group.find_or_create_by_name(params[:group_name]) 
        log.group = group
      end

      log.save!

      render :nothing => true
    end
end
