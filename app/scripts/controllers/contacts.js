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

  var page = 1;
  var pageSize = 10;

  $scope.query = {
    'parentName': 'ตำบล',
    'page_size': pageSize,
    'page': page
  };

  $scope.canLoadMore = true;
  $scope.parentName = '';

  $scope.search = function () {
    page = 1;

    $scope.willShowResult = true;
    $scope.loading = true;

    $scope.empty = false;
    $scope.error = false;

    AdministrationArea.contacts($scope.query).$promise.then(function (resp) {
      $scope.administrationAreas = [];
      $scope.parentName = '';

      angular.forEach(resp.results, function(value, key) {
        if ($scope.parentName !== value.parentName) {
          $scope.parentName = value.parentName;
        } else {
          value.parentName = '';
        }

        $scope.administrationAreas.push(value);

      });

      $scope.willShowResult = false;
      $scope.loading = false;

      if ($scope.administrationAreas.length === 0) {
        $scope.willShowResult = true;
        $scope.empty = true;

      }

      if (resp.next === null) {
        $scope.canLoadMore = false;
      }

    }).catch(function () {
      $scope.willShowResult = true;
      $scope.loading = false;
      $scope.error = true;

    });
  
  };

  $scope.loadMore = function () {
    page ++;

    $scope.query.page = page;
    
    $scope.disabledLoadmoreBtn = true;

    AdministrationArea.contacts($scope.query).$promise.then(function (resp) {

      angular.forEach(resp.results, function(value, key) {
        if ($scope.parentName !== value.parentName) {
          $scope.parentName = value.parentName;
        } else {
          value.parentName = '';
        }

        $scope.administrationAreas.push(value);

      });
      
      if (resp.next === null) {
        $scope.canLoadMore = false;
      }

      $scope.disabledLoadmoreBtn = false;

    }).catch(function () {
      $scope.disabledLoadmoreBtn = false;

    });

  };

  $scope.search();

  $scope.selected = '';

  $scope.selectedArea = function(area) {
    $scope.selected = area.parentName;

  };

})

;
