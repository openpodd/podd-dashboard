/*global L, swal */
'use strict';

angular.module('poddDashboardApp')

.controller('MainCtrl', [
    '$scope', 'dashboard', 'streaming', 'Map', 'Reports', 'ReportModal',
    'shared', 'Auth', 'Search', 'Menu', 'Mentions', 'Flags', 'FailRequest',
    '$location', '$state', '$window',
    function ($scope, dashboard, streaming,
               Map, Reports, ReportModal, shared, Auth, Search, Menu, Mentions,
               Flags, FailRequest, $location, $state, $window) {

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

    Menu.setActiveMenu('home');

    L.mapbox.accessToken = config.MAPBOX_ACCESS_TOKEN;

    var leafletMap = config.MAPBOX_MAP_ID ?
                        L.mapbox.map('map', config.MAPBOX_MAP_ID) :
                        L.map('map');

    var center = [13.791177699, 100.58814079],
        zoomLevel = 15,
        map = new Map( leafletMap.setView(center, zoomLevel) );

    function refreshDashboard() {
        dashboard.get().$promise.then(function (villages) {

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
            map.addReport(data, toWink, 0, true);
        }

        // keep track of which is new.
        shared.newReportQueue[data.id] = data;
        // update current list view if match the current village viewing.
        // TODO: fix angular Array.push mystery that not update
        // NOTE: $digest() does not help
        if ($scope.currentVillage && $scope.currentVillage.id === data.administrationAreaId) {
            if ( isRecentReport(data) ) {
                $scope.recentReports.splice(0, 0, data);
            }
            else {
                $scope.olderReports.splice(0, 0, data);
            }
            $scope.reports = [].concat($scope.recentReports, $scope.olderReports);
        }
    });

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
                    map.addReport(data, toWink, 0, true);
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
                map.addReport(data, toWink, 0, true);
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
                'page_size': 20
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
        ], [ paddingLeft, 0 ]);

        shared.showReportList = true;
        $scope.loadingReportList = true;
        $scope.loadingReportListError = false;

        $scope.loadVillageReports(data).then(function () {
            $scope.loadingReportList = false;
        });
    });

    $scope.closeReportList = function () {
        $scope.reports = null;
        $scope.recentReports = null;
        $scope.olderReports = null;
        shared.showReportList = false;

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
        if ( report.negative ) {
            if ($state.is('main.filter')) {
                $state.go('main.filter', { reportId: report.id });
            }
            else {
                $state.go('main.report', { reportId: report.id });
            }
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
            if (data.formData && !data.formData.forEach) {
                for (index in data.formData) {
                    if (data.formData.hasOwnProperty(index)) {
                        tmpFormData.push({
                            name: index,
                            value: data.formData[index]
                        });
                    }
                }
                data.formData = tmpFormData;
            }

            // QUICKFIX: inject village into data.
            dashboard.getAdministrationAreas().$promise.then(function (areas) {
                areas.forEach(function (item) {
                    if (data.administrationAreaId === item.id) {
                        data.village = item;
                    }
                });
            });

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
        ReportModal.close();
    };

    $scope.gotoMainPage = function () {
        if ($state.is('main.filter')) {
            $state.go('main.filter', { reportId: undefined });
        }
        else {
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

        }
    });

}]);
