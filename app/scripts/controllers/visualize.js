/* global moment */
'use strict';

angular.module('poddDashboardApp')

.controller('VisualizationCtrl', function ($scope, Menu, dashboard, VisualizationData) {
    Menu.setActiveMenu('visualize');

    $scope.areas = {
        all: [],
        selected: null
    };
    // Fetch available adminisitration areas
    dashboard.getAdministrationAreas().$promise.then(function (data) {
        $scope.areas.all = data.filter(function (item) {
            return item.isLeaf;
        });
    });

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
            'graph4': { periodName: 'none' },
            'graph5': { reporters: [] },
            'graph6': { data: [] },
            'graph7': { data: [] }
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
            },
            {
                name: 'graph5',
                func: function (data) {
                    return {
                        reporters: data[0].reporters
                    };
                }
            },
            {
                name: 'graph6',
                func: function (data) {
                    var self = this,
                        total = 0,
                        animalTypeMap = {},
                        animalTypeList = [],
                        animalTypeIndex = 0,
                        sumOther = 0,
                        result = {},
                        resultForGraph7 = [];

                    // phase #1 : get all animal types
                    data.forEach(function (item) {
                        item.animalTypes.forEach(function (animalType) {
                            // map for later sort.
                            // [
                            //   { name: 'chicken', count: 10 },
                            //   { name: 'pig', count: 11 },
                            //   { name: 'cow', count: 12 }
                            // ]
                            if (!animalTypeMap[animalType.name]) {
                                animalTypeMap[animalType.name] = animalTypeIndex++;
                                animalTypeList[animalTypeIndex] = {
                                    name: animalType.name,
                                    sick: animalType.sick,
                                    death: animalType.death,
                                    sum: animalType.total
                                };
                            }
                            else {
                                var animalTypeListItem = animalTypeList[ animalTypeMap[animalType.name] ];

                                animalTypeListItem.sick += animalType.sick;
                                animalTypeListItem.death += animalType.death;
                                animalTypeListItem.sum += animalType.total;
                            }

                            total += animalType.total;
                        });
                    });
                    // phase #2 : cut off to show only first 4 orders.
                    // phase #2.1 : sort
                    animalTypeList.sort(function (a, b) {
                        return b.sum - a.sum;
                    });
                    // phase #2.2 : cut off
                    if (animalTypeList.length > 4) {
                        sumOther = sum(animalTypeList.slice(4), 'sum');

                        animalTypeList = animalTypeList.slice(0, 4);
                        animalTypeList.push({
                            name: 'อื่นๆ',
                            sum: sumOther
                        });
                    }

                    // phase #3 : struct returned data so at last we got only
                    // one row. like this:
                    // {
                    //   'chicken': 10,
                    //   'pig': 11,
                    //   'cow': 12
                    // }
                    animalTypeList.forEach(function (item) {
                        // prepare schemas
                        self.schemas.graph6[item.name] = {
                            type: 'numeric',
                            name: item.name
                        };
                        // prepare options.rows
                        self.options.graph6.rows.push({
                            key: item.name,
                            axis: 'y'
                        });

                        result[item.name] = item.sum;
                        // for graph7
                        resultForGraph7.push(item);
                    });

                    // keep it for 7.
                    self.prepared.graph7.resultFromGraph6 = resultForGraph7;

                    return {
                        data: [ result ],
                        noReports: !total,
                        total: total
                    };
                }
            },
            {
                name: 'graph7',
                func: function () {
                    var classMap = [
                        { regexp: /โค/, className: 'animal-type-cow' },
                        { regexp: /ควาย/, className: 'animal-type-buffalo' },
                        { regexp: /หมู/, className: 'animal-type-pig' },
                        { regexp: /หมา/, className: 'animal-type-dog' },
                        { regexp: /ไก่/, className: 'animal-type-chicken' }
                    ];

                    return {
                        data: this.prepared.graph7.resultFromGraph6.map(function (item) {
                            var matches = classMap.filter(function (rule) {
                                return rule.regexp.test(item.name);
                            });

                            item.className = matches.length ?
                                                matches[0].className :
                                                'animal-type-other';

                            return item;
                        })
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
            },
            'graph6': {}
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
            },
            'graph6': {
                type: 'pie',
                legend: {
                    show: true
                },
                rows: [] // will fill this later in preparation phase
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
