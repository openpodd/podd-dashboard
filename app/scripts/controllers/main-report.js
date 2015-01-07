'use strict';

angular.module('poddDashboardApp')

.controller('MainReportCtrl', function ($scope, $location, $stateParams, shared) {
    console.log('init main report ctrl');

    $scope.shared = shared;

    $scope.$watch('shared.reportTypeTemplateLoaded', function (newValue) {
        if (newValue) {
            $scope.$parent.viewReport($stateParams.reportId);
        }
    });
});
