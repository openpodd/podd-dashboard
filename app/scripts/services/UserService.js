'use strict';

angular.module('poddDashboardApp')

.factory('User', function ($resource) {
    return $resource(config.host + '/api-token-auth/', {}, {
        login: {
            method: 'POST'
        }
    });
})

.factory('Auth', function (User) {
    return {
        login: function (username, password) {
            if (!$.cookie('token')) {
                User.login({ username: username, password: password }).$promise.then(function (res) {
                    $.cookie('token', res.token);
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
