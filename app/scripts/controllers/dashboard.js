/*globals moment*/
'use strict';

angular.module('poddDashboardApp')

/**
 * Show list of recent reports.
 */

.controller('DashboardCtrl', function ($scope, Search, shared, dashboard,
                                  AdministrationArea, ReportModal,
                                  SummaryReportVisualization, SummaryDashboardVisualization,
                                  SummaryPerformancePerson, Reports,
                                  Authority, AuthorityView, NotificationAuthorities,
                                  newDashboard,
                                  User, Menu, $location, $state, $stateParams) {
  console.log('-> In DashboardCtrl');

  shared.reportWatchId = null;
  shared.dashboardMode = true;

  Menu.setActiveMenu('dashboard');
  shared.subscribe = Menu.hasPermissionOnMenu('view_dashboard_subscibe');

  $scope.canUpdateContact = Menu.hasPermissionOnMenu('view_dashboard_plan');
  $scope.canUpdateNotification = Menu.hasPermissionOnMenu('view_dashboard_users');

  $scope.activeReportId = null;
  $scope.onClickReport = function (reportId) {
    $location.search('reportId', reportId);
  };

  $scope.closeReportView = function () {
    $location.search('reportId', null);
  };

  // report view related.
  $scope.viewReport = function (reportId) {
    ReportModal.show();
    $scope.loadingReportView = true;
    $scope.loadingReportViewError = false;
    // Also clear report data.
    $scope.report = null;

    Reports.get({ reportId: reportId }).$promise.then(function (data) {
      console.log('loaded report data', data);

      var tmpFormData = [], index;
      if (data.originalFormData && !data.originalFormData.forEach) {
        for (index in data.originalFormData) {
          if (data.originalFormData.hasOwnProperty(index)) {
            tmpFormData.push({
              name: index,
              value: data.originalFormData[index]
            });
          }
        }
        data.originalFormData = tmpFormData;
      }

      $scope.report = data;
    })
    .catch(function (err) {
      if (err.status === 403) {
        $scope.closeReportView();
        swal({
          title: '',
          text: 'ขออภัย คุณยังไม่ได้รับสิทธิดูรายงานนี้',
          confirmButtonText: 'ตกลง',
          confirmButtonClass: 'btn-default',
          type: 'error'
        });
      }
      else {
        $scope.loadingReportViewError = true;
      }
    })
    .finally(function () {
      $scope.loadingReportView = false;
    });
  };

  // Watch for report id changed.
  $scope.$watch('shared.reportWatchId', function (newValue) {
    if (newValue && newValue !== $scope.activeReportId) {
      $location.search('reportId', newValue);
    }
  });


  function locationChange() {
    var reportId = $location.search().reportId;

    // check if the same state.
    if ($location.path() !== $state.$current.url.sourcePath) {
      return;
    }
    // do nothing if no params
    if (reportId === true || reportId === false ) {
      // also clear params reportId if is empty.
      $location.search('reportId', null);
      return;
    }

    reportId = parseInt(reportId);
    if (reportId && angular.isNumber(reportId) && reportId !== $scope.activeReportId) {
      $scope.activeReportId = reportId;
      shared.reportWatchId = reportId;
      $scope.viewReport(reportId);
    }
    if (!reportId) {
      $scope.activeReportId = null;
      shared.reportWatchId = null;
      ReportModal.close();
    }
  }

  $scope.$on('$locationChangeSuccess', function (event) {
    locationChange();
  });

  locationChange();

  /* ------------------- INIT CACHE --------------------- */
  var cached = lscache.get('dashboard');
  var cacheTimeout = 60 * 6;
  var useCache = true;

  function setDataFromCache(cached) {
    $scope.dashboard = cached.visualization;
    $scope.users = cached.newlyReporters;
    $scope.positiveReports = cached.positiveReports;
    $scope.performanceUsers = cached.performanceReporters;
    $scope.administrationAreas = cached.contacts.length > 2? cached.contacts.splice(0, 2): cached.contacts;
    $scope.notificationTemplates = cached.notificationTemplates;
  }

  var dashboardQuery = {
    page_size: 3,
    month: moment().format('M/YYYY'),
    subscribe: shared.subscribe,
    tz: (new Date()).getTimezoneOffset() / -60,
    lastWeek: true,
    name__startsWith: 'บ้าน',
    keywords: ['ตำบล', 'บ้าน']
  };

  // Independent from cache.
  loadNegativeReports();

  if (useCache) {
    if (!cached || !cached.positiveReports) {

      $scope.loadingpositiveReports = true;
      $scope.loadingNotification = true;
      $scope.loadingUsers = true;
      $scope.loadingPerformanceUsers = true;
      $scope.loadingContacts = true;
      $scope.loadingUsers = true;

      dashboard.getDashboardData(dashboardQuery).$promise
        .then(function (data) {
          lscache.set('dashboard', data, cacheTimeout);
          cached = data;
          setDataFromCache(cached);
        })
        .catch(function (err) {
          // load data with legacy method.
          loadVolunteersCount();
          loadVolunteersList();
          loadPositiveReports();
          loadNegativeReports();
          loadVolunteersPerformance();
          loadContacts();
          loadNotificationTemplates();
        })
        .finally(function () {
          $scope.loadingpositiveReports = false;
          $scope.loadingNotification = false;
          $scope.loadingUsers = false;
          $scope.loadingPerformanceUsers = false;
          $scope.loadingContacts = false;
          $scope.loadingUsers = false;
        });
    }
    else {
      setDataFromCache(cached);
    }
  }
  else {
    // load data with legacy method.
    loadVolunteersCount();
    loadVolunteersList();
    loadPositiveReports();
    loadNegativeReports();
    loadVolunteersPerformance();
    loadContacts();
    loadNotificationTemplates();
  }

  var params = {
      subscribe: shared.subscribe
  };

  $scope.lastWeek = true;

  function loadVolunteersCount() {
    SummaryDashboardVisualization.get(params).$promise.then(function (data) {
      $scope.dashboard = data;
    });
  }

  function loadVolunteersList() {
    var userQuery = {
      'page': 1,
      'page_size': 3,
      'isVolunteer': true,
      'subscribe': shared.subscribe,
      'order': '-id'
    };

    $scope.users = [];
    $scope.loadingUsers = true;

    User.list(userQuery).$promise
      .then(function (data) {
        $scope.users = data
        $scope.loadingUsers = false;
      })
      .catch(function () {
        $scope.loadingUsers = false;
      });
  }

  function loadPositiveReports() {
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
  }

  function loadNegativeReports() {
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
  }

  function loadVolunteersPerformance() {
    var performanceUserQuery = {
      'month': (moment().month() + 1) + '/' + moment().year(),
      'subscribe': shared.subscribe,
      'tz': (new Date()).getTimezoneOffset() / -60
    };

    $scope.performanceUsers = [];
    $scope.loadingPerformanceUsers = true;

    SummaryPerformancePerson.query(performanceUserQuery).$promise
      .then(function (data) {
        $scope.performanceUsers = data;
        $scope.loadingPerformanceUsers = false;
      })
      .catch(function () {
        $scope.loadingPerformanceUsers = false;
      });
  }

  function loadContacts() {
    var administrationAreasQuery = {
      keywords: ['ตำบล', 'บ้าน'],
      page_size: 2,
      page: 1,
      name__startsWith: 'บ้าน',
      subscribe: shared.subscribe
    };

    $scope.administrationAreas = [];
    $scope.loadingContacts = true;

    AdministrationArea.contacts(administrationAreasQuery).$promise
      .then(function (resp) {
        $scope.administrationAreas = resp.results;
        $scope.loadingContacts = false;
      })
      .catch(function () {
        $scope.loadingContacts = false;
      });
  }

  function loadNotificationTemplates() {
    $scope.loadingNotification = true;
    $scope.authority = null;
    $scope.notificationTemplates = [];

    AuthorityView.list({'page_size': 1}).$promise
      .then(function (data) {
        $scope.authority = data.length && data[0];
        getNotificationTemplate($scope.authority);
      })
      .catch(function () {
        $scope.loading = false;
        $scope.error = true;
      });
  }

  function getNotificationTemplate(authority) {
    var params = {id: authority.id};
    Authority.notificationTemplates(params).$promise
      .then(function (data) {
        $scope.notificationTemplates = data;
        $scope.loadingNotification = false;
      })
      .catch(function () {
        $scope.loadingNotification = false;
      });
  }

  $scope.selectedTemplate = function (template) {
    $scope.selectedTemplateContact = template;
    $scope.newSelectedContact = template.contact.to;
  };

  $scope.onlyGraph = true;
  $scope.selected = 'day';

});
