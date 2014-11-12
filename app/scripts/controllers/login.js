'use strict';

angular.module('poddDashboardApp')

.controller('LoginCtrl', function ($scope, $http) {
    var url = API_BASEPATH + 'api-token-auth/';
    $scope.username = '';
    $scope.password = '';

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
    }

    $scope.submit = function () {
        if (!$scope.validate()) return;

        var params = {
            username: $scope.username,
            password: $scope.password,
        }
        $http.post(url, params)
            .success(function (resp, status) {
                window.location.href = '/#/';
            })
            .error(function (resp, status) {
                $scope.invalidLogin = true;
            });
    };
});
