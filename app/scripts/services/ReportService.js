'use strict';

angular.module('poddDashboardApp')

.factory('ReportTypes', function ($resource) {
    var resource = $resource(config.API_BASEPATH + '/reportTypes/:id', {
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
        get: {
            isArray: true
        },
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
