'use strict';

angular.module('poddDashboardApp')

.directive('reportTypeFormData', function ($compile, $templateCache, shared) {

    function makeReportTypeTemplateUrl(report) {
        if (report) {
          return 'reportType-' + report.reportTypeId + '.html';
        }
        else {
          return '';
        }
    }

    return {
        strict: 'A',
        scope: {
            report: '='
        },
        compile: function compile(/* element, attr */) {
            return function (scope, $element/*, $attr */) {
                scope.$watch('report', function (report) {
                    console.log('DBG::reportTypeFormData', report);

                    var newScope = scope.$new(true),
                        checking = 'reportTypeTemplateLoadedReportType' + report.reportTypeId;
                    // If it's come in array, convert it. Else just extend.
                    // I make this to compat to this example template:
                    // ```html
                    //   <div>
                    //     <span class="name">Animal Type</span>
                    //     <span class="value">{{ animalType }}</span>
                    //   </div>
                    // ```
                    if (report.formData instanceof Array) {
                        report.formData.forEach(function (item) {
                            newScope[item.name] = item.value;
                        });
                    }
                    else {
                        angular.extend(newScope, report.formData);
                    }

                    if (report) {
                        scope.shared = shared;

                        var watcher = scope.$watch('shared.' + checking, function (newValue) {
                            var template = $templateCache.get( makeReportTypeTemplateUrl(report) );

                            if ( shared[checking] || newValue ) {
                                $element.html(template);
                                $compile($element.contents())(newScope);

                                // Unwatch when template loaded.
                                watcher();
                            }
                        });
                    }
                    else {

                    }
                });
            };
        }
    };
})

.directive('jumpToFilter', function ($compile) {
    var supportedFields = [ 'animalType', 'createdByName', 'area' ],
        defaultTimeCriteria = 'date:last 7 days';

    return {
        strict: 'EA',
        scope: {
            name: '=',
            value: '='
        },
        compile: function compile() {
            return function (scope, $element) {
                var q = '';

                if ( supportedFields.indexOf(scope.name) !== -1) {
                    // add time criteria
                    q += defaultTimeCriteria;
                    // add field criteria
                    q += ' AND ' + scope.name + ':' + scope.value;

                    scope.q = q;

                    $element.html('<a ng-href="#/filter?q={{ q|encodeURI }}">{{ value }}</a>');
                    $compile($element.contents())(scope);
                }
                else {
                    // render plain value if not supported.
                    $element.html('{{ value }}');
                    $compile($element.contents())(scope);
                }
            };
        }
    };
})

.directive('reportFollowUp', function (Reports) {
    function refresh(scope) {
        if (scope.report) {
            Reports.followUp({ reportId: scope.report.id }).$promise.then(function (data) {
                scope.items = data;
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
