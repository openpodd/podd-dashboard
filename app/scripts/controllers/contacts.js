'use strict';

angular.module('poddDashboardApp')

.controller('ContactsModeCtrl', function (Menu) {
  Menu.setActiveMenu('contacts');

})

.controller('ContactsCtrl', function ($scope, Menu, AdministrationArea, 
      $state, $stateParams, $window) {
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


  $scope.search = function () {
    $state.go('contacts', { q: $scope.query.name });
  };

  $scope._search = function () {
    $scope.query.page = 1;

    $scope.willShowResult = true;
    $scope.loading = true;

    $scope.empty = false;
    $scope.error = false;

    $scope.canLoadMore = true;

    AdministrationArea.contacts($scope.query).$promise.then(function (resp) {
      $scope.administrationAreas = resp.results;
      
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

  $scope.selected = '';
  $scope.oldSelectedContact = '';

  $scope.selectedArea = function(area) {
    $scope.selected = area;
    $scope.oldSelectedContact = area.contacts;
    $scope.newSelectedContact = area.contacts;
  };

  $scope.disabledUpdateBtn = false;
  $scope.saveContact = function() {
    var params = [{
      'id':  $scope.selected.id,
      'contacts': $scope.newSelectedContact
    }];

    $scope.disabledUpdateBtn = true;
    AdministrationArea.updateContacts(params).$promise.then(function (resp) {
      $scope.selected.contacts = $scope.newSelectedContact;
      $scope.disabledUpdateBtn = false;
      $('#contactModal').modal('toggle');

    }).catch(function () {
      $scope.selected.contacts = $scope.oldSelectedContact;
      $scope.disabledUpdateBtn = false;
      $('#contactModal').modal('toggle');

    });
  };

    $scope.doQueryOnParams = function (params) {

        if ($state.current.name === 'contacts') {

            $scope.query.name = $window.decodeURIComponent(params.q || '');
                

            if ($scope.query.name === '') {
              delete $scope.query.q;
            }

            return $scope._search();
        }
    };

    $scope.doQueryOnParams($stateParams);
    $scope.$on('$stateChangeSuccess', function (scope, current, params, old, oldParams) {
        if ($state.current.name === 'contacts') {
            if (oldParams !== params) {
                $scope.doQueryOnParams(params);
            }
        }
    });

})

;
