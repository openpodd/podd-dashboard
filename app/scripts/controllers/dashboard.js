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

  var paint = dashboardGraph();

  function setDataFromCache(cached) {
    paint(cached.reportThisWeek);
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
    keywords: []
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
          loadGraphData();
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
    loadGraphData();
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
      keywords: [],
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

  function loadGraphData() {
    var params = {
      period: 'day',
      subscribe: shared.subscribe,
      lastWeek: true
    };

    SummaryReportVisualization.query(params).$promise.then(function (json) {
      paint(json);
    });
  }

  $scope.selectedTemplate = function (template) {
    $scope.selectedTemplateContact = template;
    $scope.newSelectedContact = template.contact.to;
  };

  $scope.onlyGraph = true;
  $scope.selected = 'day';

});

function dashboardGraph() {
  var colors = d3.scale.category20c();

  var $wrapper = angular.element('#mbars');

  var w = $wrapper.width();
  var h = $wrapper.height();
  var padding = {
    top: 40,
    right: 40,
    bottom: 80,
    left: 60
  };

  var widthRect = 50;

  var svg = d3.select('#mbars')
    .append('svg')
    .attr('width', w)
    .attr('height', h);

  svg.append('g')
    .attr('class','x axis')
    .attr('transform','translate(' + padding.left + ',' + (h - padding.bottom) + ')');

  svg.append('g')
    .attr('class','y axis')
    .attr('transform','translate(' + padding.left + ',' + padding.top + ')');

  svg.append('text')
    .attr('transform','rotate(-90)')
    .attr('y', padding.left - 56)
    .attr('x', 0-(h/2))
    .attr('dy','1em')
    .text('จำนวนรายงาน');

  var groups = svg.selectAll('g')
    .data([])
    .enter()
    .append('g')
    .attr('class','rgroups')
    .attr('transform','translate('+ padding.left + ',' + (h - padding.bottom) +')')
    .style('fill', '#ccc');

  var rects = groups.selectAll('rect')
    .data(function(d) {
      return d;
    })
    .enter()
    .append('rect')
    .attr('width', widthRect)
    .style('fill-opacity',1e-6);

  var stack = d3.layout.stack();

  var colorHash = {};

  function findById(dataset, id) {
    var data;
    dataset.forEach(function (item) {
      if (item.id === id) {
        data = item;
      }
    });
    return data;
  }

  function paint(dataset) {
    dataset.forEach(function (item, index) {
      colorHash[item.id] = colors(index);
      item.colorCode = colors(index);
    });

    var data = [];
    dataset.forEach(function (item) {
      // Find if exists in new dataset, need to do this cuz wanna maintain
      // bar color and animation.
      var matchedItem = findById(dataset, item.id);
      var tmp;
      if (matchedItem) {
        data.push(matchedItem.data);
      }
      else {
        tmp = [];
        item.data.forEach(function (_item) {
          tmp.push({
            y: 0,
            time: _item.time
          });
        });
        data.push(tmp);
      }
    });
    stack(data);

    var xMin = new Date(data[0][0].time);
    var xMax = new Date(data[0][data[0].length - 1].time);
    var xScale = d3.time.scale()
      .domain([xMin, xMax], 8)
      .rangeRound([0, w - padding.left - padding.right]);

    var yScale = d3.scale.linear()
      .domain([0,
        d3.max(data, function(d) {
          return d3.max(d, function(d) {
            return d.y0 + d.y;
          });
        })
      ])
      .range([h-padding.bottom - padding.top, 0]);

    var xAxisRange = d3.time.days;

    var xAxis = d3.svg.axis()
      .scale(xScale)
      .orient('bottom')
      .ticks(xAxisRange, 1);

    var yAxis = d3.svg.axis()
      .scale(yScale)
      .orient('left')
      .ticks(10);

    groups = svg.selectAll('.rgroups').data(data);
    groups.enter().append('g')
      .attr('class','rgroups')
      .attr('transform','translate('+ padding.left + ',' + (h - padding.bottom) +')')
      .style('fill',function(d, i){
        return colorHash[dataset[i].id];
      });

    rects = groups.selectAll('rect')
      .data(function (d) {
        return d;
      });

    rects.enter()
      .append('rect')
      .attr('x', w)
      .attr('width', widthRect)
      .style('fill-opacity', 1e-6);

    rects.transition()
      .duration(1000)
      .ease('linear')
      .attr('x', function(d) {
        return xScale(new Date(d.time));
      })
      .attr('y', function(d) {
        return -(- yScale(d.y0) - yScale(d.y) + (h - padding.top - padding.bottom)*2);
      })
      .attr('height', function(d) {
        return -yScale(d.y) + (h - padding.top - padding.bottom);
      })
      .attr('width', widthRect)
      .style('fill-opacity', 1);

    rects.exit()
      .transition()
      .duration(1000)
      .ease('circle')
      .attr('x', w)
      .remove();

    groups.exit()
      .transition()
      .duration(1000)
      .ease('circle')
      .attr('x',w)
      .remove();

    svg.select('.x.axis')
      .transition()
      .duration(1000)
      .ease('circle')
      .call(xAxis);

    svg.select('.y.axis')
      .transition()
      .duration(1000)
      .ease('circle')
      .call(yAxis);

    var legend = svg.append('g')
      .attr('class','legend')
      .attr('x', w - padding.right - 65)
      .attr('y', 25)
      .attr('height', 100)
      .attr('width',100);

    svg.selectAll('.x.axis text')
      .attr('style', 'text-anchor:end')
      .attr('transform', function(d) {
        var translateX = -this.getBBox().height;
        var translateY = 12;

        return 'translate(' + translateX + ',' + translateY + ') rotate(-90)';
      });
  }

  return paint;
}
