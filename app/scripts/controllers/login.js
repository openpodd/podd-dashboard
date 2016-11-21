'use strict';

angular.module('poddDashboardApp')

.controller('LoginCtrl', function ($scope, $http, shared, Auth, $state,
                                   $rootScope, Menu, $location) {
    $scope.username = '';
    $scope.password = '';
    $scope.shared = shared;

    Menu.setActiveMenu('login');

    $scope.$watch('shared.loggedIn', function(newValue) {
        if (newValue) {
            $state.go('dashboard');
        }
    });

    $scope.validate = function () {
        $scope.invalidUsername = false;
        $scope.invalidPasswordLength = false;
        $scope.invalidLogin = false;

        if (!$scope.username) {
            $scope.invalidUsername = true;
        }

        if ($scope.password.length < 4) {
            $scope.invalidPasswordLength = true;
        }

        return !$scope.invalidUsername && !$scope.invalidPasswordLength;
    };

    $scope.submit = function () {
        if (!$scope.validate()) {
            return;
        }

        // Workaround to avoid Django CSRF token checking.
        var csrftoken = $.cookie('csrftoken'),
            sessionid = $.cookie('sessionid');
        $.removeCookie('csrftoken');
        $.removeCookie('sessionid');

        Auth.login($scope.username, $scope.password, function (err) {
            $.cookie('csrftoken', csrftoken);
            $.cookie('sessionid', sessionid);

            var dest = $location.search().destination;

            if (err) {
                $scope.invalidLogin = true;
            } else {
                if (dest) {
                    var destPath = dest.slice(0, dest.indexOf(':'));
                    var destHash = dest.slice(dest.indexOf(':') + 1);
                    $location.url(destPath + '?' + destHash);
                }
                else {
                    $state.go('dashboard');
                }
            }
        });
    };
});
