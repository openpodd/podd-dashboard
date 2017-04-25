/*globals swal*/
'use strict';

angular.module('poddDashboardApp')

/**
 * Show list of recent reports.
 */
.controller('HomeCtrl', function ($scope, Search, ReportTypes, ReportState,
                                  dashboard, Authority, moment, ReportModal,
                                  shared, Reports, $state, $stateParams, $timeout,
                                  Menu, Auth, AdministrationArea, $location) {
  console.log('-> In HomeCtrl');

  Menu.setActiveMenu('home');
  Auth.requireLogin($scope);

  // Load report if given at request.
  $timeout(function () {
    var reportId = $stateParams.reportId;
    if (reportId) {
      if (!angular.isString(reportId)) {
        $location.search('reportId', null);
      }
      else {
        $scope.viewReport($stateParams.reportId);
      }
    }
    else {
      ReportModal.close();
    }
  });

  var queryBuilder = (function queryBuilder() {
    var defaultOperator = ' AND ';
    var defaultQuery = 'negative:true';
    var queries = [];
    var conditionsMap = {};

    var instance = {
      and: function and(filterName, filterValue) {
        if (filterValue) {
          queries.push(filterName + ':' + filterValue);
          conditionsMap[filterName] = queries.length - 1;
        }
        return instance;
      },
      update: function update(filterName, filterValue) {
        var index = conditionsMap[filterName];
        if (!filterValue) {
          instance.delete(filterName);
          return;
        }
        if (!angular.isUndefined(index)) {
          queries[index] = filterName + ':' + filterValue;
        }
        else {
          instance.and(filterName, filterValue);
        }
        return instance;
      },
      addGroup: function addGroup(groupName, groupValue) {
        if (groupName) {
          queries.push('(' + groupValue + ')');
          conditionsMap[groupName] = queries.length - 1;
        }
        return instance;
      },
      updateGroup: function updateGroup(groupName, groupValue) {
        var index = conditionsMap[groupName];
        if (!groupValue) {
          instance.delete(groupValue);
          return;
        }
        if (!angular.isUndefined(index)) {
          queries[index] = '(' + groupValue + ')';
        }
        else {
          instance.addGroup(groupName, groupValue);
        }
        return instance;
      },
      delete: function _delete(filterName) {
        var index = conditionsMap[filterName];
        delete queries[index];
      },
      reset: function reset() {
        queries = [];
        queries.push(defaultQuery);
        conditionsMap.negative = 0;
        return instance;
      },
      get: function get(filterName) {
        var index = conditionsMap[filterName];
        return queries[index];
      },
      getQuery: function getQuery() {
        return queries.filter(function (item) {
          return item;
        }).join(defaultOperator);
      }
    };

    instance.reset();
    return instance;
  })();

  var query = {
    'q': queryBuilder.getQuery(),
    'page_size': 20,
    'tz': (new Date()).getTimezoneOffset() / -60
  };

  function reset() {
    $scope.page = 1;
    $scope.totalPage = 1;
    $scope.lastPage = null;
    $scope.reports = [];
  }

  $scope.reportTypes = {
    all: [],
    current: null,
    previous: null
  };
  $scope.reportTypeStates = {
    all: {}
  };
  $scope.authorities = {
    all: [],
    current: null,
    selected: []
  };
  $scope.areas = {
    all: [],
    current: null,
    selected: []
  };
  $scope.dateRange = {
    from: null,
    to: null
  };
  $scope.settings = {};

  function concat(a, b) {
    b.forEach(function (item) {
      a.push(item);
    });
    return a;
  }

  function loadReportTypes() {
    ReportTypes.query().$promise.then(function (resp) {
      $scope.reportTypes.all = resp;
    });
  }

  function loadReportTypeStates(reportTypeId) {
    var q = {
      reportType: reportTypeId
    };
    $scope.reportTypeStates.all[reportTypeId] = ReportState.query(q);
  }

  function loadAuthorities() {
    $scope.authorities.all = dashboard.getAuthorities();
  }

  function loadAreas(keywords) {
    var query = {
      keywords: keywords,
      page_size: 20
    };
    AdministrationArea.contacts(query).$promise.then(function (resp) {
      $scope.areas.all = resp.results;
      $scope.areas.all.forEach(function (item) {
        item.shortAddress = item.address.replace(item.name, '');
      });
    });
  }
  $scope.areas.loadAreas = loadAreas;

  $scope.toggleReportTypeCheck = function toggleReportTypeCheck(reportType) {
    reportType.checked = !reportType.checked;
    loadReportTypeStates(reportType.id);
    // update query.
    var checkedItems = [];
    $scope.reportTypes.all.forEach(function (item) {
      if (item.checked) {
        checkedItems.push('"' + item.name + '"');
      }
    });

    if (checkedItems.length) {
      queryBuilder.update('typeName', '(' + checkedItems.join(' OR ') + ')');
    }
    else {
      queryBuilder.delete('typeName');
    }
    rebuildStateQuery();
  };

  function rebuildStateQuery() {
    var checkedItems = [];
    $scope.reportTypes.all.forEach(function (reportType) {
      if (reportType.checked) {
        $scope.reportTypeStates.all[reportType.id].forEach(function (state) {
          if (state.checked) {
            checkedItems.push('"' + state.id + '"');
          }
        });
      }
    });

    if (checkedItems.length) {
      queryBuilder.update('state', '(' + checkedItems.join(' OR ') + ')');
    }
    else {
      queryBuilder.delete('state');
    }
  }

  $scope.toggleStateCheck = function toggleStateCheck(state) {
    state.checked = !state.checked;
    // update query.
    rebuildStateQuery();
  };

  $scope.submit = function submit(event) {
    event.preventDefault();
    _load(queryBuilder, true);
  };

  function buildDateQuery() {
    var dateFrom = $scope.dateRange.from;
    var dateTo = $scope.dateRange.to;

    if (!dateFrom) {
      dateFrom = '*';
    }
    else {
      dateFrom = moment(dateFrom).format('YYYY-MM-DD');
    }
    if (!dateTo) {
      dateTo = '*';
    }
    else {
      dateTo = moment(dateTo).format('YYYY-MM-DD');
    }

    if (dateFrom === '*' && dateTo === '*') {
      return '';
    }

    return '[' + dateFrom + ' TO ' + dateTo + ']';
  }

  function buildAuthorityQuery() {
    var selectedAuthorities = [];
    $scope.authorities.selected.forEach(function (item) {
      selectedAuthorities.push(item.id);
    });

    return selectedAuthorities.join(',');
  }

  function buildAreaQuery() {
    var selectedAreas = [];
    $scope.areas.selected.forEach(function (item) {
      selectedAreas.push(item.id);
    });

    if (selectedAreas.length) {
      return selectedAreas.join(',');
    }
    else {
      return '';
    }
  }

  function updateFilterSettings(queryBuilder) {
    // test flag
    if ($scope.settings.includeTestFlag) {
      queryBuilder.updateGroup('testFlag', 'negative:true OR testFlag:true');
      queryBuilder.delete('negative');
    }
    else {
      queryBuilder.update('negative', true);
    }
  }

  function _load(queryBuilder, needReset) {
    queryBuilder.update('date', buildDateQuery());
    // queryBuilder.update('administrationArea', buildAreaQuery());

    // other settings.
    updateFilterSettings(queryBuilder);

    query.q = queryBuilder.getQuery();
    query.authorities = buildAuthorityQuery();
    query.administrationAreas = buildAreaQuery();

    load(query, needReset);
  }

  $scope.firstDayOfYear = moment().startOf('year').toDate();
  function load(query, needReset) {
    if ($scope.loading) { return; }
    $scope.loading = true;
    $scope.error = false;

    if (needReset) {
      reset();
    }

    query.page = $scope.page;
    Search.query(query).$promise
      .then(function (resp) {
        $scope.page++;
        $scope.totalPage = Math.ceil(resp.count / query.page_size);
        $scope.lastPage = !resp.next;

        // assign relative time to make a group.
        resp.results.forEach(function (item) {
          var $now = moment();
          var $thisWeek = moment($now).startOf('week');
          var $lastWeek = moment($thisWeek).subtract(1, 'week');
          var $last2Week = moment($thisWeek).subtract(2, 'week');
          var $last3Week = moment($thisWeek).subtract(3, 'week');
          var $last4Week = moment($thisWeek).subtract(4, 'week');
          var $date = moment(item.date);

          if ($date >= $thisWeek) {
            item.timePeriod = moment(item.date);
          }
          // TODO: adjust to more readable relative date.
          else if ($thisWeek > $date && $date > $lastWeek) {
            // item.timePeriod = $lastWeek;
            item.timePeriod = moment(item.date).startOf('day');
          }
          else if ($lastWeek > $date && $date > $last2Week) {
            // item.timePeriod = $last2Week;
            item.timePeriod = moment(item.date).startOf('day');
          }
          else if ($last2Week > $date && $date > $last3Week) {
            // item.timePeriod = $last3Week;
            item.timePeriod = moment(item.date).startOf('day');
          }
          else if ($last3Week > $date && $date > $last4Week) {
            item.timePeriod = $last4Week;
          }
          else if ($last4Week > $date){
            item.timePeriod = moment(item.date).subtract(1, 'week').startOf('month');
          }

          // item.timePeriod = item.timePeriod.toDate();
          // item.timestamp = item.timePeriod.getTime();
          item.isThisYear = $date.toDate() >= $scope.firstDayOfYear;
        });

        concat($scope.reports, resp.results);
      })
      .catch(function () {
        $scope.error = true;
      })
      .finally(function () {
        $scope.loading = false;
      });
  }

  $scope.loadMore = function loadMore() {
    _load(queryBuilder);
  };

  $scope.isReportTypeListCompact = true;
  $scope.reportTypeListLimit = 10;
  $scope.toggleReportTypeListCompact = function toggleReportTypeListCompact() {
    $scope.isReportTypeListCompact = !$scope.isReportTypeListCompact;
    if ($scope.isReportTypeListCompact) {
      $scope.reportTypeListLimit = 10;
    }
    else {
      $scope.reportTypeListLimit = $scope.reportTypes.all.length;
    }
  };

  $scope.activeReportId = null;
  $scope.resultMode = 'table';
  $scope.lastPage = false;
  $scope.error = false;
  $scope.isEmpty = function () {
    return $scope.reports.length === 0 && !$scope.loading && !$scope.error;
  };
  loadReportTypes();
  loadAuthorities();
  _load(queryBuilder, true);

  $scope.onClickReport = function (reportId) {
    $location.search('reportId', reportId);
  };

  $scope.closeReportView = function () {
    $location.search('reportId', null);
  };

  $scope.$on('$locationChangeSuccess', function (event) {
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
      shared.reportWatchId = null;
      ReportModal.close();
    }
  });

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
});
