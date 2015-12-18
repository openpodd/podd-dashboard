/* globals swal:false, L */
'use strict';

angular.module('poddDashboardApp')

.directive('jumpToFilter', function ($compile) {
    var supportedFields = [ 'animalType', 'createdByName', 'area' ],
        defaultTimeCriteria = 'date:last 7 days';

    return {
        strict: 'EA',
        scope: {
            name: '=',
            value: '=',
            wrapWithQuote: '='
        },
        compile: function compile() {
            return function (scope, $element) {
                function render() {
                    var q = '';

                    if ( supportedFields.indexOf(scope.name) !== -1) {
                        // add time criteria
                        q += defaultTimeCriteria;
                        // add field criteria
                        if (scope.wrapWithQuote) {
                            q += ' AND ' + scope.name + ':"' + scope.value + '"';
                        }
                        else {
                            q += ' AND ' + scope.name + ':' + scope.value;
                        }

                        scope.q = q;

                        $element.html('<a ng-href="#/filter?q={{ q|encodeURI }}">{{ value }}</a>');
                        $compile($element.contents())(scope);
                    }
                    else {
                        // render plain value if not supported.
                        $element.html('{{ value }}');
                        $compile($element.contents())(scope);
                    }
                }

                render();

                scope.$watch('value', function () {
                    render();
                });
            };
        }
    };
})

.directive('reportFollowUp', function (Reports) {
    function refresh(scope) {
        scope.reportFollowUpParent = null;

        if (scope.report) {
            Reports.followUp({ reportId: scope.report.id }).$promise.then(function (data) {
                if (data.length) {
                    scope.report.$hasFollowUp = true;
                    scope.report.followUpReports = data;
                    if (scope.report.parent) {
                        scope.report.followUpReportsCount = 1;
                    }
                    else {
                        scope.report.followUpReportsCount = scope.report.followUpReports.length;
                    }
                }
                scope.items = data;

                data.forEach(function (item) {
                    if (item.id === scope.report.parent) {
                        scope.reportFollowUpParent = item;
                    }
                });
            });
        }
    }

    return {
        strict: 'EA',
        scope: {
            report: '='
        },
        templateUrl: 'views/report-followup.html',
        controller: function ($scope, shared) {
            $scope.onClickReportFollowUp = function (report) {
                shared.reportWatchId = report.id;
            };
        },
        link: function (scope) {
            refresh(scope);

            scope.$watch('report', function (newValue) {
                refresh(newValue);
            });

            scope.$on('report:updateFollowUp', function (event, reportId) {
                if (reportId === scope.report.id) {
                    refresh(scope);
                }
            });
        }
    };
})

.filter('administrationAreaName', function (shared) {
    return function (administrationAreaId) {
        if (shared.villages[ administrationAreaId ]) {
            return shared.villages[ administrationAreaId ].name;
        }
        else {
            return '';
        }
    };
})

.filter('administrationAreaAddress', function (shared) {
    return function (administrationAreaId) {
        if (shared.villages[ administrationAreaId ]) {
            return shared.villages[ administrationAreaId ].address;
        }
        else {
            return '';
        }
    };
})

.directive('reportView', function () {
    return {
        strict: 'A',
        link: function () {
            // NOTE: see ReportService.js in factory ReportModal.
        }
    };
})

.directive('reportStateForm', function ($http, $modal, Reports, ReportState) {
    return {
        strict: 'A',
        require: '^reportView',
        templateUrl: 'views/report-state-form.html',
        scope: {
            report: '='
        },
        controller: function ($scope) {
            // Do nothing if no report provided
            if (!$scope.report) {
                return;
            }

            var report = $scope.report;

            ReportState
                .query({ reportType: report.reportTypeId }).$promise
                .then(function (reportStates) {
                    var currentState = null;

                    // Assign default value. This algo is not optimized because
                    // it will not stop when find the right state.
                    if (report.stateCode) {
                        reportStates.forEach(function (state) {
                            if (state.code === report.stateCode) {
                                currentState = state;
                            }
                        });
                    }

                    $scope.states = {
                        all: reportStates,
                        current: currentState,
                        original: currentState
                    };
                });

            $scope.revert = function () {
                $scope.$apply(function () {
                    $scope.states.current = $scope.states.original;
                });
            };

            $scope.change = function () {
                if ($scope.states.current === $scope.states.original) {
                    return;
                }

                swal({
                    title: '',
                    type: 'warning',
                    text: 'โปรดยืนยัน หากคุณต้องการเปลี่ยนสถานะรายงาน',
                    confirmButtonText: 'ตกลง',
                    confirmButtonClass: 'btn-danger',
                    showCancelButton: true,
                    cancelButtonText: 'ยกเลิก'
                }, function (confirm) {
                    if (confirm) {
                        $scope._change();
                    }
                    else {
                        $scope.revert();
                    }
                });
            };

            $scope._change = function () {
                var data = {
                    id: report.id,
                    stateId: $scope.states.current.id
                };
                Reports.saveState(data).$promise
                    .then(function (resp) {
                        report.stateCode = resp.stateCode;
                        $scope.states.original = $scope.states.current;
                    })
                    .catch(function (err) {
                        $scope.showWarning(err);
                        $scope.revert();
                    });
            };

            $scope.showWarning = function (err) {
                if (err.status === 403) {
                    swal({
                        title: '',
                        type: 'warning',
                        text: 'คุณไม่มีสิทธิเปลี่ยนสถานะของรายงานนี้ได้',
                        confirmButtonText: 'ตกลง',
                        confirmButtonClass: 'btn-danger',
                    });
                } else {
                    swal({
                        title: '',
                        type: 'warning',
                        text: 'เกิดข้อผิดพลาด กรุณาลองใหม่',
                        confirmButtonText: 'ตกลง',
                        confirmButtonClass: 'btn-danger',
                    });
                }
            };
        }
    };
})

