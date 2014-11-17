'use strict';

angular.module('poddDashboardApp')

.directive('showImageLoader', function () {
    return {
        restrict: 'A',
        scope: {
            onload: '=ngOnload',
        },
        link: function (scope, element, attrs) {
            var mask;
            if (attrs.mask) {
                mask = $(attrs.mask);
            }
            // auto-create mask div if not exists.
            if (!mask || mask.length === 0) {
                mask = $('<div>');
                $('body').append(mask);
            }
            mask.addClass('image-loader-mask');

            attrs.$observe('src', function () {
                mask.addClass('image-loader-progress');
                mask.parent().addClass('your-child-is-working');
            });

            element.bind('load', function () {
                mask.removeClass('image-loader-progress');
                mask.parent().removeClass('your-child-is-working');

                if ( $.isFunction(scope.onload) ) {
                    scope.onload.call();
                }
            });
        }
    };
});
