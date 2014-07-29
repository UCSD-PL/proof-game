require File.expand_path('lib/omniauth/stratagies/thoughtstem', Rails.root)

# Set up the thoughtstem provider using env vars defined in application.yml
Rails.application.config.middleware.use OmniAuth::Builder do
  provider :thoughtstem, ENV["THOUGHTSTEM_ID"], ENV["THOUGHTSTEM_SECRET"]
end
