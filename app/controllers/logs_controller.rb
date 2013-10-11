class LogsController < ApplicationController

    def create

      log = Log.new
      log.message = params[:message]
      log.save!

      render :nothing => true
    end
end
