'use strict';

angular.module('poddDashboardApp')

/**
 * Show list of recent reports.
 */
.controller('HomeCtrl', function ($scope, Search) {
  var query = {
    'q': 'negative:true',
    'page_size': 20,
    'tz': (new Date()).getTimezoneOffset() / -60
  };

  $scope.page = 1;
  $scope.totalPage = 1;
  $scope.reports = [];

  function concat(a, b) {
    b.forEach(function (item) {
      a.push(item);
    });
  }

  function load(query) {
    if ($scope.loading) { return; }
    $scope.loading = true;

    query.page = $scope.page;
    Search.query(query).$promise
      .then(function (resp) {
        $scope.page++;
        $scope.totalPage = parseInt(resp.count / query.page_size);
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
  load(query);
});
