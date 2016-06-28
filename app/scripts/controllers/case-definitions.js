'use strict';

angular.module('poddDashboardApp')

.controller('CaseDefinitionsModeCtrl', function ($scope, shared, Menu) {
  Menu.setActiveMenu('users');
})

.controller('CaseDefinitionsCtrl', function ($scope, CaseDefinition) {
  $scope.control = {
    refresh: function () {
      $scope.items = CaseDefinition.explained();
    }
  };

  $scope.control.refresh();
})

;
