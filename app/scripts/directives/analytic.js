'use strict';

function layerController($scope) {
    $scope.submit = function () {
        if ($scope.onSave) {
            $scope.onSave({$layer: $scope.layer});
        }
    };

    $scope.removeLayer = function () {
        $scope.onRemove({$layer: $scope.layer});
    }
}

angular.module('poddDashboardApp')
    .directive('analyticMapLayerFormGeoJson', function () {
        return {
            strict: 'A',
            scope: {
                layer: '=',
                onSave: '&',
                onRemove: '&'
            },
            templateUrl: 'views/analytics/geojson.html',
            controller: layerController
        }
    })

    .directive('analyticMapLayerFormReport', function () {
        return {
            strict: 'A',
            scope: {
                layer: '=',
                onSave: '&',
                onRemove: '&'
            },
            templateUrl: 'views/analytics/report.html',
            controller: layerController
        }
    })

;
