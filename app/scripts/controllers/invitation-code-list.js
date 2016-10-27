/* global swal */
'use strict';

angular.module('poddDashboardApp')

.controller('InvitationCodeModeCtrl', function ($scope, shared, Menu) {
    Menu.setActiveMenu('users');

    // clear
    $scope.$parent.closeReportList();
    shared.reportWatchId = null;
})

.controller('InvitationCodeCtrl', function ($scope, Menu, User, UserDetail, Authority, AuthorityView) {
    Menu.setActiveMenu('users');

    $scope.authorities = [];
    $scope.loading = true;
    $scope.error = false;

    AuthorityView.all().$promise.then(function (data) {
        $scope.authorities = data;
        $scope.loading = false;
    }).catch(function () {
        $scope.loading = false;
        $scope.error = false;
    });

    $scope.renewCode = function(authority) {

        swal({
            title: 'แน่ใจไหม?',
            text: 'คุณต้องการเปลี่ยนแปลงรหัสพื้นที!',
            type: 'warning',
            confirmButtonColor: '#DD6B55',
            confirmButtonText: 'ใช่',
            cancelButtonText: 'ยกเลิก',
            showCancelButton: true,
            closeOnConfirm: true,
            closeOnCancel: true
        }, function(isConfirm){
            if (isConfirm) {
                var params = {id: authority.id};
                Authority.renewInvitationCode(params).$promise.then(function (data) {
                    angular.copy(data, authority);
                    var text = 'แก้ไขรหัสพื้นทีสำเร็จ\nรหัสใหม่คือ ' + data.inviteCode +
                        '\n หมดอายุเมื่อ ' + data.inviteExpiredAt;
                    swal('สำเร็จ', text, 'success');
                }).catch(function () {
                    swal('เกิดข้อผิดพลาด', 'ไม่สามารถแก้ไขรหัสพื้นที่ได้', 'error');
                });
            }
        });
    };

});
