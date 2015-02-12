'use strict';

angular.module('poddDashboardApp')

.controller('ProfileModeCtrl', function (shared, Menu) {
    shared.profileMode = true;
    Menu.setActiveMenu('profile');
})

.controller('ProfileCtrl', function ($scope, User) {
    $scope.password = ['', ''];

    $scope.profile = User.profile();

    $scope.profile.$promise
        .then(function () {
            $scope.error = false;
        })
        .catch(function () {
            $scope.error = true;
        });

    function hasError() {
        $scope.error = false;

        $scope.password[0] = $scope.password[0].trim();
        $scope.password[1] = $scope.password[1].trim();

        if ($scope.password[0] === '') {
            $scope.error = true;
            return 1;
        }
        if ($scope.password[1] === '') {
            $scope.error = true;
            return 2;
        }
        if ($scope.password[0].length < 4 || $scope.password[1].length < 4) {
            $scope.error = true;
            return 11;
        }
        if ($scope.password[0].toString() !== $scope.password[1].toString()) {
            $scope.error = true;
            return 3;
        }

        return null;
    }

    $scope.submit = function (e) {
        e.preventDefault();

        $scope.error = false;

        $scope.errorCode = hasError();
        if ($scope.errorCode) {
            $scope.error = true;
        }
        else {
            $scope.error = false;
            User.updatePassword({ password: $scope.password}).$promise
                .then(function () {
                    $scope.error = false;
                    $scope.password[0] = '';
                    $scope.password[1] = '';
                })
                .catch(function () {
                    $scope.error = true;
                    $scope.errorCode = 4;
                });
        }
    };
});
