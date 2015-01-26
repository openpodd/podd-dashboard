/* global moment */
'use strict';

angular.module('poddDashboardApp')

.controller('VisualizationCtrl', function ($scope, Menu, dashboard, VisualizationData) {
    Menu.setActiveMenu('visualize');

    $scope.areas = {
        all: dashboard.getAdministrationAreas(),
        selected: null
    };

    $scope.data = {
        raw: null,
        error: false
    };

    $scope.refresh = function () {
        if (!$scope.areas.selected || $scope.data.loading) {
            return;
        }

        $scope.data.error = false;

        var dateStart = moment().format('DD/MM/YYYY'),
            dateEnd   = moment().subtract(3, 'months').format('DD/MM/YYYY'),
            dateQuery = dateStart + '-' + dateEnd,

            query = {
                dates: dateQuery,
                administrationAreaId: $scope.areas.selected.id
            };

        VisualizationData.query(query).$promise.then(function (data) {
            $scope.data.error = false;
            $scope.data.raw = data;
            // TODO: update chart components.
        }, function () {
            $scope.data.error = true;
        });
    };

    $scope.$watch('areas.selected', function (newValue) {
        if (newValue) {
            $scope.refresh();
        }
    });
});
