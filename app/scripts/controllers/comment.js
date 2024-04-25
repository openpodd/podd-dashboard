/*global swal */
'use strict';

angular.module('poddDashboardApp')

.controller('CommentsCtrl', function ($scope, Comments, Comment,
    User, streaming, FailRequest, shared, PlanReport, $modal) {

    console.log('init comment ctrl');

    $scope.comments = []; // --> Why we need this? It's quite weird. When
                          // --> this line is missing. Some async function
                          // --> may raise $scope.comments is undefined.

    function refreshComments() {
        $scope.comments = [];
        $scope.loadingReportComments = true;
        $scope.loadingReportCommentsError = false;

        // TODO: remove
        var searcher = Comments.list;
        if (shared.rcError) { searcher = FailRequest.query; }

        $scope.comments = Comments.list({ reportId: $scope.$parent.report.id });

        $scope.comments.$promise
            .catch(function () {
                $scope.loadingReportCommentsError = true;
            })
            .finally(function () {
                $scope.loadingReportComments = false;
            });
    }

    $scope.loading = false;

    function reset() {
        $scope.message = '';
        $scope.submitting = false;
        $scope.loading = false;
        clearFile();
    }

    function clearFile(){
        $scope.file = '';
        $('.upload').val('');
    }

    $scope.$watch('$parent.report', function (newValue) {
        if (newValue) {
            refreshComments();
        }
    });

    reset();

    $scope.postComment = function () {
        $scope.submitting = true;

        if($scope.file[0] && $scope.file[0].size > 10485760){
            callError('ไม่สามารถอัพโหลดไฟล์ที่มีขนาดของไฟล์มากกว่า 10MB');
            return;
        }

        console.log($scope.message);

        var data = {
            reportId: $scope.$parent.report.id,
            message: $scope.message.replace(/\@([\w\-]+)/g, '@[$1]'),
            file: $scope.file,
        };

        $scope.loading = true;

        Comments.post(data).$promise.then(function () {
            reset();

        }, function(error){
            if(error.status === 400){
                callError(error.data.detail);
            }
        });
    };

    function callError(detail){
        $scope.loading = false;
        swal({title: '', text: detail, type: 'error', confirmButtonText: 'ตกลง' },
            function(isConfirm){
                if(isConfirm) {
                    $scope.submitting = false;
                }
            }
        );
    }

    $scope.searchUser = function(term) {
        return User.search({ username: term }).$promise.then(function (data) {
            $scope.users = data;
        });
    };

    $scope.getUserText = function(item) {
        return '@[<i>' + item.username + '</i>]';
    };

    $scope.getUserTextRaw = function(item) {
        return '@' + item.username;
    };

    $scope.file = '';

    $scope.onFileSelect = function($file) {
        console.log("file selected")
        $scope.file = '';
        $scope.file = $file;
    };

    $scope.clearFile = function() {
        clearFile();
    };

    $scope.commentBodyClick = function ($event) {
      var planReportId = $($event.target).text();
      planReportId = planReportId.replace(/.*(\d+).*?/, '$1');
      if (planReportId) {
        $scope.viewPlanReport(planReportId);
      }
    };

    $scope.viewPlanReport = function (planReportId) {
      // Do Nothing:
      // PlanReport.get({ id: planReportId }).$promise.then(function (resp) {
      //   $scope._viewResponseMap(resp);
      // });
    };

    $scope._viewResponseMap = function (planReport) {
      var scope = $scope.$new();
      scope.planReport = planReport;
      scope.isShowMap = true;

      var modalInstance = $modal.open({
        templateUrl: 'views/plan-report.html',
        scope: scope,
        size: 'lg',
        controller: 'PlanReportModalCtrl'
      });
    };

    $scope.selectCommentId = -1;
    $scope.selectedComment = function (comment) {
        $scope.selectCommentId = comment.id;
        $scope.commentSelected = comment;
        $scope.commentBeforeChange = angular.copy(comment);
    };

    $scope.submitEditComment = function (comment) {
        if ($scope.commentBeforeChange.message !== $scope.commentSelected.message) {
            var params = {
                'id': comment.id,
                'reportId': comment.reportId,
                'message': $scope.commentSelected.message
            }

            Comment.update(params).$promise.then(function () {
                $scope.commentSelected = '';
                $scope.commentBeforeChange = '';
                comment.edit = false;
                $scope.selectCommentId = -1;

            }, function(error){
                swal('เกิดข้อผิดพลาด', 'ไม่สามารถแก้ไขข้อความได้', 'error');
                resetEditComment();
            });
        } else {
            $scope.commentSelected = '';
            $scope.commentBeforeChange = '';
            comment.edit = false;
            $scope.selectCommentId = -1;
        }
    };

    $scope.resetEditComment = function () {
        angular.copy($scope.commentBeforeChange, $scope.commentSelected);
        $scope.selectCommentId = -1;
    };

    streaming.on('report:comment:new', function (data) {
        console.log('got new comment', data);
        data = angular.fromJson(data);

        if ($scope.$parent.report) {
            if (data.reportId === $scope.$parent.report.id) {
                data.isNew = true;
                $scope.comments.push(data);
                $scope.$apply();
            }
        }
    });
});
