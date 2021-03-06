/* global moment, utils */
'use strict';

angular.module('poddDashboardApp')

.controller('VisualizationCtrl', function ($scope, Menu, dashboard, $interval,
                                           VisualizationData, $window) {
    Menu.setActiveMenu('visualize');

    /* shortcuts */
    var sum = utils.sum,
        max = utils.max,
        padLeft = utils.padLeft,
        random = utils.random,
        // for randomize worker
        timer = null;

    $scope.negativeReportColor = '#00000';
    $scope.positiveReportColor = '#fffff';

    $scope.pieChartColor = [];
    $scope.pieChartColor[0] = '#aa0000';
    $scope.pieChartColor[1] = '#bb0000';
    $scope.pieChartColor[2] = '#cc0000';
    $scope.pieChartColor[3] = '#dd0000';
    $scope.pieChartColor[4] = '#ee0000';

    $scope.areas = {
        all: [],
        selected: null,
        randomize: false,
        randomizeInterval: 8000 // 2s for data, 1s for anim, 5s for display
    };
    // Temporary allow dev to change interval on-the-fly (when demo).
    $window.areas = $scope.areas;

    // Fetch available adminisitration areas
    // dashboard.getAdministrationAreas().$promise.then(function (data) {
    //     console.log("----------", data);
    //     $scope.areas.all = data.filter(function (item) {
    //         return item.isLeaf;
    //     });
    // });
    
    dashboard.getAuthorities().$promise.then(function (data) {
        $scope.areas.all = data;
    });

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

                    // reset pie chart color
                    this.options.graph2.rows = [
                        {
                            key: 'positiveReports',
                            axis: 'y',
                            color: $scope.positiveReportColor
                        },
                        {
                            key: 'negativeReports',
                            axis: 'y',
                            color: $scope.negativeReportColor
                        }
                    ];

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
                        grade: data[0].grade.toLowerCase()
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
                        periodName: periodNames[period.startTime],
                        totalReports: period.totalReports,
                        periodRange: padLeft(period.startTime, 2) + ':00' +
                                     ' - ' +
                                     padLeft(period.endTime, 2) + ':00 น.'
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
                        result = {},
                        legends = [],
                        resultForGraph7 = [];

                    // phase #0 : reset graph schemas and options
                    self.schemas.graph6 = {};
                    self.options.graph6.rows = [];

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
                        (function () {
                            var listOther = animalTypeList.slice(4);

                            animalTypeList = animalTypeList.slice(0, 4);
                            animalTypeList.push({
                                name: 'อื่นๆ',
                                sum: sum(listOther, 'sum'),
                                sick: sum(listOther, 'sick'),
                                death: sum(listOther, 'death')
                            });
                        })();
                    }

                    // phase #3 : struct returned data so at last we got only
                    // one row. like this:
                    // {
                    //   'chicken': 10,
                    //   'pig': 11,
                    //   'cow': 12
                    // }
                    animalTypeList.forEach(function (item, itemIndex) {
                        // prepare schemas
                        self.schemas.graph6[item.name] = {
                            type: 'numeric',
                            name: item.name
                        };
                        // prepare options.rows
                        self.options.graph6.rows.push({
                            key: item.name,
                            axis: 'y',
                            color: $scope.pieChartColor[itemIndex]
                        });
                        // prepare legends
                        legends.push({
                            name: item.name,
                            style: {
                                'background-color': $scope.pieChartColor[itemIndex]
                            }
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
                        total: total,
                        legends: legends
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
                        axis: 'y',
                        color: $scope.positiveReportColor
                    },
                    {
                        key: 'negativeReports',
                        axis: 'y',
                        color: $scope.negativeReportColor
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

    /* scope functions */
    $scope.play = function play() {
        console.log('- randomize');
        var index = 0;

        $scope.areas.randomize = true;

        if (timer) {
            return;
        }

        function randomize() {
            index = Math.floor(random(0, $scope.areas.all.length));
            $scope.areas.selected = $scope.areas.all[index];
        }
        randomize();

        timer = $interval(randomize, $scope.areas.randomizeInterval);
    };
    $scope.pause = function pause() {
        console.log('- stop randomize');
        $scope.areas.randomize = false;

        if (!timer) {
            return;
        }

        $interval.cancel(timer);
        timer = null;
    };

    $scope.toggleRandomize = function toggleRandomize() {
        if ($scope.areas.randomize) {
            $scope.pause();
        }
        else {
            // run randomize worker.
            $scope.play();
        }
    };

    $scope.$watch('areas.randomizeInterval', function () {
        if ($scope.areas.randomize) {
            $scope.pause();
            $scope.play();
        }
    });


    $scope.months = {
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        years: [2015, 2014],
        selectedMonth: moment().month() + 1,
        selectedYear: moment().year()
    };

    $scope.refresh = function () {
        if (!$scope.areas.selected || $scope.data.loading) {
            return;
        }

        $scope.data.raw = null;
        $scope.data.loading = true;
        $scope.data.error = false;

        var query = {
            month: $scope.months.selectedMonth + '/' + $scope.months.selectedYear,
            authorityId: $scope.areas.selected.id
        };

        VisualizationData.get(query).$promise
        .then(function (data) {
            data = [ data ];
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

    $scope.$watch('months.selectedMonth', function (newValue) {
        if (newValue) {
            $scope.refresh();
        }
    });

    $scope.$watch('months.selectedYear', function (newValue) {
        if (newValue) {
            $scope.refresh();
        }
    });
});
