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
})

.directive('blink', function ($timeout) {
    return {
        strict: 'A',
        scope: {
            blink: '='
        },
        link: function (scope, element/*, attr*/) {
            scope.$watch('blink', function (newValue) {
                if (newValue) {
                    element.addClass('blink');

                    $timeout(function () {
                        element.removeClass('blink');
                    }, 1000);
                }
            });
        }
    };
})

.filter('renderMention', function () {
    return function (text) {
        return text.replace(/\@\[(\w+)\]/g, '<span class="label label-info">@$1</span>');
    };
})

.directive('loaderSpinner', function () {
    return {
        strict: 'A',
        template: '<div class="loader spinner">' +
                     '<div class="bounce1"></div>' +
                     '<div class="bounce2"></div>' +
                     '<div class="bounce3"></div>' +
                  '</div>'
    };
});
