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

    AuthorityView.list().$promise.then(function (data) {
        $scope.authorities = data;
        $scope.loading = false;
    }).catch(function () {
        $scope.error = false;
    });

    $scope.renewCode = function(authority) {

        swal({   
            title: "แน่ใจไหม?",   
            text: "คุณต้องการเปลี่ยนแปลงรหัสพื้นที!",   
            type: "warning",   
            showCancelButton: true,   
            confirmButtonColor: "#DD6B55",   
            confirmButtonText: "ใช่",   
            cancelButtonText: "ยกเลิก",   
            closeOnConfirm: false,   
            closeOnCancel: false 
        }, function(isConfirm){   
            if (isConfirm) {     
                var params = {id: authority.id}
                Authority.renew_invitation_code(params).$promise.then(function (data) {
                    angular.copy(data, authority);
                    swal('สำเร็จ', 'แก้ไขรหัสพื้นทีสำเร็จ', 'success');
                }).catch(function () {
                    swal('เกิดข้อผิดพลาด', 'ไม่สามารถแก้ไขรหัสพื้นที่ได้', 'error');
                });   
            } 
        });
        
    }

});
