# PODD Dashboard
Main dashboard for PODD project. Focus to make collaboration between stakeholder easier.

## Prerequisites
1. Nodejs, I recommend (nvm)[https://github.com/creationix/nvm] to manage nodejs version.
2. [Gruntjs](http://gruntjs.com/)
2. [MongoDB](https://docs.mongodb.org/)
3. [Redis](http://redis.io/)

## Run the dashboard
1. Install `nvm`, then the latest node version by `nvm install node`.
2. Install bower by `npm install -g bower` or `yarn global add bower` depend on your prefer.
3. Install grunt with `npm install -g grunt-cli`
3. Run `npm install`
4. Run `bower install`
5. Copy configuration file at `app/scripts/config.js.sample` to `app/scripts/config.js` and modify at your need.
6. Run `grunt serve`

## Run with PM2
1. Use `pm2 start pm2.json`
