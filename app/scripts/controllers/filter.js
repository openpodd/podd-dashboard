'use strict';

angular.module('poddDashboardApp')

.controller('FilterCtrl', function ($scope, Search, shared) {

    $scope.search = function () {
        console.log('Will search with query', $scope.query);

        if ($scope.loading) {
            return;
        }

        $scope.loading = true;
        // show result box.
        $scope.willShowResult = true;

        Search.query({ q: $scope.query }).$promise.then(function (data) {
            console.log('Query result:', data);

            $scope.loading = false;

            // Do group by administrationAreaId
            var results = [],
                matchedVillages = {};

            data.forEach(function (item) {
                if ( ! matchedVillages[ item.administrationAreaId ] ) {
                    matchedVillages[ item.administrationAreaId ] = true;
                    results.push(shared.villages[ item.administrationAreaId ]);
                }
            });

            $scope.results = results;

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

});
