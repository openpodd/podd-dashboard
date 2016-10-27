'use strict';

angular.module('poddDashboardApp')

.factory('ReportTypes', function ($resource) {
    var resource = $resource(config.API_BASEPATH + '/reportTypes/:id/?subscribes=True', {
      id: '@id'
    }, {
      'query': {
        isArray: true,
        cache: true
      }
    });
    return resource;
})

.factory('AdministrationArea', function ($resource) {
    var resource = $resource(config.API_BASEPATH + '/administrationArea/', {}, {
        contacts: {
            url: config.API_BASEPATH + '/administrationArea/contacts/',
            method: 'GET'
        },
        updateContacts: {
            url: config.API_BASEPATH + '/administrationArea/contacts/update/',
            method: 'POST'
        }
    });
    return resource;
})

.factory('ReportState', function ($resource) {
    return $resource(config.API_BASEPATH + '/reportStates/:id', {
        id: '@id'
    }, {
      'query': {
          isArray: true,
          cache: true
      }
    });
})

.factory('Authority', function ($resource) {
    return $resource(config.API_BASEPATH + '/authorities/:id', {
        id: '@id'
    }, {
        'query': {
            isArray: true,
            cache: true
        },
        'users': {
            url: config.API_BASEPATH + '/authorities/:id/users',
            method: 'POST',
        },
        'admins': {
            url: config.API_BASEPATH + '/authorities/:id/admins',
            method: 'POST',
        },
        'renewInvitationCode': {
            url: config.API_BASEPATH + '/authorities/:id/renew_invitation_code',
            method: 'POST'
        },
        'notificationTemplates': {
            url: config.API_BASEPATH + '/authorities/:id/notificationTemplates/enabled/?full=True',
            method: 'GET',
            isArray: true
        }
    });
})

.factory('AuthorityView', function ($resource) {
    return $resource(config.API_BASEPATH + '/authorities/?self=true', {}, {
        'list': {
            isArray: true,
        },
        'mine': {
            url: config.API_BASEPATH + '/authorities/?mine=true',
            method: 'GET',
            isArray: true,
        },
        'inviteList': {
            url: config.API_BASEPATH + '/authorities/?invite=true',
            method: 'GET',
            isArray: true,
        }
    });
})

.factory('ReportModal', function ($rootScope) {
    var modal;

    $rootScope.closeReportView = function () {
        $rootScope.willShowReportView = false;
        modal.trigger('hide:report');
    };

    function init() {
        if (!modal || !modal.length) {
            modal = angular.element('[report-view]');
        }
    }

    return {
        init: init,

        getElement: function getElement() {
            return modal;
        },
        show: function () {
            init();

            $rootScope.willShowReportView = true;
            modal.trigger('show:report');

            return this;
        },
        close: function () {
            init();

            $rootScope.willShowReportView = false;
            modal.trigger('hide:report');

            return this;
        },
        on: function () {
            modal.on.apply(modal, arguments);

            return this;
        }
    };
})

.factory('FailRequest', function ($resource) {
    return $resource(config.API_BASEPATH + '/failURL');
})

.factory('Reports', function ($resource) {
    var resource = $resource(config.API_BASEPATH + '/reports/:reportId', {
            reportId: '@id'
        }, {
            list: {
                method: 'GET',
                isArray: false
            },
            followUp: {
                url: config.API_BASEPATH + '/reports/:reportId/involved',
                method: 'GET',
                isArray: true
            },
            follow: {
                url: config.API_BASEPATH + '/reports/:reportId/follow',
                method: 'POST'
            },
            tags: {
                url: config.API_BASEPATH + '/reports/:reportId/tags',
                method: 'POST'
            },
            saveState: {
                url: config.API_BASEPATH + '/reports/:reportId/state',
                method: 'POST'
            },
            markAsTest: {
                url: config.API_BASEPATH + '/reports/:reportId/mark_to_test',
                method: 'POST'
            },
            markAsNotTest: {
                url: config.API_BASEPATH + '/reports/:reportId/mark_to_untest',
                method: 'POST'
            },
            statesLogs: {
                url: config.API_BASEPATH + '/reports/:reportId/states_logs',
                method: 'GET',
                isArray: true
            },
            plans: {
                url: config.API_BASEPATH + '/reports/:reportId/plans',
                method: 'GET',
                isArray: true
            },
            publish: {
                url: config.API_BASEPATH + '/reports/:reportId/publish',
                method: 'POST',
                isArray: false
            },
            unpublish: {
                url: config.API_BASEPATH + '/reports/:reportId/unpublish',
                method: 'POST',
                isArray: false
            }
        });

    return resource;
})

.factory('ReportTags', function ($resource) {
    return $resource(config.API_BASEPATH + '/reportTags/', {}, {
        post: {
            method: 'POST'
        }
    });
});
