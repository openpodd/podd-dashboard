'use strict';

angular.module('poddDashboardApp')

.controller('NotificationsCtrl', function ($scope, Mentions, shared, streaming) {
    console.log('init notification ctrl');
    $scope.shared = shared;
    $scope.unread = 0;
    function refreshNotifications() {
        $scope.unread = 0;
        Mentions.get().$promise.then(function (mentions) {
            $scope.notifications = [];
            mentions.forEach(function (item) {
                $scope.notifications.push(item);
                if(!item.isNotified) $scope.unread++;
            });
            checkunread();
        });
    }

    refreshNotifications();

    $scope.onClickNotification = function(mention){
        console.log('dddddddddd');
        if(!mention.isNotified){
            var data = {
                mentionId: mention.id,
            };

            Mentions.seen(data).$promise.then(function () {
                mention.isNotified = true;
            });
            $scope.unread--;
            checkunread();
        }

        $scope.shared.reportWatchId = mention.reportId;
        shared.reportWatchId = mention.reportId;

    }

   function checkunread(){
        console.log('---------------------',$scope.unread);
        if($scope.unread <= 0)
            $('.alert-dotted').addClass('hide');
        else 
            $('.alert-dotted').removeClass('hide');
    }

    streaming.on('mention:new', function (data) {
        console.log('got new notification', data, $.cookie('userid'));

        data = angular.fromJson(data);

        if (data.mentioneeId == $.cookie('userid')) {
            refreshNotifications()
        }
    });
});