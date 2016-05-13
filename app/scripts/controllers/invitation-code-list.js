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
    

});
