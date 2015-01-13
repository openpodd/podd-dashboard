'use strict';

angular.module('poddDashboardApp')

.controller('FilterModeCtrl', function (shared, Menu) {
    shared.filterMode = true;
    Menu.setActiveMenu('filter');
})

.controller('FilterCtrl', function ($scope, Search, shared, $window,
                                    $state, $stateParams, $q, $timeout) {

    $scope.$on('filter:clearQuery', function (willClear) {
        if (willClear) {
            $scope.query = $stateParams.q || '';
            $scope.willShowResult = false;
            $scope.loading = false;
            $scope.empty = false;
            $scope.error = false;
            $scope.help = false;

            if ($scope.query) {
                $scope.doQueryOnParams($stateParams);
            }
        }
    });

    $scope.search = function () {
        $state.go('main.filter', { q: $scope.query }, { location: true });
    };

    $scope._search = function () {
        console.log('Will search with query', $scope.query);

        shared.filterQuery = $scope.query;

        $scope.closeHelp();

        if ($scope.loading) {
            return;
        }

        $scope.loading = true;
        $scope.empty = false;
        $scope.error = false;

        shared.filteredReports = {};
        // show result box.
        $scope.willShowResult = true;

        return Search.query({ q: $scope.query }).$promise.then(function (data) {
            console.log('Query result:', data);

            $scope.loading = false;

            // Do group by administrationAreaId
            var results = [],
                matchedVillages = {};

            data.forEach(function (item) {
                // TODO: get rid of dependencies with dashboard data.
                var village = shared.villages[ item.administrationAreaId ];

                // Append in filtered reports list
                shared.filteredReports[item.id] = item;

                if ( ! matchedVillages[ village.id ] ) {
                    matchedVillages[ item.administrationAreaId ] = true;
                    results.push(village);
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
                return $q.resolve();
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
            else if (oldParams.q !== params.q) {
                $scope.doQueryOnParams(params);
            }
        }
    });

});
