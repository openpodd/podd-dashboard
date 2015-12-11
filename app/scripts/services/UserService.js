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
        },
        ping: {
            url: config.API_BASEPATH + '/ping/',
            method: 'GET',
            ignoreLoadingBar: true
        },
        profile: {
            url: config.API_BASEPATH + '/users/profile/',
            method: 'GET'
        },
        updatePassword: {
            url: config.API_BASEPATH + '/users/profile/password/',
            method: 'POST'
        }
    });
})

.factory('Auth', function (User, shared, $interval, $location, $q, storage) {
    var checking = false;

    return {
        verify: function () {
            var deferred = $q.defer();

            if ( ! $.cookie('token') ) {
                shared.loggedIn = false;
                deferred.reject();
            }
            else {
                // ping to check if this token valid.
                User.ping().$promise.then(function () {
                    shared.loggedIn = true;
                    deferred.resolve(true);
                }).catch(function (resp) {
                    if (resp.status === 401) {
                        $.cookie('token', '');
                        shared.loggedIn = false;
                        deferred.reject();
                    }
                    else {
                        deferred.resolve(false);
                    }
                });
            }

            return deferred.promise;
        },

        login: function (username, password, cb) {
            var self = this;

            self.verify().catch(function () {
                User.login({ username: username, password: password }).$promise.then(function (res) {
                    $.cookie('token', res.token);
                    $.cookie('userid', res.id);
                    shared.loggedIn = true;
                    storage.set('user', res);
                    storage.set('menuPermissions', res.permissions);

                    cb(null, res);
                }).catch(function (err) {
                    cb(err);
                });
            });
        },

        requireLogin: function ($scope) {
            var self = this;

            function check() {
                if (checking) {
                    return;
                }

                checking = true;
                self.verify().catch(function () {
                    $location.url('/login');
                }).finally(function () {
                    checking = false;
                });
            }

            // Loop check
            check();
            // var promise = $interval(check, 5000);

            // $scope.$on('$destroy', function () {
            //     $interval.cancel(promise);
            // });
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
