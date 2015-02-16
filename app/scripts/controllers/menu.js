'use strict';

angular.module('poddDashboardApp')

.controller('MenuCtrl', function ($scope, $http, shared, $location, Menu) {
    $scope.shared = shared;

    $scope.logout = function () {
        $scope.shared.loggedIn = false;
        shared.loggedIn = false;
        shared.menuPermissions = [];
        $.removeCookie('token');
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
