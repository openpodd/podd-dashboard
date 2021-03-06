/* global moment */
'use strict';

angular.module('poddDashboardApp')

.controller('FilterModeCtrl', function (shared, Menu) {
    shared.filterMode = true;
    Menu.setActiveMenu('filter');
})

.controller('FilterCtrl', function ($scope, Search, shared, $window, dashboard,
                                    $state, $stateParams, $q, $timeout, streaming,
                                    uiGridUtils) {

    $scope.shared = shared;

    $scope.startOfMonth = moment().startOf('month').format('YYYY-MM-DD');
    $scope.endOfMonth = moment().endOf('month').format('YYYY-MM-DD');

    $scope.$on('filter:clearQuery', function (willClear) {
        if (willClear) {
            $scope.query = $stateParams.q || '';
            $scope.willShowResult = false;
            $scope.loading = false;
            $scope.empty = false;
            $scope.error = false;
            $scope.help = false;

            $scope.didSearch = false;
            shared.filterResults = [];
            shared.filteredReports = [];

            if ($scope.query) {
                $scope.doQueryOnParams($stateParams);
            }
        }
    });

    streaming.on('report:flag:new', function (data) {
      console.log('got new report flag in filter', data);

      data = angular.fromJson(data);

      // Loop through existing reports list and update data.
      if (shared.filteredReports) {
        shared.filteredReports.forEach(function (item) {
          if (item.id === parseInt(data.reportId)) {
            item.flag = data.priority;
            item.negative = data.reportNegative;
          }
        });
      }
    });

    $scope.search = function () {
        $state.go('main.filter', { q: $scope.query }, { location: true });
    };

    $scope._search = function () {
        console.log('Will search with query', $scope.query);

        var query = {};

        // Mark as already did the search.
        $scope.didSearch = true;

        shared.filterQuery = $scope.query;

        $scope.closeHelp();

        if ($scope.loading) {
            return;
        }

        $scope.loading = true;
        $scope.empty = false;
        $scope.error = false;

        shared.filteredReports = [];
        // show result box.
        $scope.willShowResult = true;

        query = {
            q: $scope.query,
            tz: (new Date()).getTimezoneOffset() / -60
        };

        return Search.query(query).$promise.then(function (data) {
            console.log('Query result:', data);
            $scope.loading = false;

            shared.filteredReports = data.results;
            data.results.forEach(function (item) {
                item.clickable = item.reportTypeName !== 'ปกติ';
            });
            $scope.filterResultGridOptions.data = data.results;

            // Do group by administrationAreaId
            var results = [],
                villageLocations = {};

            data.results.forEach(function (item) {
                if (!item.reportLocation) {
                    return;
                }
                var loc = villageLocations[ item.administrationAreaId ] = villageLocations[ item.administrationAreaId ] || {};
                var key = '' + item.reportLocation[0] + ',' + item.reportLocation[1];
                loc[key] = loc[key] ? loc[key] + 1 : 1;
            });

            Object.keys(villageLocations).forEach(function (key1) {
                var max = 0;
                var winner = '';
                Object.keys(villageLocations[key1]).forEach(function (key2) {
                    var value = villageLocations[key1][key2];
                    if (value > max) {
                        winner = key2;
                        max = value;
                    }
                });

                villageLocations[key1] = winner.split(',');
            });

            shared.villages = {};

            data.results.forEach(function (item) {
                var village = shared.villages[ item.administrationAreaId ];

                if (!village) {
                    village = {
                        id: item.administrationAreaId,
                        address: item.administrationAreaAddress,
                        location: {
                            coordinates: villageLocations[item.administrationAreaId] || []
                        },
                        position: 0,
                        positionCases: [],
                        negative: 0,
                        negativeCases: []
                    };
                    shared.villages[ item.administrationAreaId ] = village;
                    if (item.negative) {
                        results.push(village);
                    }
                }

                if (item.negative) {
                    village.negative += 1;
                }
                else {
                    village.positive += 1;
                }
            });

            $scope.results = results;
            shared.filterResults = results;

            if (results.length === 0) {
                $scope.empty = true;
            }
            else {
                $scope.empty = false;
                $scope.willShowResult = false;
            }

        }).catch(function () {
            $scope.loading = false;
            $scope.error = true;
        });
    };

    $scope.triggerVillageClick = function (item) {
        $('#map').trigger('clicked:village', item);
    };

    $scope.closeResult = function () {
        $scope.willShowResult = false;
    };

    $scope.toggleHelp = function () {
        $scope.help = !$scope.help;
    };

    $scope.closeHelp = function () {
        $scope.help = false;
    };

    $scope.showTable = false;
    $scope.toggleTable = function () {
        $scope.showTable = !$scope.showTable;
        if ($scope.showTable) {
            shared.showReportList = false;

            $($window).trigger('forceResizeResultWrapper');
            $timeout(function () {
                $($window).trigger('forceResizeResultTable');
            }, 100);

            setTimeout(function(){
                var w = angular.element($window);
                w.resize();
            }, 100);
        }
    };

    $scope.$watch('shared.showReportList', function (newValue) {
        if (newValue) {
            $scope.showTable = false;
        }
    });


    // do things about URL
    $scope.doQueryOnParams = function (params) {
        // do query only in main.filter mode.
        if ($state.current.name === 'main.filter') {
            $scope.query = $window.decodeURIComponent(params.q || '');
            if ($scope.query) {
                return $scope._search().then(function () {
                    if (params.reportId) {
                        // Need to force report view to open here. Normal
                        // behavior when filterResults changed is to close
                        // report list and report modal.
                        shared.forceReportViewOpen = true;
                        $scope.$parent.viewReport(params.reportId);
                    }
                });
            }
            else {
                shared.filterResults = [];
                shared.filteredReports = [];

                return $q.when();
            }
        }
    };
    $scope.doQueryOnParams($stateParams);
    // detect change on 'q' param changes.
    $scope.$on('$stateChangeSuccess', function (scope, current, params, old, oldParams) {
        // do query only in main.filter mode.
        if ($state.current.name === 'main.filter') {
            if (params.reportId && oldParams.q === params.q) {
                $scope.$parent.viewReport(params.reportId);
            }
            else if (oldParams.q !== params.q || current.name !== old.name) {
                $scope.doQueryOnParams(params);
            }
        }
    });

    // ui-grid
    $scope.filterResultGridOptions = {
        // enablePagination: true,
        // rowsPerPage: 10,
        // enableVerticalScrollbar: false,
        // enableHorizontalScrollbar: false,
        // scrollThrottle: 144,
        minRowsToShow: 15,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        rowTemplate: '<div ng-class="{ \'report-negative\': row.entity.negative, \'clickable\': row.entity.clickable }">' +
                     '<div ng-repeat=\"(colRenderIndex, col) in colContainer.renderedColumns track by col.colDef.name\"' +
                     '     class=\"ui-grid-cell\" ui-grid-cell ' +
                     '     ng-class=\"{ \'ui-grid-row-header-cell\': col.isRowHeader }\">' +
                     '</div></div>',
        columnDefs: [
            {
                name: '',
                field: 'stateCode',
                width: '5%',
                cellTemplate: '<div class=\"ui-grid-cell-contents\">' +
                              '<i class="fa fa-flag flag-state-code--{{COL_FIELD}}" ng-if="!row.entity.parent && COL_FIELD"></i>' +
                              '<i class="fa fa-flag flag-follow-up-report" ng-if="row.entity.parent"></i>' +
                              '</div>',
                exportFilter: function (value) {
                    return {
                        1: 'Ignore',
                        2: 'OK',
                        3: 'Contact',
                        4: 'Follow',
                        5: 'Case'
                    }[ parseInt(value) ];
                }
            },
            {
                name: 'วันที่รายงาน',
                field: 'date',
                width: '18%',
                cellFilter: 'amDateFormat:\'D MMM YYYY\''
            },
            {
                name: 'พื้นที่',
                field: 'administrationAreaAddress',
                width: '24%',
            },
            {
                name: 'ประเภท',
                field: 'reportTypeName',
                width: '18%',
            },
            {
                name: 'สถานะ',
                field: 'negative',
                width: '10%',
                cellTemplate: '<div class=\"ui-grid-cell-contents\">' +
                              '<span ng-show="COL_FIELD" class="badge badge-bad">Bad</span>' +
                              '<span ng-hide="COL_FIELD" class="badge badge-good">Good</span>' +
                              '</div>'
            },
            {
                name: 'ผู้รายงาน',
                field: 'createdByName',
                width: '*'
            }
        ],
        onRegisterApi: function (gridApi) {
            window.gridApi = $scope.gridApi = gridApi;

            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                if (row && row.isSelected) {
                    $scope.$parent.onClickReport(row.entity);
                }
            });
        },
        data: []
    };

    $scope.$watch('$parent.report', function (newValue) {
        if (!newValue) {
            $scope.gridApi.selection.clearSelectedRows();
        }
    });

    // Handle export function.
    $scope.csvExport = function (e) {
        e.preventDefault();
        uiGridUtils.exportCsv($scope.gridApi.grid, 'filtered.csv');
    };

    $scope.xlsxExport = function (e) {
        e.preventDefault();
        uiGridUtils.exportXlsx($scope.gridApi.grid, 'filtered.xlsx');
    };

})

.directive('filterThis', function () {
    return {
        scope: 'A',
        compile: function () {
            return {
                pre: function (scope, $element) {
                    $element.html($element.text() + ' <i class="fa fa-arrow-circle-o-up"></i>');
                },
                post: function (scope, $element) {
                    $element.tooltip({
                        title: 'คลิกเพื่อเพิ่ม filter นี้ในกล่องด้านบน'
                    });

                    $element.on('click', function () {
                        scope.$apply(function () {
                            if (scope.query) {
                                if (scope.isOnlyq) {
                                    scope.query = $element.text().replace(' ', '');
                                } else {
                                    scope.query += ' AND ' + $element.text();
                                }
                            }
                            else {
                                scope.query += '' + $element.text();
                            }
                        });
                    });
                }
            };
        },
    };
});
