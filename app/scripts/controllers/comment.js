'use strict';

angular.module('poddDashboardApp')

.controller('CommentsCtrl', function ($scope, Comments, User, streaming) {

    console.log('init comment ctrl');

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
            message: $scope.message.replace(/\@(\w+)/g, '@[$1]')
        };

        Comments.post(data).$promise.then(function (newComment) {
            reset();
        });
    };


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

    streaming.on('report:comment:new', function (data) {
        console.log('got new comment', data);

        data = angular.fromJson(data);

        if (data.reportId === $scope.$parent.report.id) {
            $scope.comments.push(data);
        }
    });
});
