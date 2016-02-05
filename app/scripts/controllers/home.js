'use strict';

angular.module('poddDashboardApp')

/**
 * Show list of recent reports.
 */
.controller('HomeCtrl', function ($scope, Search, ReportTypes, ReportState,
                                  dashboard, Authority, moment) {
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
      var nonSelect = new Authority({
        id: 0,
        name: '-',
        code: '',
        _order: -10
      });
      // assign children, to find only leaf authority.
      var childCount = {};
      var parent = null;
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
    if (!dateTo) {
      dateTo = '*';
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
            item.timePeriod = item.date;
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
      .finally(function () {
        $scope.loading = false;
      });
  }

  $scope.loadMore = function loadMore() {
    _load(queryBuilder);

  };

  $scope.lastPage = false;
  loadReportTypes();
  loadAuthorities();
  _load(queryBuilder, true);
});
