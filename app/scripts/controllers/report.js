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

.config(function (LightboxProvider) {
    // set a custom template
    LightboxProvider.templateUrl = '/views/lightbox.html';

    LightboxProvider.getImageUrl = function (image) {
        return image.imageUrl;
    };

    LightboxProvider.getImageCaption = function (image) {
        return image.note;
    };
})

.controller('ReportViewCtrl', function ($scope, streaming, Flags, Lightbox) {

    $scope.userAlreadyClickImage = false;
    $scope.reportFlag = {};

    $scope.$parent.$watch('report', function (newValue) {
        if (newValue) {
            $scope.userAlreadyClickImage = false;

            // if ( $scope.$parent.report.images.length ) {
            //     $scope.activeImage = $scope.$parent.report.images[0];
            // }
            // else {
            //     $scope.activeImage = null;
            // }
            $scope.activeImage = null;

            refreshFlag();

            $scope.$broadcast('rebuildScrollbar:reportView');
        }
    });

    $scope.clickThumbnail = function (image) {
        $scope.userAlreadyClickImage = true;
        $scope.viewReportImage(image);
    };

    $scope.setActiveImage = function (image) {
        $scope.activeImage = image;
    };

    $scope.isActiveImage = function (image) {
        return $scope.activeImage === image;
    };

    $scope.viewReportImage = function (image) {
        var index = 0,
            images = $scope.$parent.report.images;

        images.some(function (item, i) {
            if (item === image) {
                index = i;
                return true;
            }
        });

        Lightbox.openModal($scope.$parent.report.images, index);
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

    // Report flag.

    $scope.flagOptions = [
        { color: 'Priority 1', priority: 1 },
        { color: 'Priority 2', priority: 2 },
        { color: 'Priority 3', priority: 3 },
        { color: 'Priority 4', priority: 4 },
        { color: 'Priority 5', priority: 5 }
    ];

    function refreshFlag() {
        var query = {
            reportId: $scope.report.id,
            amount: 1
        };

        Flags.list(query).$promise.then(function (flags) {
            if (flags.length) {
                $scope.reportFlag = $scope.flagOptions[ flags[0].priority - 1 ];
            }
            else {
                $scope.reportFlag = null;
            }
        });
    }

    $scope.updateFlag = function(flag) {
        var data = {
            reportId: $scope.report.id,
            priority: flag.priority,
        };
        Flags.post(data);
    };

});
