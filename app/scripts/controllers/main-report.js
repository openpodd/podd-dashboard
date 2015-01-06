'use strict';

angular.module('poddDashboardApp')

.controller('MainReportCtrl', function ($scope, $location, $stateParams, ReportModal) {
    console.log('init main report ctrl');
    $scope.$parent.viewReport($stateParams.reportId);
});
