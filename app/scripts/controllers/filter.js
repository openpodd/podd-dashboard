/* global utils */
'use strict';

angular.module('poddDashboardApp')

.controller('FilterModeCtrl', function (shared, Menu) {
    shared.filterMode = true;
    Menu.setActiveMenu('filter');
})

.controller('FilterCtrl', function ($scope, Search, shared, $window, dashboard,
                                    $state, $stateParams, $q, $timeout, streaming) {

    $scope.shared = shared;

    $scope.$on('filter:clearQuery', function (willClear) {
        if (willClear) {
            $scope.query = $stateParams.q || '';
            $scope.willShowResult = false;
            $scope.loading = false;
            $scope.empty = false;
            $scope.error = false;
            $scope.help = false;

            $scope.didSearch = false;
            shared.filterResults = [];
            shared.filteredReports = [];

            if ($scope.query) {
                $scope.doQueryOnParams($stateParams);
            }
        }
    });

    streaming.on('report:flag:new', function (data) {
      console.log('got new report flag in filter', data);

      data = angular.fromJson(data);

      // Loop through existing reports list and update data.
      if (shared.filteredReports) {
        shared.filteredReports.forEach(function (item) {
          if (item.id === parseInt(data.reportId)) {
            item.flag = data.priority;
            item.negative = data.reportNegative;
          }
        });
      }
    });

    $scope.search = function () {
        $state.go('main.filter', { q: $scope.query }, { location: true });
    };

    $scope._search = function () {
        console.log('Will search with query', $scope.query);

        // Mark as already did the search.
        $scope.didSearch = true;

        shared.filterQuery = $scope.query;

        $scope.closeHelp();

        if ($scope.loading) {
            return;
        }

        $scope.loading = true;
        $scope.empty = false;
        $scope.error = false;

        shared.filteredReports = [];
        // show result box.
        $scope.willShowResult = true;

        return Search.query({ q: $scope.query }).$promise.then(function (data) {
            console.log('Query result:', data);

            shared.filteredReports = data;

            // Do group by administrationAreaId
            var results = [],
                matchedVillages = {};

            var promise;
            if (utils.getObjectLength(shared.villages)) {
                promise = $q.when();
            }
            else {
                // Load administration area before next task.
                promise = dashboard.getAdministrationAreas().$promise;
            }

            promise.then(function (administrationAreas) {
                $scope.loading = false;

                if (administrationAreas) {
                    shared.villages = {};
                    administrationAreas.forEach(function (item) {
                        shared.villages[ item.id ] = item;
                        item.positive = 0;
                        item.positiveCases = [];
                        item.negative = 0;
                        item.negativeCases = [];
                    });
                }

                data.forEach(function (item) {
                    var village = shared.villages[ item.administrationAreaId ];

                    if ( ! matchedVillages[ village.id ] ) {
                        matchedVillages[ item.administrationAreaId ] = true;
                        results.push(village);
                    }

                    if (item.negative) {
                        village.negative += 1;
                        village.negativeCases.push({
                            id: item.id,
                            createdBy: item.createdByName,
                            date: item.date,
                            incidentDate: item.incidentDate,
                            eventTypeName: item.reportTypeName
                        });
                    }
                    else {
                        village.positive += 1;
                        village.positiveCases.push({
                            id: item.id,
                            createdBy: item.createdByName,
                            date: item.date,
                            incidentDate: item.incidentDate,
                            eventTypeName: item.reportTypeName
                        });
                    }
                });

                $scope.results = results;
                shared.filterResults = results;

                if (results.length === 0) {
                    $scope.empty = true;
                }
                else {
                    $scope.empty = false;
                    $scope.willShowResult = false;
                }
            });

        }).catch(function () {
            $scope.loading = false;

            $scope.error = true;
        });
    };

    $scope.triggerVillageClick = function (item) {
        $('#map').trigger('clicked:village', item);
    };

    $scope.closeResult = function () {
        $scope.willShowResult = false;
    };

    $scope.toggleHelp = function () {
        $scope.help = !$scope.help;
    };

    $scope.closeHelp = function () {
        $scope.help = false;
    };

    $scope.showTable = false;
    $scope.toggleTable = function () {
        $scope.showTable = !$scope.showTable;
        if ($scope.showTable) {
            shared.showReportList = false;

            $($window).trigger('forceResizeResultWrapper');
            $timeout(function () {
                $($window).trigger('forceResizeResultTable');
            }, 100);
        }
    };

    $scope.$watch('shared.showReportList', function (newValue) {
        if (newValue) {
            $scope.showTable = false;
        }
    });


    // do things about URL
    $scope.doQueryOnParams = function (params) {
        // do query only in main.filter mode.
        if ($state.current.name === 'main.filter') {
            $scope.query = $window.decodeURIComponent(params.q || '');
            if ($scope.query) {
                return $scope._search().then(function () {
                    if (params.reportId) {
                        // Need to force report view to open here. Normal
                        // behavior when filterResults changed is to close
                        // report list and report modal.
                        shared.forceReportViewOpen = true;
                        $scope.$parent.viewReport(params.reportId);
                    }
                });
            }
            else {
                shared.filterResults = [];
                shared.filteredReports = [];

                return $q.when();
            }
        }
    };
    $scope.doQueryOnParams($stateParams);
    // detect change on 'q' param changes.
    $scope.$on('$stateChangeSuccess', function (scope, current, params, old, oldParams) {
        // do query only in main.filter mode.
        if ($state.current.name === 'main.filter') {
            if (params.reportId && oldParams.q === params.q) {
                $scope.$parent.viewReport(params.reportId);
            }
            else if (oldParams.q !== params.q || current.name !== old.name) {
                $scope.doQueryOnParams(params);
            }
        }
    });

});
