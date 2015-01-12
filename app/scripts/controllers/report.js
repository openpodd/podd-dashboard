/*global L, swal */
'use strict';

angular.module('poddDashboardApp')

.run(function ($templateCache, ReportType, shared, $q) {
    ReportType.query().$promise.then(function (reportTypes) {
        shared.reportTypeTemplateLoaded = false;

        var promises = [];

        reportTypes.forEach(function (item) {
            // Loop to get each templates.
            var promise = ReportType.get({ id: item.id }).$promise.then(function (reportType) {
                $templateCache.put('reportType-' + item.id + '.html', reportType.template);
                shared['reportTypeTemplateLoadedReportType' + item.id] = true;
            });
            promises.push(promise);
        });

        $q.all(promises).then(function () {
            shared.reportTypeTemplateLoaded = true;
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

    // Make flag as object here to prevent child scope to create new variable
    // due to ng-if, ng-repeat, ng-switch.
    // @see: http://stackoverflow.com/a/19410602/163216
    $scope.flag = {
        old: undefined,
        current: {}
    };

    // TODO: get these configurations from server
    $scope.flagOptions = [
        { color: 'Ignore',   priority: 1 },
        { color: 'OK',       priority: 2 },
        { color: 'Contact',  priority: 3 },
        { color: 'Follow',   priority: 4 },
        { color: 'Case',     priority: 5 }
    ];

    function refreshFlag() {
        var query = {
            reportId: $scope.report.id,
            amount: 1
        };

        Flags.list(query).$promise.then(function (flags) {
            if (flags.length) {
                $scope.flag.current = $scope.flagOptions[ flags[0].priority - 1 ];
            }
            else {
                $scope.flag.current = null;
            }
        });
    }

    $scope.$watch('flag.current', function (newValue, oldValue) {
        $scope.flag.old = oldValue;
    });

    $scope.updateFlag = function(flag) {
        var data = {
            reportId: $scope.report.id,
            priority: flag.priority,
        };

        var flagToConfirm = [ 'Ignore', 'Case' ];

        // Wait for confirm before update flag.
        if ( flagToConfirm.indexOf(flag.color) !== -1 ) {
            swal({
                title: '',
                type: 'warning',
                text: 'โปรดยืนยัน หากคุณต้องการเปลี่ยนค่าระดับความสำคัญใหม่',
                confirmButtonText: 'ตกลง',
                confirmButtonClass: 'btn-danger',
                showCancelButton: true,
                cancelButtonText: 'ยกเลิก'
            },
            function (isConfirm) {
                if (isConfirm) {
                    Flags.post(data);
                }
                else {
                    // reset if not confirm.
                    $scope.flag.current = $scope.flag.old;
                }
            });
        }
        else {
            Flags.post(data);
        }

    };

})

.controller('ReportImageLightboxCtrl', function ($scope, Map) {
    // Init map.
    var center = [13.791177699, 100.58814079],
        zoomLevel = 15,
        map = false;

    L.AwesomeMarkers.Icon.prototype.options.prefix = 'fa';
    var iconRed = L.AwesomeMarkers.icon({
        icon: 'medkit',
        markerColor: 'red'
    });

    $scope.unshowMap = function () {
      $scope.showMap = false;
    };

    $scope.toggleImageMapView = function (location) {
        $scope.showMap = !$scope.showMap;

        var newCenter = [ location.latitude, location.longitude ];

        if (!map) {
            map = new Map( L.map('image-position-map').setView(center, zoomLevel) );
        }
        if ($scope.showMap && location) {
            map.leaflet.setView(newCenter);

            L.marker(newCenter, {
                icon: iconRed
            }).addTo( map.leaflet );

            map.leaflet.invalidateSize();
        }
    };
});
