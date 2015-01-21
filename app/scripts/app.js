'use strict';

function htmlToPlainText(text) {
  return String(text).replace(/<[^>]+>/gm, '');
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
    'daterangepicker'
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
      /\/reportType/,
      /\/dashboard/,
      /\/administrationArea/,
      /\/notifications/,
      /\/notification\/seen/,
      /\/reportComments/,
      /\/users\/search/,
      /\/reports\/summary\/week/
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
      if ( ! Auth.verify() ) {
          $location.url('/login');
      }
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
      .state('main.summaryreport', {
        url: '^/summary/report?dates&type',
        template: '',
        controller: 'SummaryReportModeCtrl'
      })
      .state('main.summaryperson', {
        url: '^/summary/person?dates&type',
        template: '',
        controller: 'SummaryPersonModeCtrl'
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
