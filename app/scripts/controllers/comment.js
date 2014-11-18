'use strict';

angular.module('poddDashboardApp')

.controller('CommentsCtrl', function ($scope, Comments, Users, $q) {

    function refreshComments() {
        $scope.comments = Comments.list({ reportId: $scope.$parent.report.id });
        $scope.listuser = Users.list();
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

            $scope.comments.push(newComment);
        });
    };

    $scope.searchUser = function(term) {
        var list = [];
        angular.forEach($scope.listuser, function(item) {
            if (item.username.toUpperCase().indexOf(term.toUpperCase()) >= 0) {
                list.push(item);
            }
        });
        $scope.users = list;
    };

    $scope.getUserText = function(item) {
        return '@' + item.username;
    };

    $scope.getUserTextRaw = function(item) {
        return '@' + item.username;
    };

});
