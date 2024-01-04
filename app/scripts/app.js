"use strict";

function htmlToPlainText(text) {
  var allowedTags = ["p", "br"],
    tmp = String(text);

  // For security issues. Remove all [open_tag], [close_tag] first.
  tmp = tmp.replace(/\[open_tag\:([^\s]*?)\:(.*?)\]/gm, "");
  tmp = tmp.replace(/\[close_tag:([^\s]*?)\]/gm, "");

  allowedTags.forEach(function (tag) {
    tmp = String(tmp).replace(
      new RegExp("<" + tag + "([^>]*)>", "gm"),
      "[open_tag:" + tag + ":$1]"
    );
    tmp = String(tmp).replace(
      new RegExp("</" + tag + ">", "gm"),
      "[close_tag:" + tag + "]"
    );
  });

  /**
   * Fixed nested <p>
   * @see: https://stackoverflow.com/questions/12015804/nesting-p-wont-work-while-nesting-div-will
   * We can use below implement, but this can't handle the nested-nested <p>.
   * ```javascript
   * tmp = String(tmp).replace(new RegExp(/\[open_tag\:p\:(.*?)\](.|\s|\S*?)\[open_tag\:p\:/, 'gm'), '[open_tag:div:$1]$2[open_tag:p:');
   * tmp = String(tmp).replace(new RegExp(/\[close_tag\:(p|div)\](((?!\[open_tag).|(?!\[open_tag)\s|(?!\[open_tag)\S)*?)\[close_tag\:p\]/, 'gm'), '[close_tag:p]$2[close_tag:div]');
   * ```
   */
  // So let use the simpler solution, change all <p> to <div>.
  tmp = tmp.replace(/\[open_tag:p:/g, "[open_tag:div:");
  tmp = tmp.replace(/\[close_tag:p\]/g, "[close_tag:div]");

  tmp = tmp.replace(/<[^>]+>/gm, "");
  tmp = tmp.replace(/\[open_tag\:([^\s]*?)\:(.*?)\]/gm, "<$1$2>");
  tmp = tmp.replace(/\[close_tag:([^\s]*?)\]/gm, "</$1>");

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
  .module("poddDashboardApp", [
    "ngResource",
    "ngAnimate",
    "ngCookies",
    "ngResource",
    // 'ngRoute',
    "ngSanitize",
    "ngTouch",
    "angularMoment",
    "ui.bootstrap",
    "angularFileUpload",
    // 'perfect_scrollbar',
    "bootstrapLightbox",
    "ui.router",
    "ui.grid",
    "ui.grid.selection",
    "ui.grid.exporter",
    "ui.grid.resizeColumns",
    "ui.grid.pinning",
    "daterangepicker",
    "ui.select",
    "angularChart",
    "angulartics",
    "angulartics.google.analytics",
    "angularLocalStorage",
    "ngTagsInput",
    "angular.filter",
    // 'sbDateSelect',
    "pickadate",
    "ngImgCrop",
  ])

  // override z-index of ui.bootstrap
  .run(function ($rootScope, shared, $templateCache) {
    $templateCache.put(
      "template/modal/backdrop.html",
      '<div class="modal-backdrop fade {{ backdropClass }}"\n' +
        '     ng-class="{in: animate}"\n' +
        "     ng-style=\"{'z-index': 10400 + (index && 1 || 0) + index*10}\"\n" +
        "></div>\n" +
        ""
    );

    $templateCache.put(
      "template/modal/window.html",
      '<div tabindex="-1" role="dialog" class="modal fade" ng-class="{in: animate}" ng-style="{\'z-index\': 10500 + index*10, display: \'block\'}" ng-click="close($event)">\n' +
        "    <div class=\"modal-dialog\" ng-class=\"{'modal-sm': size == 'sm', 'modal-lg': size == 'lg'}\"><div class=\"modal-content\" modal-transclude></div></div>\n" +
        "</div>"
    );

    $rootScope.shared = shared;
  })

  .config([
    "$resourceProvider",
    function ($resourceProvider) {
      // Don't strip trailing slashes from calculated URLs
      $resourceProvider.defaults.stripTrailingSlashes = false;
    },
  ])

  .config(function (cfpLoadingBarProvider, $animateProvider) {
    cfpLoadingBarProvider.includeSpinner = false;
    $animateProvider.classNameFilter(/\banimated\b/);
  })

  .factory("addTrailingSlashInterceptor", function ($q) {
    var apiUrls = [
      /\/api-token-auth/,
      /\/flags/,
      /\/reports/,
      /\/reportTypes/,
      /\/reportStates/,
      /\/reportAccomplishments/,
      /\/dashboard/,
      /\/aggregateReports/,
      /\/administrationArea/,
      /\/mentions/,
      /\/mentions\/seen/,
      /\/reportComments/,
      /\/users\/search/,
      /\/users\/domains/,
      /\/summary\/areas\/count-reports/,
      /\/summary\/areas\/show-detail/,
      /\/summary\/authorities\/show-detail/,
      /\/summary\/users\/inactive/,
      /\/summary\/users\/performance/,
      /\/summary\/reports/,
      /\/summary\/reports-visualization/,
      /\/summary\/dashboard-visualization/,
      /\/summary\/list-user/,
      /\/summary\/authority-dashboard/,
      /\/ping/,
      /\/tags\/list/,
      /\/users\/profile/,
      /\/authorities/,
      /\/reportTags/,
      /\/caseDefinitions/,
      /\/planReports/,
      /\/administrationArea\/contacts/,
      /\/administrationArea\/contacts\/update/,
      /\/notifications\/test/,
      /\/notificationAuthorities/,
      /\/users/,
      /\/analysis\/export/,
    ];

    function matchAPIUrls(url) {
      return apiUrls.some(function (item) {
        return url.match(item);
      });
    }

    return {
      request: function (config) {
        if (matchAPIUrls(config.url)) {
          if (config.url.slice(-1) !== "/") {
            config.url += "/";
          }
          config.responseType = config.responseType || "json";
        }

        return config || $q.when(config);
      },
    };
  })

  .filter("htmlToPlainText", function () {
    return function (text) {
      text = text.replace(/\n/g, "<br />");
      return htmlToPlainText(text);
    };
  })

  .factory("shared", function () {
    return {
      loggedIn: $.cookie("token") ? true : false,
      newReportQueue: {},
    };
  })

  .run(function ($location, Auth, $rootScope, PoddLog) {
    Auth.verify().catch(function () {
      var destinationStr = Auth.getLoginDestination($location);
      $location.url("/login");
      $location.search({ destination: destinationStr });
    });

    $rootScope.$on("$locationChangeSuccess", function (e) {
      PoddLog.dashboardView({ path: $location.url() });
    });
  })

  // .config(function ($routeProvider, $httpProvider, $stateProvider, $urlRouterProvider) {
  .config(function (
    $httpProvider,
    $stateProvider,
    $urlRouterProvider,
    $compileProvider
  ) {
    $compileProvider.debugInfoEnabled(false);
    $httpProvider.interceptors.push("addTrailingSlashInterceptor");

    $stateProvider
      .state("home", {
        url: "/home?reportId",
        templateUrl: "views/home.html",
        controller: "HomeCtrl",
        reloadOnSearch: false,
      })
      .state("home-local", {
        url: "/home-local?reportId",
        templateUrl: "views/home-local.html",
        controller: "HomeLocalCtrl",
      })
      .state("main", {
        url: "/map",
        templateUrl: "views/main.html",
        controller: "MainCtrl",
      })
      .state("main.report", {
        url: "^/reports/{reportId:int}?confirmCase",
        template: "",
        controller: "MainReportCtrl",
      })
      .state("main.filter", {
        url: "^/filter?q&reportId",
        template: "",
        controller: "FilterModeCtrl",
      })
      .state("analyticMap", {
        url: "/analytic-map",
        templateUrl: "views/analytic-map.html",
        controller: "AnalyticMapCtrl",
      })
      .state("scenario", {
        url: "/scenario?bottom&left&top&right&zoom&q",
        templateUrl: "views/scenario.html",
        controller: "ScenarioModeCtrl",
      })
      .state("plans", {
        url: "/plans",
        templateUrl: "views/plans.html",
        controller: "PlansModeCtrl",
      })
      .state("calendar", {
        url: "/calendar",
        templateUrl: "views/calendar.html",
        controller: "CalendarModeCtrl",
      })
      .state("contacts", {
        url: "/contacts?q&alphabet",
        templateUrl: "views/contacts.html",
        controller: "ContactsModeCtrl",
      })
      .state("main.summaryreportmonth", {
        url: "^/summary/report-month?dateStart&dateEnd&areaId&typeIds&tags",
        templateUrl: "views/summary-report-month.html",
        controller: "SummaryReportMonthModeCtrl",
      })
      .state("main.summaryresultmonthly", {
        url: "^/summary/monthly",
        templateUrl: "views/summary-result-monthly.html",
        controller: "SummaryResultMonthlyModeCtrl",
      })
      .state("main.summarynaimalrecords", {
        url: "^/summary/animal-records",
        templateUrl: "views/summary-animal-records.html",
        controller: "SummaryAnimalRecordsCtrl",
      })
      .state("main.summaryperformanceperson", {
        url: "^/summary/performance-person?month&areaId",
        templateUrl: "views/summary-performance-person.html",
        controller: "SummaryPerformancePersonModeCtrl",
      })
      .state("main.summaryvisualization", {
        url: "^/summary/visualize",
        templateUrl: "views/summary-visualization.html",
        controller: "SummaryVisualizationModeCtrl",
      })
      .state("main.summaryaggregatereportfilter", {
        url: "^/summary/data-report-filter/:id?name",
        templateUrl: "views/summary-aggregate-report-filter.html",
        controller: "SummaryAggregateReportFilterModeCtrl",
      })
      .state("main.profile", {
        url: "^/profile",
        templateUrl: "views/profile.html",
        controller: "ProfileModeCtrl",
      })
      .state("main.users", {
        url: "^/user-list",
        templateUrl: "views/user-list.html",
        controller: "UsersModeCtrl",
      })
      .state("main.invitationcode", {
        url: "^/invitation-code-list",
        templateUrl: "views/invitation-code-list.html",
        controller: "InvitationCodeModeCtrl",
      })
      .state("main.notificationconfig", {
        url: "^/notification-config-list",
        templateUrl: "views/notification-config-list.html",
        controller: "NotificationModeCtrl",
      })
      .state("main.casedefinitinos", {
        url: "^/case-definitions-list",
        templateUrl: "views/case-definitions-list.html",
        controller: "CaseDefinitionsModeCtrl",
      })
      .state("login", {
        url: "/login",
        templateUrl: "views/login.html",
        controller: "LoginCtrl",
      })
      .state("dashboard", {
        url: "/dashboard",
        templateUrl: "views/report-dashboard.html",
        controller: "DashboardCtrl",
      })
      .state("about", {
        url: "/about",
        templateUrl: "views/about.html",
        controller: "AboutCtrl",
      })
      .state("authority-dashboard", {
        url: "/authority-dashboard?dateStart&dateEnd&authorityId",
        templateUrl: "views/authority-dashboard.html",
        controller: "AuthorityDashboardModeCtrl",
      })
      .state("form-config", {
        url: "/form-config/:code",
        templateUrl: "views/form-config.html",
        controller: "FormConfigCtrl",
      })
      .state("success-story-link", {
        url: "/success-story-link",
        templateUrl: "views/success-story-link.html",
        controller: "FormConfigCtrl",
      })
      .state("ncd-report", {
        url: "/ncd-report",
        templateUrl: "views/ncd-report.html",
        controller: "NcdReportCtrl",
      })
      .state("authority-info", {
        url: "/authority-info",
        templateUrl: "views/authority-info.html",
        controller: "AuthorityInfoModeCtrl",
      });

    $urlRouterProvider.otherwise("/home");
  });
