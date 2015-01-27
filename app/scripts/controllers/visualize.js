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

    $scope.data = {
        raw: null,
        prepared: {
            'graph1': { totalReports: 0 },
            'graph2': { data: [] },
            'graph3': {}
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
