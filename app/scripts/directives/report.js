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

.directive('reportState', function (ReportState) {
    return {
        strict: 'A',
        template: '<div>{{ state.name }}</div>',
        scope: {
            report: '='
        },
        controller: function ($scope) {
            if (!$scope.report) {
                return;
            }

            ReportState
                .query({ reportType: $scope.report.reportTypeId }).$promise
                .then(function (reportStates) {
                    reportStates.forEach(function (state) {
                        if (state.id === $scope.report.state) {
                            $scope.state = state;
                        }
                    });
                });
        }
    };
})

.directive('reportStateForm', function ($http, $modal, Reports, ReportState) {

    function reloadStates($scope, report) {
        return ReportState
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

                recheckStates($scope);
            });
    }

    function recheckStates($scope) {
        var currentState = $scope.states.current;
        var allowedStates = [];
        currentState.toStates.forEach(function (state) {
            allowedStates.push(state.id);
        });

        $scope.states.all.forEach(function (state) {
            if (allowedStates.indexOf(state.id) !== -1) {
                state.disable = false;
            }
            else {
                state.disable = true;
            }
        });
    }

    return {
        strict: 'A',
        require: '^reportView',
        templateUrl: 'views/report-state-form.html',
        scope: {
            report: '=',
            deferChange: '=',
            submit: '=',
            onSelect: '&',
            disableDisallowStates: '='
        },
        controller: function ($scope) {
            var report = $scope.report;

            $scope.$watch('report', function (newValue) {
                report = newValue;
                if (newValue) {
                    reloadStates($scope, newValue);
                }
            });

            $scope.revert = function () {
                $scope.$apply(function () {
                    $scope.states.current = $scope.states.original;
                });
            };

            $scope.proxyChange = function () {
                if ($scope.onSelect) {
                  $scope.onSelect({ $state: $scope.states.current });
                }
                // Change state only explicit submit.
                if ($scope.deferChange) {
                    return;
                }

                $scope.change();
            };

            $scope.change = function (callback) {
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
                        $scope._change(callback);
                    }
                    else {
                        $scope.revert();
                    }
                });
            };
            if ($scope.submit) {
              $scope.submit = $scope.change;
            }

            $scope._change = function (callback) {
                var data = {
                    id: report.id,
                    stateId: $scope.states.current.id
                };
                Reports.saveState(data).$promise
                    .then(function (resp) {
                        report.stateCode = resp.stateCode;
                        $scope.states.original = $scope.states.current;
                        recheckStates($scope);
                        callback($scope.states.current);
                    })
                    .catch(function (err) {
                        $scope.showWarning(err);
                        $scope.revert();
                        callback(err);
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

    function init(center, element) {
      L.mapbox.accessToken = config.MAPBOX_ACCESS_TOKEN;

      var options = {
        center: center,
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

      if (whenHover) {
        marker.on('mouseover', function () {
          whenHover({ $obj: obj });
        });
      }
      return marker;
    }

    function insertCircle(location, radiusInMetre, pathOptions) {
      var marker = L.circle(location, radiusInMetre, pathOptions).addTo(map);
      return marker;
    }

    function isBlacklisted(area) {
      var testString = area.address + area.name;
      if (testString.match(/^(องค์การ|เทศบาล|อำเภอ|จังหวัด)/)) {
        return true;
      }
    }

    return {
      strict: 'A',
      scope: {
        planReport: '=',
        whenHover: '&'
      },
      link: function ($scope, $element) {
        var planReport = $scope.planReport;
        var redAreas = planReport.log.level_areas.red;
        var yellowAreas = planReport.log.level_areas.yellow;
        var greenAreas = planReport.log.level_areas.green;

        var center = [
          redAreas[0].location.coordinates[1],
          redAreas[0].location.coordinates[0]
        ];
        init(center, $element[0]);

        redAreas.forEach(function (item) {
          var location = [
            item.location.coordinates[1],
            item.location.coordinates[0]
          ];
          if (!isBlacklisted(item)) {
            insertMarker(item, location, item.address || item.name, iconRed, $scope.whenHover);
          }
        });

        yellowAreas.forEach(function (item) {
          var location = [
            item.location.coordinates[1],
            item.location.coordinates[0]
          ];
          if (!isBlacklisted(item)) {
            insertMarker(item, location, item.address || item.name, iconOrange, $scope.whenHover);
          }
        });

        greenAreas.forEach(function (item) {
          var location = [
            item.location.coordinates[1],
            item.location.coordinates[0]
          ];
          if (!isBlacklisted(item)) {
            insertMarker(item, location, item.address || item.name, iconGreen, $scope.whenHover);
          }
        });

        // make a circle to show radius.
        var levels = {};
        planReport.log.plan.levels.forEach(function (item) {
          levels[item.code] = item;
        });

        insertCircle(center, levels.green.distance, greenPath);
        insertCircle(center, levels.yellow.distance, yellowPath);
        insertCircle(center, Math.max(levels.red.distance, 1000), redPath);

        $timeout(function () {
          map.invalidateSize();
        }, 100);
      }
    };
});
