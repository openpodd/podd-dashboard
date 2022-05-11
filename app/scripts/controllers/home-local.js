/*globals swal*/
"use strict";

angular
    .module("poddDashboardApp")

    /**
     * Show list of recent local goverment reports.
     */
    .controller(
        "HomeLocalCtrl",
        function (
            $scope,
            LocalSearch,
            ReportState,
            moment,
            ReportModal,
            shared,
            Reports,
            $state,
            $stateParams,
            $timeout,
            Menu,
            Auth,
            $location
        ) {
            console.log("-> In HomeLocalCtrl");

            Menu.setActiveMenu("home-local");
            Auth.requireLogin($scope);

            // Load report if given at request.
            $timeout(function () {
                var reportId = $stateParams.reportId;
                if (reportId) {
                    if (!angular.isString(reportId)) {
                        $location.search("reportId", null);
                    } else {
                        $scope.viewReport($stateParams.reportId);
                    }
                } else {
                    ReportModal.close();
                }
            });

            $scope.reportStateName = ReportState.translateReportStateName;

            var query = {
                page_size: 20,
                tz: new Date().getTimezoneOffset() / -60,
            };

            function reset() {
                $scope.page = 1;
                $scope.totalPage = 1;
                $scope.lastPage = null;
                $scope.reports = [];
            }

            $scope.reports = [];

            $scope.dateRange = {
                from: null,
                to: null,
            };

            function concat(a, b) {
                b.forEach(function (item) {
                    a.push(item);
                });
                return a;
            }

            $scope.submit = function submit(event) {
                event.preventDefault();
                _load(true);
            };

            // First tab will automatically selected and activate this function
            // so we initially load reports here when page is rendered
            $scope.filterProgress = function (status) {
                switch (status) {
                    case 0:
                        $scope.status = "pending";
                        break;
                    case 1:
                        $scope.status = "inprogress";
                        break;
                    case 2:
                        $scope.status = "complete";
                        break;
                    default:
                        $scope.status = "pending";
                }
                _load(true);
            };

            function _load(needReset) {
                var dateFrom = $scope.dateRange.from;
                var dateTo = $scope.dateRange.to;

                query.dateFrom = dateFrom
                    ? moment($scope.dateRange.from).format("YYYY-MM-DD")
                    : null;
                query.dateTo = dateTo
                    ? moment($scope.dateRange.to).format("YYYY-MM-DD")
                    : null;
                query.status = $scope.status;

                load(query, needReset);
            }

            $scope.firstDayOfYear = moment().startOf("year").toDate();

            function load(query, needReset) {
                if ($scope.loading) {
                    return;
                }
                $scope.loading = true;
                $scope.error = false;

                if (needReset) {
                    reset();
                }

                query.page = $scope.page;
                LocalSearch.query(query)
                    .$promise.then(function (resp) {
                        $scope.page++;
                        $scope.totalPage = Math.ceil(
                            resp.count / query.page_size
                        );
                        $scope.lastPage = !resp.next;

                        // assign relative time to make a group.
                        resp.results.forEach(function (item) {
                            var $date = moment(item.date);
                            item.isThisYear =
                                $date.toDate() >= $scope.firstDayOfYear;
                        });

                        concat($scope.reports, resp.results);
                    })
                    .catch(function () {
                        $scope.error = true;
                    })
                    .finally(function () {
                        $scope.loading = false;
                    });
            }

            $scope.loadMore = function loadMore() {
                _load();
            };

            $scope.lastActiveReportId = null;
            $scope.activeReportId = null;
            $scope.resultMode = "table";
            $scope.lastPage = false;
            $scope.error = false;
            $scope.isEmpty = function () {
                return (
                    $scope.reports.length === 0 &&
                    !$scope.loading &&
                    !$scope.error
                );
            };

            $scope.onClickReport = function (reportId) {
                $location.search("reportId", reportId);
            };

            $scope.closeReportView = function () {
                $location.search("reportId", null);
            };

            $scope.$on("$locationChangeSuccess", function (event) {
                var reportId = $location.search().reportId;
                // check if the same state.
                if ($location.path() !== $state.$current.url.sourcePath) {
                    return;
                }
                // do nothing if no params
                if (reportId === true || reportId === false) {
                    // also clear params reportId if is empty.
                    $location.search("reportId", null);
                    return;
                }

                reportId = parseInt(reportId);
                if (
                    reportId &&
                    angular.isNumber(reportId) &&
                    reportId !== $scope.activeReportId
                ) {
                    $scope.lastActiveReportId = reportId;
                    $scope.activeReportId = reportId;
                    shared.reportWatchId = reportId;
                    $scope.viewReport(reportId);
                }
                if (!reportId) {
                    $scope.activeReportId = null;
                    shared.reportWatchId = null;
                    ReportModal.close();
                }
            });

            // report view related.
            $scope.viewReport = function (reportId) {
                ReportModal.show();
                $scope.loadingReportView = true;
                $scope.loadingReportViewError = false;
                // Also clear report data.
                $scope.report = null;

                Reports.get({ reportId: reportId })
                    .$promise.then(function (data) {
                        console.log("loaded report data", data);

                        var tmpFormData = [],
                            index;
                        if (
                            data.originalFormData &&
                            !data.originalFormData.forEach
                        ) {
                            for (index in data.originalFormData) {
                                if (
                                    data.originalFormData.hasOwnProperty(index)
                                ) {
                                    tmpFormData.push({
                                        name: index,
                                        value: data.originalFormData[index],
                                    });
                                }
                            }
                            data.originalFormData = tmpFormData;
                        }

                        tmpFormData = [];
                        if (data.formData && !data.formData.forEach) {
                            for (index in data.formData) {
                                if (data.formData.hasOwnProperty(index)) {
                                    tmpFormData.push({
                                        name: index,
                                        value: data.formData[index],
                                    });
                                }
                            }
                            data.formData = tmpFormData;
                        }

                        $scope.report = data;
                    })
                    .catch(function (err) {
                        if (err.status === 403) {
                            $scope.closeReportView();
                            swal({
                                title: "",
                                text: "ขออภัย คุณยังไม่ได้รับสิทธิดูรายงานนี้",
                                confirmButtonText: "ตกลง",
                                confirmButtonClass: "btn-default",
                                type: "error",
                            });
                        } else {
                            $scope.loadingReportViewError = true;
                        }
                    })
                    .finally(function () {
                        $scope.loadingReportView = false;
                    });
            };

            // Watch for report id changed.
            $scope.$watch("shared.reportWatchId", function (newValue) {
                if (newValue && newValue !== $scope.activeReportId) {
                    $location.search("reportId", newValue);
                }
            });
        }
    );
