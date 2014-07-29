module OmniAuth
  module Strategies
    class Thoughtstem < OmniAuth::Strategies::OAuth2
      # define the thoughtstem oauth2 provider
      option :name, :thoughtstem

      option :client_options, {
        :site => ENV["THOUGHTSTEM_SITE"],
        :authorize_url => "/oauth/authorize"
      }

      uid { raw_info["id"] }

      info do
        {
          :email => raw_info["email"]
          # and anything else you want to return to your API consumers.
          # All keys in the sso app's "/api/users/show" returned JSON are available.
        }
      end

      def raw_info
        @raw_info ||= access_token.get('/api/me.json').parsed
      end
    end
  end
end

