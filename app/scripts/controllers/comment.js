'use strict';

angular.module('poddDashboardApp')

.controller('CommentsCtrl', function ($scope, Comments, User, streaming) {

    console.log('init comment ctrl');

    function refreshComments() {
        $scope.comments = Comments.list({ reportId: $scope.$parent.report.id });
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
        var file_upload = $('.upload').val('').clone(true);
        $('.upload').replaceWith(file_upload);
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
            message: $scope.message.replace(/\@(\w+)/g, '@[$1]'),
            file: $scope.file,
        };

        $scope.loading = true;

        Comments.post(data).$promise.then(function () {
            reset();
        }, function(error){
            if(error.status == 400){
                swal({title: '',   text: error.data.detail,   type: 'error',   confirmButtonText: 'ตกลง' },
                    function(isConfirm){   
                        if(isConfirm) {     
                            $scope.submitting = false;
                            $scope.loading = false;   
                        } 
                    }
                );
            }
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

    $scope.file = '';

    $scope.onFileSelect = function($file) {
        $scope.file = $file;
        console.log('----------->', $scope.file)
    };

    $scope.clearFile = function() {
        clearFile();
    };

    streaming.on('report:comment:new', function (data) {
        console.log('got new comment', data);
        data = angular.fromJson(data);

        if($scope.$parent.report){
            if (data.reportId === $scope.$parent.report.id) {
                data.isNew = true;
                $scope.comments.push(data);
            }
        }
    });
});
