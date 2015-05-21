FROM ruby:2.0.0-p645

WORKDIR /usr/src/app

COPY Gemfile /usr/src/app/Gemfile
COPY Gemfile.lock /usr/src/app/Gemfile.lock
COPY vendor/gems /usr/src/app/vendor/gems

RUN bundle install --system -j 4

ENV DISCOURSE_DB_HOST postgres
ENV DISCOURSE_REDIS_HOST redis
ENV DISCOURSE_SERVE_STATIC_ASSETS true
#ENV RAILS_ENV production
#ENV SECRET_TOKEN 000000000000000000000000000000000000000000

COPY . /usr/src/app/

#RUN rake assets:precompile

EXPOSE 3000
CMD ["rails", "server"]
