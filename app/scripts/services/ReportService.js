/*global $:true */
'use strict';

angular.module('poddDashboardApp')

.factory('ReportType', function ($resource) {
    return $resource(config.API_BASEPATH + '/reportTypes/:id');
})

.factory('ReportModal', function () {
    var modal;

    function init() {
        if (!modal || !modal.length) {
            modal = $('.report-modal');
        }
    }

    return {
        init: init,

        getElement: function getElement() {
            return modal;
        },
        show: function (options) {
            init();

            options = options || {};

            setTimeout(function () {
                modal.modal('show');
            }, options.delay || 100);

            return this;
        },
        close: function () {
            modal.modal('hide');

            return this;
        },
        on: function () {
            modal.on.apply(modal, arguments);

            return this;
        }
    };
})

.factory('Reports', function ($resource) {
    var resource = $resource(config.API_BASEPATH + '/reports/:reportId', {}, {
        list: {
            method: 'GET',
            isArray: true
        }
    });

    return resource;
});
