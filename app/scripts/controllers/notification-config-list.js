/* global swal */
'use strict';

angular.module('poddDashboardApp')

.controller('NotificationModeCtrl', function ($scope, shared, Menu) {
    Menu.setActiveMenu('users');

    // clear
    $scope.$parent.closeReportList();
    shared.reportWatchId = null;
})

.controller('NotificationCtrl', function ($scope, Menu, User, UserDetail,
                                          Authority, AuthorityView, NotificationAuthorities) {
    Menu.setActiveMenu('users');

    $scope.authorities = [];
    $scope.loading = true;
    $scope.error = false;
    $scope.authority = null;
    $scope.notificationTemplates = [];


    function getNotificationTemplate(authority) {
        var params = {id: authority.id};
        Authority.notificationTemplates(params).$promise.then(function (data) {
            $scope.notificationTemplates = data;
            $scope.loading = false;
        }).catch(function () {
            $scope.loading = false;
            $scope.error = true;
        });
    }

    AuthorityView.list().$promise.then(function (data) {
        data.forEach(function (item) {
            if($scope.authority !== null) {
                return;
            }
            getNotificationTemplate(item);
            $scope.authority = item;
        });
        $scope.authorities = data;
    }).catch(function () {
        $scope.loading = false;
        $scope.error = true;
    });

    $scope.selectedTemplate = function(template) {
        $scope.selected = template;
        $scope.newSelectedContact = template.contact.to;
    };


    $scope.saveContact = function() {
        var contact = $scope.selected.contact;
        $scope.disabledUpdateBtn = true;

        swal({
            title: 'แน่ใจไหม?',
            text: 'คุณต้องการเปลี่ยนแปลงการแจ้งเตือน!',
            type: 'warning',
            confirmButtonColor: '#DD6B55',
            confirmButtonText: 'ใช่',
            cancelButtonText: 'ยกเลิก',
            showCancelButton: true,
            closeOnConfirm: false,
            closeOnCancel: true
        }, function(isConfirm){
            if (isConfirm) {
                var params = contact;
                params.to = $scope.newSelectedContact;
                console.log(params);

                NotificationAuthorities.update(params).$promise.then(function (data) {
                    angular.copy(data, contact);
                    swal('สำเร็จ', 'แก้ไขสำเร็จ', 'success');
                }).catch(function () {
                    swal('เกิดข้อผิดพลาด', 'ไม่สามารถแก้ไขการแจ้งเตือน่ได้', 'error');
                });
                $scope.disabledUpdateBtn = false;
                $('#contactModal').modal('toggle');
            } else {
                $scope.disabledUpdateBtn = false;
            }
        });
    };

});
