/*globals moment*/
'use strict';

angular.module('poddDashboardApp')

/**
 * Show list of recent reports.
 */
.controller('DashboardCtrl', function ($scope, Search, shared,
                                  AdministrationArea,
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
  $scope.loadingnegativeReports = true;
  Search.query(negativeQuery).$promise
    .then(function (resp) {
      $scope.negativeReports = resp.results;
      $scope.loadingnegativeReports = false;
    })
    .catch(function () {
      $scope.loadingnegativeReports = false;
    });

    var positiveQuery = {
      'q': 'type:0 AND date:[ * TO ' + moment().format('YYYY-MM-DD') +']',
      'page_size': 3,
      'tz': (new Date()).getTimezoneOffset() / -60
    };

    $scope.positiveReports = [];
    $scope.loadingpositiveReports = true;
    Search.query(positiveQuery).$promise
      .then(function (resp) {
        $scope.positiveReports = resp.results;
        $scope.loadingpositiveReports = false;
      })
      .catch(function () {
        $scope.loadingpositiveReports = false;
      });

      var userQuery = {
          'page': 1,
          'page_size': 3,
          'isVolunteer': true,
          'order': '-id'
      };

      $scope.users = [];
      $scope.loadingUsers = true;
      User.list(userQuery).$promise.then(function (data) {
          $scope.users = data
          $scope.loadingUsers = false;
      }).catch(function () {
          $scope.loadingUsers = false;
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
      $scope.loadingPerformanceUsers = true;
      SummaryPerformancePerson.query(performanceUserQuery).$promise.then(function (data) {
          $scope.performanceUsers = data;
          $scope.loadingPerformanceUsers = false;
      }).catch(function () {
          $scope.loadingPerformanceUsers = false;
      });

      var administrationAreasQuery = {
        keywords: ['ตำบล', 'บ้าน'],
        page_size: 2,
        page: 1,
        name__startsWith: 'บ้าน'
      };

      $scope.administrationAreas = [];
      AdministrationArea.contacts(administrationAreasQuery).$promise.then(function (resp) {
        $scope.administrationAreas = resp.results;
      });
});
