/* global swal, d3 */
'use strict';

angular.module('poddDashboardApp')

.controller('SummaryVisualizationModeCtrl', function ($scope, shared, Menu) {
    Menu.setActiveMenu('summary');

    // clear
    $scope.$parent.closeReportList();
    shared.reportWatchId = null;
})

.controller('SummaryVisualizationCtrl', function ($scope, Menu, User, UserDetail, Authority, AuthorityView) {
    Menu.setActiveMenu('summary');
    
    

});
