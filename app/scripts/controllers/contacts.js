'use strict';

angular.module('poddDashboardApp')

.controller('ContactsModeCtrl', function (Menu) {
  Menu.setActiveMenu('contacts');

})

.controller('ContactsCtrl', function ($scope, Menu, AdministrationArea) {
  Menu.setActiveMenu('contacts');

  $scope.administrationAreas = [];

  $scope.willShowResult = true;
  $scope.loading = true;

  $scope.query = {
    'parentName': 'ตำบล',
  };

  $scope.search = function () {

    $scope.willShowResult = true;
    $scope.loading = true;

    AdministrationArea.contacts($scope.query).$promise.then(function (resp) {
      $scope.administrationAreas = resp;
      
      $scope.willShowResult = false;
      $scope.loading = false;
    });
  };

  $scope.search();

})

;
