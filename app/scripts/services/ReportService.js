/*global $:true */
'use strict';

angular.module('poddDashboardApp')

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
        show: function () {
            init();
            modal.modal('show');

            return this;
        },
        on: function () {
            modal.on.apply(modal, arguments);

            return this;
        }
    };
})

.factory('Reports', function ($resource) {
    var resource = $resource(config.host + '/reports/:reportId', {}, {
        list: {
            method: 'GET',
            isArray: true
        }
    });

    return resource;
});
