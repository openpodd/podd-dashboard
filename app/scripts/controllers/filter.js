'use strict';

angular.module('poddDashboardApp')

.controller('FilterCtrl', function ($scope, Search) {
    $scope.search = function () {
        console.log('Will search with query', $scope.query);

        Search.query({ q: $scope.query }).$promise.then(function (data) {
            console.log('Query result:', data);

            // Do group by administrationAreaId
            var results = [];
            data.forEach(function (item) {
                // TODO: will come back after pull code
            });
        });
    };
});
