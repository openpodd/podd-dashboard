'use strict';

angular.module('poddDashboardApp')

/**
 * Show list of recent reports.
 */
.controller('HomeCtrl', function ($scope, Search, ReportTypes, ReportState) {
  var queryBuilder = (function queryBuilder() {
    var defaultOperator = ' AND ';
    var defaultQuery = 'negative:true';
    var queries = [];
    var conditionsMap = {};

    var instance = {
      and: function add(filterName, filterValue) {
        queries.push(filterName + ':' + filterValue);
        conditionsMap[filterName] = queries.length - 1;
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

  function concat(a, b) {
    b.forEach(function (item) {
      a.push(item);
    });
  }

  function loadReportTypes() {
    $scope.reportTypeStates = {};
    $scope.reportTypes.all = ReportTypes.query();
  }

  function loadReportTypeStates(reportTypeId) {
    var q = {
      reportType: reportTypeId
    };
    $scope.reportTypeStates.all = ReportState.query(q);
  }

  $scope.reportTypeChange = function reportTypeChange($selected) {
    var formState = $scope.reportTypes;
    if (formState.current !== formState.previous) {
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
    query.q = queryBuilder.getQuery();
    load(query, true);
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
    load(query);
  };

  $scope.lastPage = false;
  loadReportTypes();
  load(query, true);
});
