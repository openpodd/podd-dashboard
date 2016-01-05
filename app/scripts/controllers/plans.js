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
      
      var levelAreas = item.log.level_areas;
      item.affectedAreasCount = 0;
      item.myLevelAreasCount = 0;
      
      item.log.plan.levels.forEach(function (plan) {
        item.affectedAreasCount += levelAreas[plan.code].length;
        item.myLevelAreasCount += item.log.my_level_areas[plan.code].length;
      });
    });
  });
})

;
