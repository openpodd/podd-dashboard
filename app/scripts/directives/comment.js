/* globals swal:false, L */
'use strict';

angular.module('poddDashboardApp')

.directive('doddReportComments', function (Reports, Comments, FailRequest,
                                       shared, streaming) {

    function refreshComments(scope) {
        scope.comments = [];
        scope.loadingReportComments = true;
        scope.loadingReportCommentsError = false;

        // TODO: remove
        var searcher = Comments.list;
        if (shared.rcError) { searcher = FailRequest.query; }

        scope.comments = Comments.list({ reportId: scope.reportId });

        scope.comments.$promise
            .catch(function () {
                scope.loadingReportCommentsError = true;
            })
            .finally(function () {
                scope.loadingReportComments = false;
            });
    }

    return {
        strict: 'EA',
        scope: {
            reportId: '='
        },
        templateUrl: '/views/comments-dodd.html',
        link: function (scope) {
            scope.comments=[];
            scope.loading = false;
            scope.loadingReportComments = false;
            scope.loadingReportCommentsError = false;


            scope.reset = function reset() {
                scope.message = '';
                scope.submitting = false;
                scope.loading = false;
            }

            scope.postComment = function () {
                scope.submitting = true;

                var data = {
                    reportId: scope.reportId,
                    message: scope.message.replace(/\@([\w\-]+)/g, '@[$1]')
                };

                scope.loading = true;

                Comments.post(data).$promise.then(function () {
                    scope.reset();

                }, function(error){
                    if(error.status === 400){
                        scope.callError(error.data.detail);
                    }
                });
            };

            scope.callError = function(detail) {
                scope.loading = false;
                swal({title: '', text: detail, type: 'error', confirmButtonText: 'ตกลง' },
                    function(isConfirm){
                        if(isConfirm) {
                            scope.submitting = false;
                        }
                    }
                );
            };

            streaming.on('report:comment:new', function (data) {
                data = angular.fromJson(data);

                if (scope.$parent.report) {
                    if (data.reportId === scope.reportId) {
                        data.isNew = true;
                        scope.comments.push(data);
                        scope.$apply();
                    }
                }
            });


            refreshComments(scope);
        }
    };
});
