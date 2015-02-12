'use strict';

window.utils = window.utils || {
    sum: function sum(array, propertyName) {
        return array.reduce(function (prev, current) {
            return prev + current[propertyName];
        }, 0);
    },
    max: function max(array, propertyName) {
        var maxIndex = 0,
        maxValue = 0;

        array.forEach(function (item, index) {
            if (item[propertyName] > maxValue) {
                maxIndex = index;
            }
        });

        return array[maxIndex];
    },
    padLeft: function padLeft(text, desiredLength, padChar) {
        var newText = '' + text;

        padChar = padChar || '0';

        return (function doPad() {
            return ({
                true: function () {
                    newText = padChar + newText;
                    return doPad();
                },
                false: function () {
                    return newText;
                }
            }[newText.length < desiredLength])();
        })();
    },
    random: function random(min, max) {
        return Math.random() * (max - min) + min;
    },
    getObjectLength: function (obj) {
        var i, count = 0;
        for (i in obj) {
            if (obj.hasOwnProperty(i)) {
                count++;
            }
        }
        return count;
    },
    queryStringToJSON: function (string) {
        var pairs = string.slice(1).split('&');

        var result = {};
        pairs.forEach(function(pair) {
            pair = pair.split('=');
            result[pair[0]] = decodeURIComponent(pair[1] || '');
        });
        return JSON.parse(JSON.stringify(result));
    },
    downloadFile: function downloadFile(fileName, content, mimeType) {
        var D = document;
        var a = D.createElement('a');
        var strMimeType = mimeType;
        var rawFile;

        // IE10+
        if (navigator.msSaveBlob) {
            return navigator.msSaveBlob(new Blob(['\ufeff', content], {
                type: strMimeType
            }), fileName);
        }

        //html5 A[download]
        if ('download' in a) {
            var blob = new Blob([content], {
                type: strMimeType
            });
            rawFile = URL.createObjectURL(blob);
            a.setAttribute('download', fileName);
        } else {
            rawFile = 'data:' + strMimeType + ',' + encodeURIComponent(content);
            a.setAttribute('target', '_blank');
        }

        a.href = rawFile;
        a.setAttribute('style', 'display:none;');
        D.body.appendChild(a);
        setTimeout(function() {
            if (a.click) {
                a.click();
              // Workaround for Safari 5
            } else if (document.createEvent) {
                var eventObj = document.createEvent('MouseEvents');
                eventObj.initEvent('click', true, true);
                a.dispatchEvent(eventObj);
            }
            D.body.removeChild(a);

        }, 100);
    }
};

angular.module('poddDashboardApp')

