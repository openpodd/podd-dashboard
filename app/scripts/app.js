'use strict';

// Production steps of ECMA-262, Edition 5, 15.4.4.17
// Reference: http://es5.github.io/#x15.4.4.17
if (!Array.prototype.some) {
  Array.prototype.some = function(fun /*, thisArg*/) {
    'use strict';

    if (this == null) {
      throw new TypeError('Array.prototype.some called on null or undefined');
    }

    if (typeof fun !== 'function') {
      throw new TypeError();
    }

    var t = Object(this);
    var len = t.length >>> 0;

    var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
    for (var i = 0; i < len; i++) {
      if (i in t && fun.call(thisArg, t[i], i, t)) {
        return true;
      }
    }

    return false;
  };
}

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
    'ngRoute',
    'ngSanitize',
    'ngTouch'
  ])

  .factory('addTrailingSlashInterceptor', function ($q) {
    var apiUrls = [
      /\/api-token-auth/,
      /\/reports/,
      /\/reportType/,
      /\/dashboard/,
      /\/reportComments/
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
    return {}
  })

  .config(function ($routeProvider, $httpProvider) {
    $httpProvider.interceptors.push('addTrailingSlashInterceptor');

    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'mainctrl'
      })
      .when('/login', {
        templateUrl: 'views/login.html',
        controller: 'LoginCtrl'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
