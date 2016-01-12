'use strict';

angular.module('poddDashboardApp')

.controller('MenuCtrl', function ($scope, $http, shared, $location, Menu, storage) {
    $scope.shared = shared;

    $scope.logout = function () {
        $scope.shared.loggedIn = false;
        shared.loggedIn = false;
        shared.menuPermissions = [];
        shared.summaryReportMode = false;
        shared.summaryPersonMode = false;
        shared.summaryPerformancePersonMode = false;
        shared.summaryReportMonthMode = false;
        shared.summaryScenarioMode = false;
        $.removeCookie('token');
        storage.clearAll();
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
