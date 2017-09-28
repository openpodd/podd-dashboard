'use strict';

angular.module('poddDashboardApp')

.controller('MenuCtrl', function ($scope, $http, shared, $window, $location, $state, Menu, storage, Auth, Domain, AggregateReport) {
    $scope.shared = shared;
    $scope.open = false;
    $scope.$watch('shared.loggedIn', function (newValue) {
        $scope.isShowNav = newValue;
        $scope.domainMap = Domain.list();
    });

    $scope.dreports = AggregateReport.list();

    //$scope.domainMap = Domain.list();

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
        return Domain.switchDomain({domain: domainId}).$promise
            .then(function (resp) {
                $window.location.reload();
            })
            .finally(function () {
                $scope.open = !$scope.open;
            });
    };

    $scope.$on('$stateChangeSuccess', function (scope, current, params, old, oldParams) {
        // TO DO: flexible
        if ($state.current.name === 'authority-dashboard') {
            $scope.isShowNav = false;
        }
    });

    $('#bs-example-navbar-collapse-1 a').click(function() {
        var url = $(this).attr('href');
        if (url && url !== '#') {
            $('.navbar-toggle').trigger('click');
        }
    });

    $scope.$watch('open', function (newValue) {
        $('.navbar-toggle').trigger('click');
    });

});
