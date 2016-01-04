'use strict';

angular.module('poddDashboardApp')

.controller('PlansModeCtrl', function (Menu) {
  Menu.setActiveMenu('plans');
})

.controller('PlansCtrl', function ($scope, Menu, PlanReport) {
  Menu.setActiveMenu('plans');

  PlanReport.query().$promise.then(function (resp) {
    $scope.planReports = resp;
    $scope.planReports.forEach(function (item) {
      if (!item.log.plan.levels) {
        item.log.plan.levels = [
          { name: 'Red', code: 'red' },
          { name: 'Yellow', code: 'yellow' },
          { name: 'Green', code: 'green' }
        ];
      }
    });
  });
})

;
