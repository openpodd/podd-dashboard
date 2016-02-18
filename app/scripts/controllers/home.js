/*globals swal*/
'use strict';

angular.module('poddDashboardApp')

/**
 * Show list of recent reports.
 */
.controller('HomeCtrl', function ($scope, Search, ReportTypes, ReportState,
                                  dashboard, Authority, moment, ReportModal,
                                  shared, Reports, $state, $stateParams, $timeout,
                                  Menu) {
  console.log('-> In HomeCtrl');

  Menu.setActiveMenu('home');

  // Load report if given at request.
  $timeout(function () {
    if ($stateParams.reportId) {
      $scope.viewReport($stateParams.reportId);
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
        if (index) {
          queries[index] = filterName + ':' + filterValue;
        }
        else {
          instance.and(filterName, filterValue);
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
        return instance;
      },
      getQuery: function getQuery() {
        return queries.filter(function (item) {
          return item;
        }).join(defaultOperator);
      }
    };

    queries.push(defaultQuery);
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
    dashboard.getAuthorities().$promise.then(function (resp) {
      // assign children, to find only leaf authority.
      var childCount = {};
      $scope.authorities.all.forEach(function (item) {
        var count = childCount[item.parentName] || 0;
        if (item.parentName) {
          count++;
        }
        childCount[item.parentName] = count;
      });
      // re-assign property value.
      var filteredResp = resp.filter(function (item) {
        return !childCount[item.name];
      });

      $scope.authorities.all = filteredResp;
    });
  }

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
            checkedItems.push('"' + state.code + '"');
          }
        });
      }
    });

    if (checkedItems.length) {
      queryBuilder.update('stateCode', '(' + checkedItems.join(' OR ') + ')');
    }
    else {
      queryBuilder.delete('stateCode');
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
    var dateFrom = $scope.dateFrom;
    var dateTo = $scope.dateTo;

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

  function _load(queryBuilder, needReset) {
    queryBuilder.update('date', buildDateQuery());
    query.q = queryBuilder.getQuery();
    query.authorities = buildAuthorityQuery();
    load(query, needReset);
  }

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

          if ($date > $thisWeek) {
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

          item.timePeriod = item.timePeriod.toDate();
          item.timestamp = item.timePeriod.getTime();
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
    $state.go('home', { reportId: reportId }, { notify: false });
    $scope.viewReport(reportId);
  };

  $scope.closeReportView = function () {
    shared.reportWatchId = '';
    $state.go('home', { reportId: null }, { notify: false });
    ReportModal.close();
  };

  $scope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
    if (toState.name !== 'home') { return; }

    event.preventDefault();

    if (toParams.reportId && toParams.reportId !== fromParams.reportId) {
      $scope.onClickReport(toParams.reportId);
    }
    else {
      $scope.closeReportView();
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
        ReportModal.close();
        $scope.gotoMainPage();
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
});
