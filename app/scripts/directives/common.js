'use strict';

angular.module('poddDashboardApp')

.filter('encodeURI', function ($window) {
    return function (text) {
        return $window.encodeURIComponent(text);
    };
})

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

            attrs.$observe('src', function (newValue) {
                console.log('---------------- src', newValue);
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

.directive('setMaxHeight', function ($window) {
    function setMaxHeight($element, value) {
        var isPercent = false,
            windowHeight = $($window).height(),
            elemTop = $element.offset().top;

        if (angular.isString(value) && value.indexOf('%')) {
            isPercent = true;
        }
        value = parseFloat(value);

        if (isPercent) {
            $element.css('max-height', '' + ( windowHeight * (value/100.0) ) + 'px' );
        }
        else {
            $element.css('max-height', '' + ( windowHeight - value - elemTop ) + 'px');
        }
    }

    return {
        strict: 'A',
        scope: {
            value: '=setMaxHeight',
            triggerEvent: '='
        },
        link: function (scope, element) {
            $($window).on('resize', function () {
                setMaxHeight(element, scope.value);
            }).trigger('resize');

            // Additional trigger to force resize.
            $($window).on(scope.triggerEvent, function () {
                setMaxHeight(element, scope.value);
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
})

.directive('mention', function (User) {
    return {
        strict: 'A',
        scope: {
            user: '=mentionUser'
        },
        link: function (scope, element) {
            element.atwho({
                at: '@',
                tpl: '<li class="list-group-item" data-value="@${username}">' +
                     ' <span class="text-primary">${username}</span>' +
                     ' <em class="text-muted">${fullName}</em>' +
                     '</li>',
                callbacks: {
                    remote_filter: function (query, callback) {
                        User.search({ username: query }).$promise.then(function (data) {
                            callback(data);
                        });
                    }
                },
                data: [],
                search_key: 'username'
            });
        }
    };
});
