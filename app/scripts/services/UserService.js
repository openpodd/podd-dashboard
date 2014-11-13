'use strict';

angular.module('poddDashboardApp')

.factory('User', function ($resource) {
    return $resource(config.host + '/api-token-auth/', {}, {
        login: {
            method: 'POST'
        }
    });
})

.factory('Auth', function (User, shared) {
    return {
        login: function (username, password, cb) {
            if (!$.cookie('token')) {
                User.login({ username: username, password: password }).$promise.then(function (res) {
                    $.cookie('token', res.token);
                    shared.loggedIn = true;

                    cb(null, res);
                }).catch(function (err) {
                    cb(err);
                });
            }
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
