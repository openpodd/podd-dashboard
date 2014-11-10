'use strict';

angular.module('poddDashboardApp')

.factory('ReportModal', function () {
    var modal, slide, slick;

    function init() {
        if (!modal || !modal.length) {
            modal = $('.report-modal');
            slide = $('.report-images', modal);
            slick = slide.slick();
        }
    }

    return {
        init: init,

        getElement: function getElement() {
            return modal;
        },
        clearImages: function clearImages() {
            init();
            slide.html('');

            return this;
        },
        setImages: function setImages(images) {
            this.clearImages();

            images.forEach(function (image) {
                slide.append('<div><img src="' + image.imageUrl + '" /></div>');
            });

            slick.unslick();
            slick.getSlick().refresh();
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
    var resource = $resource('/api/reports.json/:reportId', {}, {
        list: {
            method: 'GET',
            isArray: true
        },
        get: {
            url: '/api/reports/:reportId.json'
        }
    });

    return resource;
});
