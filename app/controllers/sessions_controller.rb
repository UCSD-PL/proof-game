class SessionsController < ApplicationController
  skip_before_filter :authorize_user!

  def new
    redirect_to "/auth/thoughtstem"
  end

  def create
    auth = request.env["omniauth.auth"]
    session[:access_token] = auth["credentials"]["token"]
    redirect_path = session[:return_to]
    session[:return_to] = nil
    
    redirect_to redirect_path || "/"
  end

  def show
    if(params[:debug])
      raise session.to_yaml 
    end

    if(params[:delete])
      destroy
      return 
    end

    logger.info("we're back from the SSO site. redirect to root")
    redirect_to "/"
  end

  def destroy
    session[:access_token] = nil
    render :template => "sessions/logout" and return
  end
end
