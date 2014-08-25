class ApplicationController < ActionController::Base
#  protect_from_forgery

  before_filter :authorize_user!
 
  require 'ostruct'

  # Add a general rescue to handle an invalid access_token.
  rescue_from OAuth2::Error do |exception|
    logger.error("OAuth2 exception: #{exception.inspect}")
    if exception.response.status == 401
      session[:user_id] = nil
      session[:access_token] = nil
      redirect_to "/", alert: "Access token expired, try signing in again." and return
    end
  end

  # Add this as a before filter on any areas you want to require authentication.
  def authorize_user!
    unless session[:access_token]
      session[:return_to] = request.path if request.path
      session[:return_to] += "?" + request.query_string if !request.query_string.blank?
      redirect_to main_app.new_session_path
      return false
    end

    true
  end


private



  # Return the oauth_client. Used by access_token
  def oauth_client
    @oauth_client ||= OAuth2::Client.new(ENV["THOUGHTSTEM_ID"], ENV["THOUGHTSTEM_SECRET"], site: ENV["THOUGHTSTEM_SITE"])
  end

  # Used by the various controllers as an endpoint into the sso api.
  def access_token
    if session[:access_token]
      @access_token ||= OAuth2::AccessToken.new(oauth_client, session[:access_token])
    end
  end

  # Helper to access the current_user. This is fetched from the sso app via the /api/user call.
  def current_user
    unless session[:current_user]
      if access_token
        session[:current_user] = OpenStruct.new(access_token.get('/api/user').parsed)
      end
    end
    session[:current_user]
  end
  helper_method :current_user


end
