'use strict';

angular.module('poddDashboardApp')

.factory('ReportModal', function () {
    var modal, slide, slick;

    function init() {
        if (!modal || !modal.length) {
            modal = $('.report-modal');
            slide = $('.report-images', modal);
            slick = slide.slick({ fade: true });
        }
    }

    return {
        init: init,

        getElement: function getElement() {
            return modal;
        },
        clearImages: function clearImages() {
            init();

            $('.slick-slide', slide).each(function (index, item) {
                slick.slickRemove($(this).attr('index'));
            });

            return this;
        },
        setImages: function setImages(images) {
            this.clearImages();

            images.forEach(function (image) {
                slick.slickAdd('<div><img src="' + image.imageUrl + '" /></div>');
            });

            return this;
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
