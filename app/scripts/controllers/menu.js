'use strict';

angular.module('poddDashboardApp')

.controller('MenuCtrl', function ($scope, $http, shared, $location) {
    $scope.shared = shared;

    $scope.logout = function () {
        $scope.shared.loggedIn = false;
        shared.loggedIn = false;
        $.removeCookie('token');
    };
});
