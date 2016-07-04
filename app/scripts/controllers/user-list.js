/* global swal */
'use strict';

angular.module('poddDashboardApp')

.controller('UsersModeCtrl', function ($scope, shared, Menu) {
    Menu.setActiveMenu('users');

    // clear
    $scope.$parent.closeReportList();
    shared.reportWatchId = null;
})

.controller('UsersCtrl', function ($scope, Menu, User,
                                   UserDetail, Authority, AuthorityView,
                                  uiGridUtils) {
    Menu.setActiveMenu('users');

    $scope.users = [];
    $scope.loading = true;
    $scope.page = 0;
    $scope.pageSize = 20;
    $scope.lastPage = false;

    $scope.userSelected = {};
    $scope.userBeforeChange = {};
    $scope.authorities = {};
    $scope.authority = null;

    AuthorityView.list().$promise.then(function (data) {
        data.forEach(function (item) {
            if($scope.authority !== null) {
                return;
            }
            $scope.authority = item;
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
        });
    }

    refreshUsers();

    $scope.gridOptionsPerson = {
        enableSorting: false,
        data: [],
        columnDefs: [],
        exporterLinkLabel: 'ดาวน์โหลดข้อมูลไฟล์ CSV',
        exporterLinkTemplate: '<span><a class="btn btn-primary btn-sm" download="สรุปการรายงานของอาสา.csv" href=\"data:text/csv;charset=UTF-8,CSV_CONTENT\">LINK_LABEL</a></span>',
        onRegisterApi: function(gridApi){
            $scope.gridApi = gridApi;
        }
    };

    $scope.exportUsers = [];
    function exportUsers(to) {
        User.list().$promise.then(function (data) {
            data.forEach(function (item) {
                $scope.exportUsers.push({
                  'ชื่อบัญชีผู้ใช้': item.username,
                  'ชื่อ': item.firstName,
                  'สกุล': item.lastName,
                  'ที่อยู่': item.contact,
                  'เบอร์ติดต่อ': item.telephone,
                  'วันที่เข้าร่วม': moment(item.dateJoined).format('D MMM YYYY'),
                  'พื้นที่': item.authority.name,
                });
            });

            $scope.gridOptionsPerson.enableSorting = true;
            $scope.gridOptionsPerson.columnDefs = [
                { field: 'ชื่อบัญชีผู้ใช้', displayName: 'ชื่อบัญชีผู้ใช้', headerCellClass: 'cell-center' },
                { field: 'ชื่อ', displayName: 'ชื่อ', headerCellClass: 'cell-center' },
                { field: 'สกุล', displayName: 'สกุล', headerCellClass: 'cell-center' },
                { field: 'ที่อยู่', displayName: 'ที่อยู่', headerCellClass: 'cell-center' },
                { field: 'เบอร์ติดต่อ', displayName: 'เบอร์ติดต่อ', headerCellClass: 'cell-center' },
                { field: 'วันที่เข้าร่วม', displayName: 'วันที่เข้าร่วม', headerCellClass: 'cell-center' },
                { field: 'พื้นที่', displayName: 'พื้นที่', headerCellClass: 'cell-center' },
            ];

            $scope.gridOptionsPerson.data = $scope.exportUsers;

            setTimeout(function(){
              if (to === 'csv') {
                uiGridUtils.exportCsv($scope.gridApi.grid, 'list-user.csv');
              } else {
                uiGridUtils.exportXlsx($scope.gridApi.grid, 'list-user.xlsx');
              }
            }, 100);
        }).catch(function () {});
    }

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
                    if (!$scope.is_admin) {
                        swal('สำเร็จ', 'เพิ่มผู้ใช้งานสำเร็จ', 'success');
                    }
                    data.authority = $scope.userSelected.authority;
                    $scope.users.push(data);

                    if ($scope.is_admin) {
                        Authority.admins(params).$promise.then(function (__data) {
                            swal('สำเร็จ', 'เพิ่มผู้ใช้งานสำเร็จ', 'success');
                        }).catch(function () {
                            swal('เกิดข้อผิดพลาด', 'เพิ่มผู้ใช้งานแล้ว แต่ไม่สามารถตั้งค่าผู้ใช้เป็นผู้ดูแลของสังกัดได้', 'error');
                            $scope.resetUser();
                        });
                    }
                }).catch(function () {
                    swal('เกิดข้อผิดพลาด', 'ไม่สามารถเพิ่มผู้ใช้ได้', 'error');
                    $scope.resetUser();
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

    $scope.csvExport = function () {
        if ($scope.exportUsers.length === 0) {
          exportUsers('csv');
        } else {
          uiGridUtils.exportCsv($scope.gridApi.grid, 'list-user.csv');
        }
    };

    $scope.xlsxExport = function () {
      if ($scope.exportUsers.length === 0) {
        exportUsers('xlsx');
      } else {
        uiGridUtils.exportXlsx($scope.gridApi.grid, 'list-user.xlsx');
      }
    }

});
