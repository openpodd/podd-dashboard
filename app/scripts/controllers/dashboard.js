/*globals moment*/
'use strict';

angular.module('poddDashboardApp')

/**
 * Show list of recent reports.
 */
.controller('DashboardCtrl', function ($scope, Search, shared,
                                  SummaryReportVisualization, SummaryDashboardVisualization,
                                  SummaryPerformancePerson,
                                  User, Menu, $location) {
  console.log('-> In DashboardCtrl');

  Menu.setActiveMenu('dashboard');

  $scope.dashboard = {
      users: 0,
      positiveReports: 0,
      negativeReports: 0
  };

  var params = {
      subscribe: shared.subscribe
  };

  SummaryDashboardVisualization.get(params).$promise.then(function (data) {
      $scope.dashboard = data;
  });


  var negativeQuery = {
    '__missing__': 'parent',
    'q': 'negative:true AND testFlag:false',
    'page_size': 5,
    'tz': (new Date()).getTimezoneOffset() / -60
  };

  $scope.negativeReports = [];
  Search.query(negativeQuery).$promise
    .then(function (resp) {
      $scope.negativeReports = resp.results;
    })
    .catch(function () {
      $scope.error = true;
    })
    .finally(function () {
      $scope.loading = false;
    });

    var positiveQuery = {
      'q': 'type:0',
      'page_size': 3,
      'tz': (new Date()).getTimezoneOffset() / -60
    };

    $scope.positiveReports = [];
    Search.query(positiveQuery).$promise
      .then(function (resp) {
        $scope.positiveReports = resp.results;
      })
      .catch(function () {
        $scope.error = true;
      })
      .finally(function () {
        $scope.loading = false;
      });

      var userQuery = {
          'page': 1,
          'page_size': 3,
          'isVolunteer': true,
          'order': '-id'
      };

      $scope.users = [];
      User.list(userQuery).$promise.then(function (data) {
          $scope.users = data
      }).catch(function () {

      });

      $scope.getAvatarUrl = function (avatarUrl) {
        if (avatarUrl == null) {
          return 'images/avatar.png';
        }
        return avatarUrl;
      }

      var performanceUserQuery = {
          'month': (moment().month() + 1) + '/' + moment().year(),
      };

      $scope.performanceUsers = [];
      SummaryPerformancePerson.query(performanceUserQuery).$promise.then(function (data) {
          $scope.performanceUsers = data;
      }).catch(function () {

      });

});
