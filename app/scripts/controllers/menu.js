'use strict';

angular.module('poddDashboardApp')

.controller('MenuCtrl', function ($scope, $http, shared) {
    $scope.shared = shared;

    $scope.logout = function () {
        $scope.shared.loggedIn = false;
        $.removeCookie('accessToken');
    }
});
