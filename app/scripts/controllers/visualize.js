/* global moment */
'use strict';

angular.module('poddDashboardApp')

.controller('VisualizationCtrl', function ($scope, Menu, dashboard, VisualizationData) {
    Menu.setActiveMenu('visualize');

    $scope.areas = {
        all: dashboard.getAdministrationAreas(),
        selected: null
    };

    function sum(array, propertyName) {
        return array.reduce(function (prev, current) {
            return prev + current[propertyName];
        }, 0);
    }

    function max(array, propertyName) {
        var maxIndex = 0,
            maxValue = 0;

        array.forEach(function (item, index) {
            if (item[propertyName] > maxValue) {
                maxIndex = index;
            }
        });

        return array[maxIndex];
    }

    function padLeft(text, desiredLength, padChar) {
        var newText = '' + text;

        padChar = padChar || '0';

        return (function doPad() {
            return ({
                true: function () {
                    newText = padChar + newText;
                    return doPad();
                },
                false: function () {
                    return newText;
                }
            }[newText.length < desiredLength])();
        })();
    }

    $scope.data = {
        raw: null,
        prepared: {
            'graph1': { totalReports: 0 },
            'graph2': { data: [] },
            'graph3': {},
            'graph4': { periodName: 'none' }
        },
        preparations: [
            {
                name: 'graph1',
                func: function (data) {
                    return {
                        totalReports: sum(data, 'totalReport')
                    };
                }
            },
            {
                name: 'graph2',
                func: function (data) {
                    var totalReports = 0,
                        positiveReports = 0,
                        negativeReports = 0,

                        result = data.map(function (item) {
                            totalReports    += item.totalReport;
                            positiveReports += item.positiveReport;
                            negativeReports += item.negativeReport;

                            return {
                                positiveReports: item.positiveReport,
                                negativeReports: item.negativeReport
                            };
                        });

                    return {
                        data: result || [],
                        noReports: totalReports === 0,
                        positiveReports: positiveReports,
                        negativeReports: negativeReports
                    };
                }
            },
            {
                name: 'graph3',
                func: function (data) {
                    return {
                        grade: data[0].grade
                    };
                }
            },
            {
                name: 'graph4',
                func: function (data) {
                    var periodNames = {
                             6: 'morning',
                            12: 'afternoon',
                            18: 'evening',
                             0: 'night'
                        },
                        period = max(data[0].timeRanges, 'totalReport');

                    /*jshint camelcase: false */
                    return {
                        periodName: periodNames[period.start_time],
                        totalReports: period.totalReports,
                        periodRange: padLeft(period.start_time, 2) + ':00' +
                                     ' - ' +
                                     padLeft(period.end_time, 2) + ':00 น.'
                    };
                    /*jshint camelcase: true */
                }
            }
        ],
        schemas: {
            'graph2': {
                positiveReports: {
                    type: 'numeric',
                    name: 'รายงานไม่พบเหตุผิดปกติ',
                },
                negativeReports: {
                    type: 'numeric',
                    name: 'รายงานผิดปกติ'
                }
            }
        },
        options: {
            'graph2': {
                type: 'donut',
                legend: {
                    show: false
                },
                rows: [
                    {
                        key: 'positiveReports',
                        axis: 'y'
                    },
                    {
                        key: 'negativeReports',
                        axis: 'y'
                    }
                ]
            }
        },
        loading: false,
        error: false
    };

    $scope.refresh = function () {
        if (!$scope.areas.selected || $scope.data.loading) {
            return;
        }

        $scope.data.raw = null;
        $scope.data.loading = true;
        $scope.data.error = false;

        var dateStart = moment().subtract(3, 'months').format('DD/MM/YYYY'),
            dateEnd   = moment().format('DD/MM/YYYY'),
            dateQuery = dateStart + '-' + dateEnd,

            query = {
                dates: dateQuery,
                administrationAreaId: $scope.areas.selected.id
            };

        VisualizationData.query(query).$promise
        .then(function (data) {
            $scope.data.error = false;
            $scope.data.raw = data;

            $scope.data.preparations.forEach(function (rule) {
                $scope.data.prepared[rule.name] = rule.func.call($scope.data, data);
            });
        })
        .catch(function () {
            $scope.data.error = true;
        })
        .finally(function () {
            $scope.data.loading = false;
        });
    };

    $scope.$watch('areas.selected', function (newValue) {
        if (newValue) {
            $scope.refresh();
        }
    });
});
