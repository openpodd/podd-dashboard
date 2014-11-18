'use strict';

angular.module('poddDashboardApp')

.controller('CommentsCtrl', function ($scope, Comments, streaming) {

    function refreshComments() {
        $scope.comments = Comments.list({ reportId: $scope.$parent.report.id });
    }

    function reset() {
        $scope.message = '';
        $scope.submitting = false;
    }

    $scope.$watch('$parent.report', function (newValue) {
        if (newValue) {
            refreshComments();
        }
    });

    reset();

    $scope.comment = function () {
        $scope.submitting = true;

        var data = {
            reportId: $scope.$parent.report.id,
            message: $scope.message
        };

        Comments.post(data).$promise.then(function (newComment) {
            reset();
        });
    };

    streaming.on('report:comment:new', function (data) {
        console.log('got new comment', data);

        data = angular.fromJson(data);

        if (data.reportId === $scope.$parent.report.id) {
            $scope.comments.push(data);
        }
    });
});
