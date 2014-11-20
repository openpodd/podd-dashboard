'use strict';

angular.module('poddDashboardApp')

.controller('NotificationsCtrl', function ($scope, Mentions, shared, streaming) {
    console.log('init notification ctrl');
    $scope.shared = shared;

    function refreshNotifications() {
        Mentions.get().$promise.then(function (mentions) {
            $scope.notifications = [];
            mentions.forEach(function (item) {
                $scope.notifications.push(item);
            });

        });
    }

    refreshNotifications();

    $scope.onClickNotifiction = function(mention){
        if(!mention.isNotified){
            var data = {
                mentionId: mention.id,
            };

            Mentions.seen(data).$promise.then(function () {
                mention.isNotified = true;
            });
        }

        $scope.shared.reportWatchId = mention.reportId;
        shared.reportWatchId = mention.reportId;

    }
});