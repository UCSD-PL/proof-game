class LogsController < ApplicationController

    def create

      log = Log.new
      log.message = params[:message]

      if params[:group_name]
        group = Group.find_or_create_by_name(params[:group_name]) 
        log.group = group
      end

      log.save!

      render :nothing => true
    end
end