.run(function (uiGridExporterService, $filter) {
    /* global XLSX */

    function applyFilters(filters, value, fieldFormatter) {
        fieldFormatter = fieldFormatter || uiGridExporterService.formatFieldAsCsv;

        if (angular.isFunction(filters)) {
            return fieldFormatter(filters(value));
        }
        filters = filters.replace(/[\"\']+/g, '');
        var result = null;
        var filterList = filters.split('|') ? filters.split('|') : filters;

        for (var filter in filterList) {
            var functionSplit = null;

            functionSplit = filterList[filter].split(':');
            var filterFunction = $filter(functionSplit[0].replace(/\s+/g, ''));

            if (typeof(filterFunction) === 'function') {
                result = filterFunction(value, functionSplit[1]).toString();
                value = result;
            }
        }

        return fieldFormatter(result);
    }

    /* @return formatted string */
    function formatCell(columnDefs, fieldFormatter) {
        fieldFormatter = fieldFormatter || uiGridExporterService.formatFieldAsCsv;

        return function (columnValue, index) {
            if (columnDefs[index].exportFilter) {
                return applyFilters(columnDefs[index].exportFilter, columnValue, fieldFormatter);
            }
            else if (columnDefs[index].cellFilter) {
                return applyFilters(columnDefs[index].cellFilter, columnValue, fieldFormatter);
            }
            else {
                return fieldFormatter(columnValue);
            }
        };
    }
    // Inject new method for uiGridExporterService
    uiGridExporterService.getCsv = function (columnDefs, exportData, separator) {
        var self = this;

        var csv = columnDefs.map(function (header) {
            return self.formatFieldAsCsv(header.name || header.field);
        }).join(separator) + '\n';

        csv += exportData.map(function (row) {
            return row.map( formatCell(columnDefs) ).join(separator);
        }).join('\n');

        return csv;
    };

    // @see: http://sheetjs.com/demos/writexlsx.html
    function xlsxFieldFormatter (field) {
        if (field === null) { // we want to catch anything null-ish, hence just == not ===
            return '';
        }
        if (typeof(field) === 'number') {
            return field;
        }
        if (typeof(field) === 'boolean') {
            return (field ? 'TRUE' : 'FALSE');
        }
        if (typeof(field) === 'string') {
            return field.replace(/"/g,'""');
        }

        return JSON.stringify(field);
    }

    function getSheetFromData(columnDefs, exportData) {
        /* jshint camelcase:false */
        var ws = {};
        var range = {
            s: { c: 10000000, r: 10000000 },
            e: { c: 0, r:0 }
        };

        var headers = columnDefs.map(function (header) {
            return header.name || header.field;
        });
        var data = [].concat([ headers ], exportData);

        for (var R = 0; R !== data.length; ++R) {
            for (var C = 0; C !== data[R].length; ++C) {
                if (range.s.r > R) { range.s.r = R; }
                if (range.s.c > C) { range.s.c = C; }
                if (range.e.r < R) { range.e.r = R; }
                if (range.e.c < C) { range.e.c = C; }

                var cell = { v: data[R][C] };
                if (cell.v === null) {
                    continue;
                }
                var cell_ref = XLSX.utils.encode_cell({ c: C, r: R });

                if (R > 0) {
                    cell.v = formatCell(columnDefs, xlsxFieldFormatter)(cell.v, C);
                }

                if (typeof cell.v === 'number') {
                    cell.t = 'n';
                }
                else if (typeof cell.v === 'boolean') {
                    cell.t = 'b';
                }
                else if (cell.v instanceof Date) {
                    cell.t = 'n'; cell.z = XLSX.SSF._table[14];
                }
                else {
                    cell.t = 's';
                }

                ws[cell_ref] = cell;
            }
        }

        if (range.s.c < 10000000) {
            ws['!ref'] = XLSX.utils.encode_range(range);
        }

        return ws;
    }

    function Workbook() {
        if (!(this instanceof Workbook)) {
            return new Workbook();
        }
        this.SheetNames = [];
        this.Sheets = {};
    }

    function s2ab(s) {
        /* jshint bitwise:false */
        var buf = new ArrayBuffer(s.length);
        var view = new Uint8Array(buf);

        for (var i=0; i !== s.length; ++i) {
            view[i] = s.charCodeAt(i) & 0xFF;
        }
        return buf;
    }

    uiGridExporterService.getXlsx = function (columnDefs, exportData) {
        var wb = new Workbook(),
            ws = getSheetFromData(columnDefs, exportData),
            wsName = 'Sheet1';

        wb.SheetNames.push(wsName);
        wb.Sheets[wsName] = ws;

        return s2ab(XLSX.write(wb, { bookType: 'xlsx', bookSST: true, type: 'binary' }));
    };
})

.filter('encodeURI', function ($window) {
    return function (text) {
        return $window.encodeURIComponent(text);
    };
})

.filter('fullname', function () {
    return function (user, defaultName) {
        if (user.firstName || user.lastName) {
            return [user.firstName, user.lastName]
             .filter(function (item) { return item ? item : false; })
             .join(' ');
        }
        else {
            return defaultName;
        }
    };
})

.filter('avatarUrl', function () {
    return function (user, size) {
        if (size === 'thumbnail') {
            return user.thumbnailAvatarUrl;
        }
        else {
            return user.avatarUrl;
        }
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
                    'remote_filter': function (query, callback) {
                        User.search({ username: query }).$promise.then(function (data) {
                            callback(data);
                        });
                    }
                },
                data: [],
                'search_key': 'username'
            });
        }
    };
})

.directive('countUp', function ($timeout) {
    /* global countUp */
    return {
        strict: 'A',
        scope: {
            countFrom: '=countFrom',
            countTo: '=countTo',
            duration: '=duration',
            options: '=options'
        },
        link: function (scope, element) {
            var counterInstance = new countUp(element[0]);

            var updateProperties = (function () {
                var timer,
                    processing = false;

                return function updateProperties() {
                    if (processing) {
                        clearTimeout(timer);
                    }
                    processing = true;

                    timer = $timeout(function () {
                        counterInstance.reset();

                        counterInstance.startVal = scope.countFrom || 0;
                        counterInstance.endVal = scope.countTo;
                        counterInstance.duration = scope.duration || 1000;
                        counterInstance.options = angular.extend({
                            useEasing : true,
                            useGrouping : true,
                            separator : ',',
                            decimal : '.',
                            prefix : '',
                            suffix : ''
                        }, scope.options);

                        counterInstance.start();
                    }, 10); // give another 10ms chance
                };
            })();

            // Initialize once.
            updateProperties();

            // Then watch.
            scope.$watch('countFrom', function () {
                updateProperties();
            });
            scope.$watch('countTo', function () {
                updateProperties();
            });
            scope.$watch('duration', function () {
                updateProperties();
            });
            scope.$watch('options', function () {
                updateProperties();
            });
        }
    };
});
