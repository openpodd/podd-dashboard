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
                                  Authority, AuthorityView, NotificationAuthorities,
                                  User, Menu, $location) {
  console.log('-> In DashboardCtrl');

  Menu.setActiveMenu('dashboard');
  shared.subscribe = Menu.hasPermissionOnMenu('view_dashboard_subscibe');

  $scope.canUpdateContact = Menu.hasPermissionOnMenu('view_dashboard_plan');
  $scope.canUpdateNotification = Menu.hasPermissionOnMenu('view_dashboard_users');

  $scope.dashboard = {
      users: 0,
      positiveReports: 0,
      negativeReports: 0
  };

  $scope.onlyGraph = true;
  $scope.selected = 'day';

  var params = {
      subscribe: shared.subscribe
  };

  $scope.lastWeek = true;
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
          'subscribe': shared.subscribe,
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
          'subscribe': shared.subscribe
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
        name__startsWith: 'บ้าน',
        subscribe: shared.subscribe
      };

      $scope.administrationAreas = [];
      $scope.loadingContacts = true;
      AdministrationArea.contacts(administrationAreasQuery).$promise.then(function (resp) {
        $scope.administrationAreas = resp.results;
        $scope.loadingContacts = false;
      });


      $scope.loadingNotification = true;
      $scope.authority = null;
      $scope.notificationTemplates = [];

      function getNotificationTemplate(authority) {
          var params = {id: authority.id};
          Authority.notificationTemplates(params).$promise.then(function (data) {
              $scope.notificationTemplates = data;
              $scope.loadingNotification = false;
          }).catch(function () {
              $scope.loadingNotification = false;
          });
      }

      AuthorityView.list().$promise.then(function (data) {
          data.forEach(function (item) {
              if($scope.authority !== null) {
                  return;
              }
              $scope.authority = item;
              getNotificationTemplate(item);
          });
      }).catch(function () {
          $scope.loading = false;
          $scope.error = true;
      });

      $scope.selectedTemplate = function(template) {
          $scope.selectedTemplateContact = template;
          $scope.newSelectedContact = template.contact.to;
      };
});
