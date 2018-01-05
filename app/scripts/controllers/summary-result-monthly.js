/* global moment, angular */
'use strict';

angular.module('poddDashboardApp')

.controller('SummaryResultMonthlyModeCtrl', function(shared, Menu) {
    Menu.setActiveMenu('summary');
})

.controller('SummaryResultMonthlyCtrl', function($scope, SummaryResultMonthly) {
    $scope.reports = [];
    SummaryResultMonthly.get().$promise.then(function(groups) {
       $scope.groups = groups;
    });
});
