'use strict';

angular.module('poddDashboardApp')

/**
 * Show list of recent reports.
 */
.controller('HomeCtrl', function ($scope, Search, ReportTypes, ReportState,
                                  dashboard, Authority) {
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
    all: []
  };
  $scope.authorities = {
    all: [],
    current: null
  };

  function concat(a, b) {
    b.forEach(function (item) {
      a.push(item);
    });
    return a;
  }

  function loadReportTypes() {
    $scope.reportTypeStates = {};
    ReportTypes.query().$promise.then(function (resp) {
      var nonSelect = new ReportTypes({
        id: 0,
        name: '-',
        code: ''
      });
      $scope.reportTypes.all = concat([nonSelect], resp);
      $scope.reportTypes.current = nonSelect;
    });
  }

  function loadReportTypeStates(reportTypeId) {
    var q = {
      reportType: reportTypeId
    };
    $scope.reportTypeStates.all = ReportState.query(q);
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

      $scope.authorities.all = concat([nonSelect], filteredResp);
      $scope.authorities.current = nonSelect;
    });
  }

  $scope.reportTypeChange = function reportTypeChange($selected) {
    var formState = $scope.reportTypes;
    if (!$selected.id) {
      queryBuilder.reset();
      $scope.reportTypeStates = {};
    }
    else if (formState.current !== formState.previous) {
      formState.previous = formState.current;
      queryBuilder.reset().and('typeName', '"' + $selected.name + '"');
      loadReportTypeStates($selected.id);
    }
  };

  $scope.toggleStateCheck = function toggleStateCheck(state) {
    state.checked = !state.checked;
    // update query.
    var checkedItems = [];
    $scope.reportTypeStates.all.forEach(function (item) {
      if (item.checked) {
        checkedItems.push('"' + item.code + '"');
      }
    });

    if (checkedItems.length) {
      queryBuilder.update('stateCode', '(' + checkedItems.join(' OR ') + ')');
    }
    else {
      queryBuilder.delete('stateCode');
    }
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
    if ($scope.authorities.current) {
      return $scope.authorities.current.id || '';
    }
    else {
      return '';
    }
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
