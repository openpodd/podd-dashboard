'use strict';

angular.module('poddDashboardApp')

.controller('MenuCtrl', function ($scope, $http, shared, $location, Menu, storage, Auth) {
    $scope.shared = shared;

    $scope.$watch('shared.loggedIn', function (newValue) {
        $scope.isShowNav = newValue;
    });

    $scope.logout = function () {
        $scope.shared.loggedIn = false;
        Auth.logout();
        $location.url('/login');
    };

    $scope.setActiveMenu = function (name) {
        Menu.setActiveMenu(name);
    };

    $scope.isActiveMenu = function (name) {
        return Menu.isActiveMenu(name);
    };

    $scope.hasPermissionOnMenu = function (menu) {
        return Menu.hasPermissionOnMenu(menu);
    };

});
