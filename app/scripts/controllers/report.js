'use strict';

angular.module('poddDashboardApp')

.run(function ($templateCache, ReportType) {
    ReportType.query().$promise.then(function (reportTypes) {
        reportTypes.forEach(function (item) {
            // Loop to get each templates.
            ReportType.get({ id: item.id }).$promise.then(function (reportType) {
                $templateCache.put('reportType-' + item.id + '.html', reportType.template);
            });
        });
    });
})

.controller('ReportViewCtrl', function ($scope, streaming, ReportModal) {

    $scope.userAlreadyClickImage = false;

    $scope.$parent.$watch('report', function (newValue) {
        if (newValue) {
            $scope.userAlreadyClickImage = false;

            if ( $scope.$parent.report.images.length ) {
                $scope.activeImage = $scope.$parent.report.images[0];
            }
            else {
                $scope.activeImage = null;
            }
        }
    });

    $scope.clickThumbnail = function (image) {
        $scope.userAlreadyClickImage = true;
        $scope.setActiveImage(image);
    };

    $scope.setActiveImage = function (image) {
        $scope.activeImage = image;
    };

    $scope.isActiveImage = function (image) {
        return $scope.activeImage == image;
    };

    streaming.on('report:image:new', function (data) {
        console.log('got new report image', data);

        data = angular.fromJson(data);

        if ($scope.$parent.report && data.report === $scope.$parent.report.id) {
            $scope.$parent.report.images.splice(0, 0, data);

            // set as active image if this is the first one, or user has not
            // intentionally click the thumbnail to view image. This will show
            // new image as streaming.
            if ( !$scope.userAlreadyClickImage ||
                 $scope.$parent.report.images.length === 1 ) {

                $scope.setActiveImage(data);

            }
        }
    });

    // Quick fix, don't know why modal keyup doesn't work. Ment.io is the first
    // priority suspect.
    $(document).on('keyup', function (event) {
        event.which == 27 && ReportModal.close();
    });


});
