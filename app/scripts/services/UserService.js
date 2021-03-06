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
        updateAvatar: {
            url: config.API_BASEPATH + '/users/profile/upload/',
            method: 'POST',
            headers: {'Content-Type': undefined},
            transformRequest: function(data) {
                var formData = new FormData();
                angular.forEach(data, function(value, key) {
                    if(key === 'image') {
                        if (data.image) {
                            formData.append(key, data.image, 'image.png');
                        }
                    }else{
                        formData.append(key, value);
                    }
                    console.log(key, value);
                });
                return formData;
            },
        },
        updatePassword: {
            url: config.API_BASEPATH + '/users/profile/password/',
            method: 'POST'
        },
        list: {
            url: config.API_BASEPATH + '/users/',
            method: 'GET',
            isArray: true
        },
        create: {
            url: config.API_BASEPATH + '/users/',
            method: 'POST'
        },
        delete : {
            url: config.API_BASEPATH + '/users/:userId',
            method: 'DELETE'
        }
    });
})

.factory('UserDetail', function ($resource) {
    var resource = $resource(config.API_BASEPATH + '/users/:id', {
      id: '@id'
    }, {
        get: {
            method: 'GET'
        },
        update: {
            method: 'PUT'
        }
    });
    return resource;
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

        logout: function () {
            shared.loggedIn = false;
            shared.menuPermissions = [];
            shared.summaryReportMode = false;
            shared.summaryPersonMode = false;
            shared.summaryPerformancePersonMode = false;
            shared.summaryReportMonthMode = false;
            shared.summaryScenarioMode = false;
            $.removeCookie('token');
            storage.clearAll();
            lscache.flush();
        },

        checkCookie: function () {
            return !!$.cookie('token');
        },

        requireLogin: function ($scope) {
            var self = this;

            function check() {
                if (checking) {
                    return;
                }

                checking = true;
                self.verify().catch(function () {
                    var destinationStr = self.getLoginDestination($location);
                    $location.url('/login');
                    $location.search({ destination: destinationStr });
                }).finally(function () {
                    checking = false;
                });
            }

            check();
            // Loop check
            var promise = $interval(function () {
                if (!self.checkCookie()) {
                    self.logout();
                    $location.url('/login');
                }
            }, 1000);

            $scope.$on('$destroy', function () {
                $interval.cancel(promise);
            });
        },

        getLoginDestination: function ($location) {
            if ($location.path() != '/login') {
                return $location.path() + ':' + toKeyValue($location.search());
            }
            else {
                return $location.search().destination;
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
