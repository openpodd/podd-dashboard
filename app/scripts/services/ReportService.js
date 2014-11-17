/*global $:true */
'use strict';

angular.module('poddDashboardApp')

.factory('ReportModal', function () {
    var modal;

    function init() {
        if (!modal || !modal.length) {
            modal = $('.report-modal');
            modal.modal({
                show: false,
                keyboard: true
            });
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
