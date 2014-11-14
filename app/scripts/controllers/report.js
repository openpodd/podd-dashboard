'use strict';

angular.module('poddDashboardApp')

.controller('ReportViewCtrl', function ($scope) {
    $scope.$parent.$watch('report', function (newValue) {
        if (newValue) {
            $scope.activeImage = $scope.$parent.report.images[0];
        }
    });

    $scope.setActiveImage = function (image) {
        $scope.activeImage = image;
    };
});
