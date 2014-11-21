'use strict';

angular.module('poddDashboardApp')

.controller('NotificationsCtrl', function ($scope, Mentions, shared, streaming) {
    console.log('init notification ctrl');
    $scope.shared = shared;
    $scope.shared.unread = 0;
    function refreshNotifications() {
        $scope.unread = 0;
        Mentions.get().$promise.then(function (mentions) {
            $scope.notifications = [];
            mentions.forEach(function (item) {
                $scope.notifications.push(item);
                if(!item.isNotified) $scope.shared.unread++;
            });
        });
    }

    refreshNotifications();

    $scope.onClickNotification = function(mention){
        
        if(!mention.isNotified){
            var data = {
                mentionId: mention.id,
            };

            Mentions.seen(data).$promise.then(function () {
                mention.isNotified = true;
            });
            $scope.shared.unread--;
        }

        $scope.shared.reportWatchId = mention.reportId;
        shared.reportWatchId = mention.reportId;
    }


    streaming.on('mention:new', function (data) {
        console.log('got new notification', data, $.cookie('userid'));

        data = angular.fromJson(data);

        if (data.mentioneeId == $.cookie('userid')) {
            refreshNotifications()
        }
    });
});