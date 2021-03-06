/*global L, swal */
'use strict';

angular.module('poddDashboardApp')

.controller('MainCtrl', [
    '$scope', 'dashboard', 'streaming', 'Map', 'Reports', 'ReportModal',
    'shared', 'Auth', 'Search', 'Menu', 'Mentions', 'Flags', 'FailRequest',
    '$location', '$state', '$window', '$timeout',
    function ($scope, dashboard, streaming,
               Map, Reports, ReportModal, shared, Auth, Search, Menu, Mentions,
               Flags, FailRequest, $location, $state, $window, $timeout) {

    console.log('IN MainCtrl');

    /**
     * This for debug only
     * TODO: remove when done debugging.
     */
    shared.rlError = false;
    shared.rvError = false;
    shared.rcError = false;
    $scope.shared = shared;
    /* -- end debugging code -- */

    shared.villages = [];

    // Defined shared variables.
    shared.showReportList = false;

    Auth.requireLogin($scope);

    $scope.$watch('shared.loggedIn', function (newValue) {
        $scope.isLoggedIn = newValue;
        if (!newValue) {
            $window.location.reload();
        }
    });

    Menu.setActiveMenu('map');

    var leafletMap = null;
    if (config.USE_GOOGLE_LAYER) {
        leafletMap = L.map('map');
        var ggl = new L.Google('ROADMAP'); // Possible types: SATELLITE, ROADMAP, HYBRID, TERRAIN
        leafletMap.addLayer(ggl);

        // layerControl.addLayer(gsat);
    } else {
        L.mapbox.accessToken = config.MAPBOX_ACCESS_TOKEN;

        leafletMap = config.MAPBOX_MAP_ID ?
            L.mapbox.map('map', config.MAPBOX_MAP_ID) :
            L.map('map');
    }


    var center = [13.791177699, 100.58814079],
        zoomLevel = 15,
        map = new Map( leafletMap.setView(center, zoomLevel) );

    $scope.villages = [];
    $scope.reportLocations = [];

    $scope.layer = 'area';
    $scope.$watch('layer', function (newValue) {
        if (newValue) {
            map.clearVillages();
            map.clearReportLocations();
            if (newValue === 'report') {
                if ($scope.reportLocations.length === 0) {
                    refreshReportLocations();
                } else {
                    map.setReportLocations($scope.reportLocations);
                }

            } else {
                map.setVillages($scope.villages);
            }
        }
    });

    function refreshDashboard() {
        $scope.layer = 'area';

        dashboard.get().$promise.then(function (villages) {
            $scope.villages = villages;

            if ($state.current.name !== 'main.filter') {
                map.setVillages(villages);
            }
            // Because every available village for this user is returned even there
            // is no report. We can use this variable to keep which village
            // current logged-in user can access.
            shared.villages = {};

            villages.forEach(function (item) {
                shared.villages[ item.id ] = item;
            });

        });
    }

    function refreshReportLocations() {

        var query = {
            'isPublic': true,
            'page_size': 10000,
            'lite': true
        };

        Reports.list(query).$promise.then(function (reports) {
            $scope.reportLocations = reports.results;

            if ($state.current.name !== 'main.filter') {
                map.setReportLocations($scope.reportLocations);
            }
        });
    }

    if ($state.current.name === 'main') {
        refreshDashboard();
    }

    function isRecentReport(report) {
        var threshold = new Date((new Date()).getTime() - (86400 * 14 * 1000));
        threshold.setHours(0);
        threshold.setMinutes(0);
        threshold.setSeconds(0);
        threshold.setMilliseconds(0);

        if ((new Date(report.date)) > threshold) {
            return true;
        }
        else {
            return false;
        }
    }

    streaming.on('report:new', function (data) {
        console.log('got new village data:', data);

        data = angular.fromJson(data);

        var toWink = true,
            isNew = true;

        // Don't wink if it is old report.
        if ( ! isRecentReport(data) ) {
            toWink = false;
            isNew = false;
        }

        // QUICK FIX
        data.createdByName = data.createdByName || data.createdBy;
        data.isNew = isNew;

        if ( ! shared.filterMode ) {
            map.addReport(data, toWink, true);
        }

        // keep track of which is new.
        shared.newReportQueue[data.id] = data;
        // update current list view if match the current village viewing.
        // TODO: fix angular Array.push mystery that not update
        // NOTE: $digest() does not help
        if ($scope.currentVillage && $scope.currentVillage.id === data.administrationAreaId) {
            if ( isRecentReport(data) ) {
                // $scope.recentReports.splice(0, 0, data);
                updateReportList($scope.recentReports, data);
            }
            else {
                updateReportList($scope.olderReports, data);
            }
            $scope.reports = [].concat($scope.recentReports, $scope.olderReports);
            $scope.$apply();
        }
    });

    function updateReportList(list, report) {
        var foundIndex = -1;

        list.forEach(function (item, index) {
            if (item.id === report.id) {
                foundIndex = index;
            }
        });

        if (foundIndex !== -1) {
            list[foundIndex] = report;
        }
        else {
            list.splice(0, 0, report);
        }
    }

    streaming.on('report:image:new', function (data) {
        console.log('got new report image (in main.js)', data);

        var mimicReport,
            toWink = true,
            isNew = true;

        data = angular.fromJson(data);

        // Don't wink if user are currently watch at report details.
        if ($scope.report && $scope.report.id === data.report) {
            toWink = false;
            // Don't mark as new report as well (in same condition above).
            isNew = false;
        }
        // Don't wink if it is old report.
        if ( ! isRecentReport(data) ) {
            toWink = false;
            isNew = false;
        }

        // Loop through existing reports list and update data.
        if ($scope.reports) {
            $scope.reports.forEach(function (item) {
                if (item.id === data.report) {
                    item.isNew = isNew;
                    if (isNew) {
                        shared.newReportQueue[data.id] = item;
                    }
                }

                if ( ! shared.filterMode ) {
                    map.addReport(data, toWink, true);
                }
            });
        }
        else {
            // Mimic report object just for map to know.
            mimicReport = {
                id: data.report,
                administrationAreaId: data.administrationAreaId
            };

            shared.newReportQueue[mimicReport.id] = mimicReport;
            if ( ! shared.filterMode ) {
                map.addReport(data, toWink, true);
            }
        }
    });

    streaming.on('report:flag:new', function (data) {
        console.log('got new report flag', data);

        data = angular.fromJson(data);

        // Loop through existing reports list and update data.
        if ($scope.reports) {
            $scope.reports.forEach(function (item) {
                if (item.id === parseInt(data.reportId)) {
                    item.flag = data.priority;
                    item.negative = data.reportNegative;
                }
            });
        }
    });

    $scope.loadVillageReports = function (village) {
        var query,
            searcher;

        if (shared.filterMode) {
            query = {
                q: 'administrationArea:' + village.id + ' AND ' + shared.filterQuery,
                'page_size': 20,
                tz: (new Date()).getTimezoneOffset() / -60
            };
            searcher = Search.query;
        }
        else {
            query = { administrationArea: village.id };
            searcher = Reports.list;
        }
        // TODO: remove
        if (shared.rlError) { searcher = FailRequest.query; }

        return searcher(query).$promise.then(function (items) {

            $scope.recentReports = [];
            $scope.olderReports = [];

            items.results.forEach(function (item) {
                // Filter for last 2 weeks
                if ( isRecentReport(item) ) {
                    $scope.recentReports.push(item);
                }
                // Filter for the older
                else {
                    $scope.olderReports.push(item);
                }

                // Check if it is new report and add flag 'isNew'
                if (shared.newReportQueue[item.id]) {
                    item.isNew = true;
                }
            });

            if (items.next) {
                $scope.loadmoreParams = {
                    'date__lt': items.results.slice(-1)[0].date
                };
            } else {
                $scope.loadmoreParams = null;
            }

            $scope.reports = items.results;
        })
        .catch(function () {
            $scope.loadingReportListError = true;
        });
    };

    $scope.isClickable = function (report) {
        return report.reportTypeName !== 'ปกติ';
    };

    $scope.loadmoreVillageReports = function (village, query) {
        query = query || {};
        var searcher;

        if (shared.filterMode) {
            query = $.extend(query, {
                q: 'administrationArea:' + village.id + ' AND ' + shared.filterQuery,
                'page_size': 20
            });
            searcher = Search.query;
        }
        else {
            query = $.extend(query, { administrationArea: village.id });
            searcher = Reports.list;
        }
        // TODO: remove
        if (shared.rlError) {
            searcher = FailRequest.query;
        }

        $scope.disabledLoadmoreBtn = true;
        return searcher(query).$promise.then(function (items) {

            items.results.forEach(function (item) {
                // Filter for last 2 weeks
                if ( isRecentReport(item) ) {
                    // $scope.recentReports.push(item);
                    $scope.recentReports = $scope.recentReports.concat([item]);
                }
                // Filter for the older
                else {
                    $scope.olderReports = $scope.olderReports.concat([item]);
                }

                // Check if it is new report and add flag 'isNew'
                if (shared.newReportQueue[item.id]) {
                    item.isNew = true;
                }
            });

            if (items.next) {
                $scope.loadmoreParams = {
                    'date__lt': items.results.slice(-1)[0].date
                };
            } else {
                $scope.loadmoreParams = null;
            }

            $scope.reports.push.apply(items.results);
            $scope.disabledLoadmoreBtn = false;
        })
        .catch(function () {
            $scope.loadingReportListError = true;
        });
    };

    map.onClickVillage(function (event, data) {
        console.log('clicked on village', data);

        // unwink first.
        map.villageUnwink(data);
        map.villageFocus(data);

        // set current village
        $scope.currentVillage = data;

        // set center to this marker.
        // ,-------*-------,*******,
        // ,       *       x       , -> this is paddingLeft = (w/2)
        // ,_______*_______,*******,
        //
        // <- w/2->
        // <------ w ------>
        //
        // So we need to reduce paddingLeft by (1/2) of (w/2)
        // ,----*----------,****,
        // ,    *      x        , -> this is paddingLeft = (w/4)
        // ,____*__________,****,
        //
        var paddingLeft = map.leaflet.getSize().x * (1 / 4);
        map.leaflet.panToOffset([
            data.location.coordinates[1],
            data.location.coordinates[0]
        ], [ paddingLeft, 0 ], 11);

        shared.showReportList = true;
        $scope.loadingReportList = true;
        $scope.loadingReportListError = false;

        $scope.loadVillageReports(data).then(function () {
            $scope.loadingReportList = false;
        });
    });

    map.onClickReportLocation(function (event, data) {
        // console.log('clicked on report', data);
        if (data.negative) {
            var reportId = data.id;
            // $scope.viewReport(reportId);
            if (!$state.is('main.filter')) {
                $timeout(function () {
                  $state.go('main.report', { reportId: parseInt(reportId) });
                });
            }
        }

    });

    $scope.closeReportList = function () {
        $scope.reports = null;
        $scope.recentReports = null;
        $scope.olderReports = null;
        shared.showReportList = false;

        map.villageBlurAll();

        $scope.report = null;
        ReportModal.close();
    };

    $scope.initReportModal = function () {
        ReportModal.init();

        ReportModal.on('hide:report', function () {
            $scope.report = null;
        });
    };

    $scope.onClickReport = function (report) {
        if ( $scope.isClickable(report) ) {
            if ($state.is('main.filter')) {
                $state.go('main.filter', { reportId: report.id });
            }
            else {
                $state.go('main.report', { reportId: report.id });
            }
            shared.showReportView = true;
        }
        report.isNew = false;
        delete shared.newReportQueue[report.id];
    };

    $scope.viewReport = function (reportId) {
        ReportModal.show();
        $scope.loadingReportView = true;
        $scope.loadingReportViewError = false;
        // Also clear report data.
        $scope.report = null;

        // TODO: remove
        var searcher;
        if (shared.rvError) {
            searcher = FailRequest;
        }
        else {
            searcher = Reports;
        }

        searcher.get({ reportId: reportId }).$promise.then(function (data) {
            console.log('loaded report data', data);

            var tmpFormData = [], index;
            if (data.originalFormData && !data.originalFormData.forEach) {
                for (index in data.originalFormData) {
                    if (data.originalFormData.hasOwnProperty(index)) {
                        tmpFormData.push({
                            name: index,
                            value: data.originalFormData[index]
                        });
                    }
                }
                data.originalFormData = tmpFormData;
            }

            $scope.report = data;
        })
        .catch(function (err) {
            if (err.status === 403) {
                ReportModal.close();
                $scope.gotoMainPage();
                swal({
                    title: '',
                    text: 'ขออภัย คุณยังไม่ได้รับสิทธิดูรายงานนี้',
                    confirmButtonText: 'ตกลง',
                    confirmButtonClass: 'btn-default',
                    type: 'error'
                });
            }
            else {
                $scope.loadingReportViewError = true;
            }
        })
        .finally(function () {
            $scope.loadingReportView = false;
        });
    };

    $scope.closeModal = function () {
        shared.reportWatchId = '';
        shared.showReportView = false;
        ReportModal.close();
    };

    $scope.gotoMainPage = function () {
        shared.showReportView = false;
        if ($state.is('main.filter')) {
            Menu.setActiveMenu('filter');
            $state.go('main.filter', { reportId: undefined });
        }
        else {
            Menu.setActiveMenu('main');
            $state.go('main');
        }
    };

    // Force refresh data only the right time to optimize network load.
    $scope.$on('$stateChangeSuccess', function (scope, current, params, old) {
        if (current.name === 'main') {
            $scope.closeModal();

            if ( (old.name === 'main.report' && shared.villages.length === 0) ||
                  old.name === 'main.filter' ||
                  old.name === 'main.summaryreport' ||
                  old.name === 'main.summaryperson' ) {
                shared.villages = {};
                map.clearVillages();
                map.clearReportLocations();
                refreshDashboard();
            }
        }

    });

    // Watch to turn on filter mode.
    $scope.$watch('shared.filterMode', function (newValue) {
        shared.showReportList = false;

        if (newValue) {
            $scope.$broadcast('filter:clearQuery', true);
            map.clearVillages();
            map.clearReportLocations();
            $scope.closeModal();
        }
    });

    $scope.$watch('shared.summaryReportMode', function (newValue) {
        if (newValue) {

            $scope.$broadcast('summaryReport:clearQuery', true);
            $scope.closeModal();
        }
    });

    $scope.$watch('shared.summaryPersonMode', function (newValue) {
        if (newValue) {
            $scope.$broadcast('summaryPerson:clearQuery', true);
            $scope.closeModal();
        }
    });

    $scope.$watch('shared.filterResults', function (newValue) {
        if (newValue) {
            shared.showReportList = false;

            if (!shared.forceReportViewOpen) {
                $scope.closeModal();
            }
            // Immediately reset to default state.
            shared.forceReportViewOpen = false;

            map.clearVillages();
            map.clearReportLocations();
            map.setVillages(newValue);
        }
    });

    $scope.$watch('shared.reportWatchId', function (newValue) {
        if (newValue) {
            if ($state.is('main.filter')) {
                $state.go('main.filter', { reportId: newValue });
            }
            else {
                $state.go('main.report', { reportId: newValue });
            }

            shared.showReportView = true;
        }
        else {
            shared.showReportView = false;
        }
    });

}]);
