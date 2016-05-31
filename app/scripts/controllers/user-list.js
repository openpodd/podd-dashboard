/* global swal */
'use strict';

angular.module('poddDashboardApp')

.controller('UsersModeCtrl', function ($scope, shared, Menu) {
    Menu.setActiveMenu('users');

    // clear
    $scope.$parent.closeReportList();
    shared.reportWatchId = null;
})

.controller('UsersCtrl', function ($scope, Menu, User, UserDetail, Authority, AuthorityView) {
    Menu.setActiveMenu('users');

    $scope.users = [];
    $scope.loading = true;
    $scope.page = 0;
    $scope.pageSize = 20;
    $scope.lastPage = false;

    $scope.userSelected = {};
    $scope.userBeforeChange = {};
    $scope.authorities = {};
    $scope.authority = {};

    AuthorityView.list().$promise.then(function (data) {
        data.forEach(function (item) {
            $scope.authority = item;
            return;
        });
        $scope.authorities = data;
    }).catch(function () {
        $scope.loading = false;
        $scope.error = true;
    });

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
        User.list(query).$promise.then(function (data) {
            console.log('loaded users data', data);
            data.forEach(function (item) {
                $scope.users.push(item);
                $scope.loading = false;
            });
            if (data.length === 0) {
                $scope.lastPage = true;
            }
            $scope.loading = false;
        }).catch(function () {
            $scope.loading = false;
            $scope.error = true;
        });;
    }

    refreshUsers();


    $scope.loadMore = function loadMore() {
        if ($scope.lastPage){
            return;
        }

        $scope.page += 1;
        refreshUsers();

    };

    $scope.selectedUser = function (user) {
        if (user === null) {
            $scope.userSelected = {
                displayPassword: randomPassword(),
                authority: $scope.authority
            };

        } else {
            $scope.userSelected = user;
            // $scope.userSelected.authority = $scope.user.authority;
        }
        $scope.userBeforeChange = angular.copy(user);
    };

    $scope.submitUser = function () {
        if (!$scope.userSelected.firstName && !$scope.userSelected.email &&
            $scope.userSelected.authority) {
            swal('เกิดข้อผิดพลาด', 'คุณกรอกข้อมูลไม่ครบถ้วน', 'error');
            return;
        }

        if ($scope.userSelected.id) {
            UserDetail.update($scope.userSelected).$promise.then(function (data) {
                swal('สำเร็จ', 'แก้ไขรายละเอียดของผู้ใช้สำเร็จ', 'success');

                $scope.userSelected = data;
                angular.copy($scope.userSelected, $scope.user);
            }).catch(function () {
                swal('เกิดข้อผิดพลาด', 'ไม่สามารถแก้ไขรายละเอียดของผู้ใช้ได้', 'error');
                $scope.resetUser();
            });
        } else {
            User.create($scope.userSelected).$promise.then(function (data) {
                var params = {
                    id: $scope.userSelected.authority.id,
                    userId: data.id
                };

                Authority.users(params).$promise.then(function (_data) {
                    swal('สำเร็จ', 'เพิ่มผู้ใช้งานสำเร็จ', 'success');
                    data.authority = $scope.userSelected.authority;
                    $scope.users.push(data);
                });

            }).catch(function () {
                swal('เกิดข้อผิดพลาด', 'ไม่สามารถเพิ่มผู้ใช้ได้', 'error');
                $scope.resetUser();
            });
        }
    };

    $scope.resetUser = function () {
        angular.copy($scope.userBeforeChange, $scope.userSelected);
    };

});
