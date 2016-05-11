'use strict';

angular.module('poddDashboardApp')

.controller('UsersModeCtrl', function ($scope, shared, Menu) {
    Menu.setActiveMenu('users');

    // clear
    $scope.$parent.closeReportList();
    shared.reportWatchId = null;
})

.controller('UsersCtrl', function ($scope, Menu, Users) {
    Menu.setActiveMenu('users');
    
    $scope.users = []
    $scope.loading = true;
    $scope.page = 0;
    $scope.pageSize = 20;
    $scope.lastPage = false; 

    $scope.userSelected = null;

    function randomPassword() {
        var number = Math.floor(Math.random() * 999999);
        var str = '' + number;
        while (str.length < 6) {
            str = '0' + str;
        }

        return str;
    }

    function refreshUsers() {

        var query = {
            'page': $scope.page,
            'page_size': $scope.pageSize,
        };

        $scope.loading = true;
        Users.list(query).$promise.then(function (data) {
            console.log('loaded users data', data);
            data.forEach(function (item) {
                $scope.users.push(item);
            });
            $scope.loading = false;
            if (data.length == 0) {
                $scope.lastPage = true; 
            }
        });
    }

    refreshUsers();


    $scope.loadMore = function loadMore() {
        if ($scope.lastPage)
            return;

        $scope.page += 1;
        refreshUsers();

    };

    $scope.selectedUser = function (user) {
        if (user == null) {
            $scope.userSelected = {
                displayPassword: randomPassword()
            };

        } else {
            $scope.userSelected = user; 
        }
    }
});
