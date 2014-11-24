'use strict';

angular.module('poddDashboardApp')

.controller('NotificationsCtrl', function ($scope, Mentions, shared, streaming) {
    console.log('init notification ctrl');
    $scope.shared = shared;
    $scope.unread = 0;

    $scope.notifications = [];

    function refreshNotifications() {
        $scope.unread = 0;

        Mentions.get().$promise.then(function (mentions) {
            var tmp = [];

            mentions.forEach(function (item) {
               tmp.push(item);
               if ( ! item.isNotified ) {
                  $scope.unread++;
               }
            });

            $scope.notifications = tmp;
        });
    }

    refreshNotifications();

    $scope.$watch('shared.loggedIn', function (newValue) {
        if (newValue) {
            refreshNotifications();
        }
        else {
            $scope.notification = [];
        }
    });

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
    };

    streaming.on('mention:new', function (data) {
        console.log('got new notification', data, $.cookie('userid'));

        data = angular.fromJson(data);

        if (data.mentioneeId === $.cookie('userid')) {
            refreshNotifications();
        }
    });
});
