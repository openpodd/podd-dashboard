'use strict';

function htmlToPlainText(text) {
  var allowedTags = ['p', 'br'],
      tmp = String(text);

  allowedTags.forEach(function (tag) {
    tmp = String(tmp).replace(new RegExp('<' + tag + '([^>]*)>', 'gm'), '[open_tag:' + tag + ':$1]');
    tmp = String(tmp).replace(new RegExp('<\/' + tag + '>', 'gm'), '[close_tag:' + tag + ']');
  });

  tmp = tmp.replace(/<[^>]+>/gm, '');
  tmp = tmp.replace(/\[open_tag\:([^\s])*?\:(.*?)\]/gm, '<$1$2>');
  tmp = tmp.replace(/\[close_tag:([^\s])*?\]/gm, '<$1>');

  return tmp;
}


/**
 * @ngdoc overview
 * @name poddDashboardApp
 * @description
 * # poddDashboardApp
 *
 * Main module of the application.
 */
angular
  .module('poddDashboardApp', [
    'ngResource',
    'ngAnimate',
    'ngCookies',
    'ngResource',
    // 'ngRoute',
    'ngSanitize',
    'ngTouch',
    'angularMoment',
    'ui.bootstrap',
    'angularFileUpload',
    'perfect_scrollbar',
    'bootstrapLightbox',
    'ui.router',
    'ui.grid',
    'ui.grid.selection',
    'ui.grid.exporter',
    'ui.grid.resizeColumns',
    'ui.grid.pinning',
    'daterangepicker',
    'ui.select',
    'angularChart',
    'angulartics',
    'angulartics.google.analytics',
    'angularLocalStorage',
    'ngTagsInput'
  ])

  // override z-index of ui.bootstrap
  .run(function ($rootScope, shared, $templateCache) {
    $templateCache.put('template/modal/backdrop.html',
      '<div class=\"modal-backdrop fade {{ backdropClass }}\"\n' +
      '     ng-class=\"{in: animate}\"\n' +
      '     ng-style=\"{\'z-index\': 10400 + (index && 1 || 0) + index*10}\"\n' +
      '></div>\n' +
      '');

    $templateCache.put('template/modal/window.html',
      '<div tabindex=\"-1\" role=\"dialog\" class=\"modal fade\" ng-class=\"{in: animate}\" ng-style=\"{\'z-index\': 10500 + index*10, display: \'block\'}\" ng-click=\"close($event)\">\n' +
      '    <div class=\"modal-dialog\" ng-class=\"{\'modal-sm\': size == \'sm\', \'modal-lg\': size == \'lg\'}\"><div class=\"modal-content\" modal-transclude></div></div>\n' +
      '</div>');

    $rootScope.shared = shared;
  })

  .config(function(cfpLoadingBarProvider) {
    cfpLoadingBarProvider.includeSpinner = false;
  })

  .factory('addTrailingSlashInterceptor', function ($q) {
    var apiUrls = [
      /\/api-token-auth/,
      /\/flags/,
      /\/reports/,
      /\/reportTypes/,
      /\/reportStates/,
      /\/dashboard/,
      /\/administrationArea/,
      /\/mentions/,
      /\/mentions\/seen/,
      /\/reportComments/,
      /\/users\/search/,
      /\/summary\/areas\/count-reports/,
      /\/summary\/areas\/show-detail/,
      /\/summary\/authorities\/show-detail/,
      /\/summary\/users\/inactive/,
      /\/summary\/users\/performance/,
      /\/summary\/reports/,
      /\/ping/,
      /\/tags\/list/,
      /\/users\/profile/,
      /\/authorities/,
      /\/reportTags/
    ];

    function matchAPIUrls(url) {
      return apiUrls.some(function (item) {
        return url.match(item);
      });
    }

    return {
      request: function (config) {
        if (matchAPIUrls(config.url)) {
          if (config.url.slice(-1) !== '/') {
            config.url += '/';
          }
          config.responseType = 'json';
        }

        return config || $q.when(config);
      }
    };
  })

  .filter('htmlToPlainText', function () {
    return function (text) {
      return htmlToPlainText(text);
    };
  })

  .factory('shared', function() {
    return {
      loggedIn: $.cookie('token') ? true : false,
      newReportQueue: {}
    };
  })

  .run(function ($location, Auth) {
      Auth.verify().catch(function () {
          $location.url('/login');
      });
  })

  // .config(function ($routeProvider, $httpProvider, $stateProvider, $urlRouterProvider) {
  .config(function ($httpProvider, $stateProvider, $urlRouterProvider) {
    $httpProvider.interceptors.push('addTrailingSlashInterceptor');

    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('main', {
        url: '/',
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .state('main.report', {
        url: '^/reports/{reportId:int}?confirmCase',
        template: '',
        controller: 'MainReportCtrl'
      })
      .state('main.filter', {
        url: '^/filter?q&reportId',
        template: '',
        controller: 'FilterModeCtrl'
      })
      .state('scenario', {
        url: '/scenario?bottom&left&top&right&zoom',
        templateUrl: 'views/scenario.html',
        controller: 'ScenarioModeCtrl'
      })
      .state('main.summaryreport', {
        url: '^/summary/report?dates&type',
        template: '',
        controller: 'SummaryReportModeCtrl'
      })
      .state('main.summaryreportmonth', {
        url: '^/summary/report-month?month&areaId&typeIds&tags',
        template: '',
        controller: 'SummaryReportMonthModeCtrl'
      })
      .state('main.summaryperson', {
        url: '^/summary/person?dates&percent&type',
        template: '',
        controller: 'SummaryPersonModeCtrl'
      })
      .state('main.summaryperformanceperson', {
        url: '^/summary/performance-person?month&areaId',
        template: '',
        controller: 'SummaryPerformancePersonModeCtrl'
      })
      .state('visualize', {
        url: '/visualize',
        templateUrl: 'views/visualize.html',
        controller: 'VisualizationCtrl'
      })
      .state('main.profile', {
        url: '^/profile',
        templateUrl: 'views/profile.html',
        controller: 'ProfileModeCtrl'
      })
      .state('login', {
        url: '/login',
        templateUrl: 'views/login.html',
        controller: 'LoginCtrl'
      })
      .state('about', {
        url: '/about',
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl'
      });
  });
