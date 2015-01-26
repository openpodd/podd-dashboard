/* global moment */
'use strict';

angular.module('poddDashboardApp')

.controller('VisualizationCtrl', function ($scope, Menu, dashboard, VisualizationData) {
    Menu.setActiveMenu('visualize');

    $scope.areas = {
        all: dashboard.getAdministrationAreas(),
        selected: null
    };

    $scope.data = {
        raw: null,
        prepared: {
            'graph2': []
        },
        preparations: [
            {
                name: 'graph2',
                func: function (data) {
                    return data.map(function (item) {
                        return {
                            positiveReports: item.positiveReport,
                            negativeReports: item.negativeReport
                        };
                    });
                }
            }
        ],
        schemas: {
            'graph2': {
                positiveReports: {
                    type: 'numeric',
                    name: 'รายงานไม่พบเหตุผิดปกติ'
                },
                negativeReports: {
                    type: 'numeric',
                    name: 'รายงานผิดปกติ'
                }
            }
        },
        options: {
            'graph2': {
                type: 'pie',
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
                $scope.data.prepared[rule.name] = rule.func.call(this, data);
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
