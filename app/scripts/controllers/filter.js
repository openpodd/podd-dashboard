'use strict';

angular.module('poddDashboardApp')

.controller('FilterCtrl', function ($scope, Search, shared) {

    $scope.$on('filter:clearQuery', function (willClear) {
        if (willClear) {
            $scope.query = '';
        }
    });

    $scope.$watch('query', function (newValue) {
        shared.filterQuery = newValue;
    });

    $scope.search = function () {
        console.log('Will search with query', $scope.query);

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

        Search.query({ q: $scope.query }).$promise.then(function (data) {
            console.log('Query result:', data);

            $scope.loading = false;

            // Do group by administrationAreaId
            var results = [],
                matchedVillages = {};

            data.forEach(function (item) {
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

});
