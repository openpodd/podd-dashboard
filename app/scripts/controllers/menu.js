'use strict';

angular.module('poddDashboardApp')

.controller('MenuCtrl', function ($scope, $http, shared, $window, $location, Menu, storage, Auth, Domain) {
    $scope.shared = shared;

    $scope.$watch('shared.loggedIn', function (newValue) {
        $scope.isShowNav = newValue;
    });



    $scope.domainMap = Domain.list();

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

    $scope.switchDomain = function (domainId) {
        console.log('switchDomain', domainId)
        return Domain.switchDomain({domain: domainId}).$promise
            .then(function (resp) {
                $window.location.reload();
            })
            .finally(function () {

            });
    };

});
