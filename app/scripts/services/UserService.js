'use strict';

angular.module('poddDashboardApp')

.factory('User', function ($resource) {
    return $resource(config.API_BASEPATH + '/api-token-auth/', {}, {
        login: {
            method: 'POST'
        },
        search: {
            url: config.API_BASEPATH + '/users/search/',
            method: 'GET',
            isArray: true
        }
    });
})

.factory('Auth', function (User, shared, $interval, $location) {
    return {
        login: function (username, password, cb) {
            if (!$.cookie('token')) {
                User.login({ username: username, password: password }).$promise.then(function (res) {
                    $.cookie('token', res.token);
                    $.cookie('userid', res.id);
                    shared.loggedIn = true;

                    cb(null, res);
                }).catch(function (err) {
                    cb(err);
                });
            }
        },

        verify: function () {
            if ( ! $.cookie('token') ) {
                shared.loggedIn = false;
                return false;
            }
            else {
                shared.loggedIn = true;
                return true;
            }
        },

        requireLogin: function ($scope) {
            var self = this;

            function check() {
              self.verify();

              if (!shared.loggedIn) {
                $location.url('/login');
              }
            }

            // Loop check
            check();
            var promise = $interval(check, 500);

            $scope.$on('$destroy', function () {
                $interval.cancel(promise);
            });
        }
    };
})

.factory('authInterceptor', function ($q) {
    return {
        request: function (config) {
            if (config && $.cookie('token')) {
                config.headers.Authorization = 'Token ' + $.cookie('token');
            }

            return config || $q.when(config);
        }
    };
})

.config(function ($httpProvider) {
    $httpProvider.interceptors.push('authInterceptor');
});
