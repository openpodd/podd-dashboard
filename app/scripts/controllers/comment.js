'use strict';

angular.module('poddDashboardApp')

.controller('CommentsCtrl', function ($scope, Comments, Flags, User, streaming, FailRequest, shared) {

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
        if (shared.rcError) searcher = FailRequest.query;

        $scope.comments = Comments.list({ reportId: $scope.$parent.report.id });

        $scope.comments.$promise
            .catch(function () {
                $scope.loadingReportCommentsError = true;
            })
            .finally(function () {
                $scope.loadingReportComments = false;
            });
    }

    function refreshFlag() {
        $scope.reportFlag = Flags.list({ reportId: $scope.$parent.report.id, amount:1 }).$promise.then(function (flags) {
            var tmp = [];

            flags.forEach(function (item) {
               tmp.push(item);
            });

            if(tmp[0]){
                $scope.flag = $scope.options[tmp[0].priority];
            }else{
                $scope.flag = '';
            }
        });

    }

    $scope.loading = false;
    $scope.options = [{ name: 'Green', id: 0 }, { name: 'Yellow', id: 1 }, { name: 'Red', id: 2 }];

    function reset() {
        $scope.message = '';
        $scope.submitting = false;
        $scope.loading = false;
        clearFile();
    }

    function clearFile(){
        $scope.file = '';
        var fileUpload = $('.upload').val('').clone(true);
        $('.upload').replaceWith(fileUpload);
    }

    $scope.$watch('$parent.report', function (newValue) {
        if (newValue) {
            refreshComments();
            refreshFlag();
        }
    });

    reset();

    $scope.postComment = function () {
        $scope.submitting = true;

        if($scope.file[0] && $scope.file[0].size > 10485760){
            callError('ไม่สามารถอัพโหลดไฟล์ที่มีขนาดของไฟล์มากกว่า 10MB');
            return;
        }

        var data = {
            reportId: $scope.$parent.report.id,
            message: $scope.message.replace(/\@(\w+)/g, '@[$1]'),
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

    // $scope.flag = $scope.options[0];

    $scope.updateFlag = function() {
       $scope.submitting = true;

       var data = {
            reportId: $scope.$parent.report.id,
            priority: $scope.flag.id,
        };

        $scope.loading = true;

        Flags.post(data).$promise.then(function () {
            $scope.submitting = false;
            $scope.loading = false;
        });
    };

    $scope.file = '';

    $scope.onFileSelect = function($file) {
        $scope.file = $file;
    };

    $scope.clearFile = function() {
        clearFile();
    };

    streaming.on('report:comment:new', function (data) {
        console.log('got new comment', data);
        data = angular.fromJson(data);

        if ($scope.$parent.report) {
            if (data.reportId === $scope.$parent.report.id) {
                data.isNew = true;
                $scope.comments.push(data);
            }
        }
    });
});
