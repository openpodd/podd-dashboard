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

.directive('ReportView', function () {
    return {
        strict: 'A',
        link: function () {
            // NOTE: see ReportService.js in factory ReportModal.
        }
    };
});