.directive('responseMap', function ($timeout) {
    var map;

    var redPath = {
      fillColor: '#d75c5c',
      color: '#ff4949'
    };
    var yellowPath = {
      fillColor: '#fee8a9',
      color: '#ffb149'
    };
    var greenPath = {
      fillColor: '#8fff53',
      color: '#4dcd07'
    };
    var iconRed = L.AwesomeMarkers.icon({
        icon: 'exclamation',
        markerColor: 'red'
    });
    var iconOrange = L.AwesomeMarkers.icon({
        icon: 'home',
        markerColor: 'orange'
    });
    var iconGreen = L.AwesomeMarkers.icon({
        icon: 'home',
        markerColor: 'green'
    });

    function init(report, element) {
      L.mapbox.accessToken = config.MAPBOX_ACCESS_TOKEN;

      var options = {
        center: [
          report.reportLocation.coordinates[1],
          report.reportLocation.coordinates[0]
        ],
        zoom: 11
      };

      map = config.MAPBOX_MAP_ID ?
              L.mapbox.map(element, config.MAPBOX_MAP_ID, options) :
              L.map(element, options);
    }

    function insertMarker(obj, location, tooltipText, icon, whenHover) {
      var marker = new L.Marker(location, { clickable: true, icon: icon }).addTo(map);
      if (tooltipText) {
        $(marker._icon).tooltip({
            title: tooltipText
        });
      }
      console.log('-> 0 whenHover', whenHover);
      if (whenHover) {
        marker.on('mouseover', function (e) {
          console.log('-> 1 whenHover');
          whenHover(e, obj);
        });
      }
      return marker;
    }

    function insertCircle(location, radiusInMetre, pathOptions) {
      var marker = L.circle(location, radiusInMetre, pathOptions).addTo(map);
      return marker;
    }

    function _mockGetRedVillages() {
      /*jshint -W109*/
      return [
        {
          "id": 3000,
          "name": "หมู่บ้าน 1",
          "isLeaf": true,
          "address": "หมู่บ้าน 1",
          "location": {
            "type": "Point",
            "coordinates": [
              98.98544311523436,
              18.789642576019368
            ]
          }
        }
      ];
      /*jshint +W109*/
    }

    function _mockGetYellowVillages() {
      /*jshint -W109*/
      return [
        {
          "id": 3001,
          "name": "หมู่บ้าน 2",
          "isLeaf": true,
          "address": "หมู่บ้าน 2",
          "location": {
            "type": "Point",
            "coordinates": [
              99.00913238525389,
              18.806868084732237
            ]
          }
        }
      ];
      /*jshint +W109*/
    }

    function _mockGetGreenVillages() {
      /*jshint -W109*/
      return [
        {
          "id": 3002,
          "name": "หมู่บ้าน 3",
          "isLeaf": true,
          "address": "หมู่บ้าน 3",
          "location": {
            "type": "Point",
            "coordinates": [
              99.07161712646483,
              18.864381997011954
            ]
          }
        }
      ];
      /*jshint +W109*/
    }

    return {
      strict: 'A',
      scope: {
        report: '=',
        whenHover: '&'
      },
      link: function ($scope, $element) {
        var report = $scope.report;

        var location = [
          report.reportLocation.coordinates[1],
          report.reportLocation.coordinates[0]
        ];

        init(report, $element[0]);
        console.log('-> scope', $scope);

        _mockGetRedVillages().forEach(function (item) {
          var location = [
            item.location.coordinates[1],
            item.location.coordinates[0]
          ];
          insertMarker(item, location, item.address || item.name, iconRed, $scope.whenHover);
        });

        _mockGetYellowVillages().forEach(function (item) {
          var location = [
            item.location.coordinates[1],
            item.location.coordinates[0]
          ];
          insertMarker(item, location, item.address || item.name, iconOrange, $scope.whenHover);
        });

        _mockGetGreenVillages().forEach(function (item) {
          var location = [
            item.location.coordinates[1],
            item.location.coordinates[0]
          ];
          insertMarker(item, location, item.address || item.name, iconGreen, $scope.whenHover);
        });

        insertCircle(location, 10000, greenPath);
        insertCircle(location, 3000, yellowPath);
        insertCircle(location, 1000, redPath);

        $timeout(function () {
          map.invalidateSize();
        }, 100);
      }
    };
});
