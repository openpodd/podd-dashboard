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

.factory('uiGridUtils', function (uiGridExporterService, uiGridExporterConstants) {
    /* global utils */
    var exporter = uiGridExporterService,
        all = uiGridExporterConstants.ALL;

    return {
        exportCsv: function (grid, filename) {
            var exportData = exporter.getData(grid, all, all),
                csvContent = exporter.getCsv(
                    grid.options.columnDefs,
                    exportData,
                    grid.options.exporterCsvColumnSeparator
                );
            // console.log(grid.options.columnDefs);
            utils.downloadFile(filename, csvContent, 'text/csv;charset=utf-8');
        },
        exportXlsx: function (grid, filename) {
            var exportData = exporter.getData(grid, all, all),
                xlsxContent = exporter.getXlsx(grid.options.columnDefs, exportData);

            utils.downloadFile(filename, xlsxContent, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        }
    };
})

.run(function (uiGridExporterService, $filter) {
    /* global XLSX */

    function applyFilters(filters, field, fieldFormatter) {
        var value = field.value;
        fieldFormatter = fieldFormatter || uiGridExporterService.formatFieldAsCsv;

        if (angular.isFunction(filters)) {
            return fieldFormatter({ value: filters(value) });
        }
        filters = filters.replace(/[\"\']+/g, '');
        var result = null;
        var filterList = filters.split('|');

        for (var filter in filterList) {
            var functionSplit = null;

            functionSplit = filterList[filter].split(':');
            var filterFunction = $filter(functionSplit[0].replace(/\s+/g, ''));

            if (typeof(filterFunction) === 'function') {
                result = filterFunction(value, functionSplit[1]).toString();
                value = result;
            }
        }

        return fieldFormatter({ value: result });
    }

    /* @return formatted string */
    function formatCell(columnDefs, fieldFormatter) {
        fieldFormatter = fieldFormatter || uiGridExporterService.formatFieldAsCsv;

        return function (column, index) {
            if (columnDefs[index].exportFilter) {
                return applyFilters(columnDefs[index].exportFilter, column, fieldFormatter);
            }
            else if (columnDefs[index].cellFilter) {
                return applyFilters(columnDefs[index].cellFilter, column, fieldFormatter);
            }
            else {
                return fieldFormatter(column);
            }
        };
    }
    // Inject new method for uiGridExporterService
    uiGridExporterService.getCsv = function (columnDefs, exportData, separator) {
        var csv = columnDefs.map(function (header) {
            var field = header.name || header.field;
            // return self.formatFieldAsCsv(field);
            return field;
        }).join(separator) + '\n';

        // console.log(csv);

        csv += exportData.map(function (row) {
            return row.map( formatCell(columnDefs) ).join(separator);
        }).join('\n');

        return csv;
    };

    // @see: http://sheetjs.com/demos/writexlsx.html
    function xlsxFieldFormatter (field) {
        if (field.value === null) { // we want to catch anything null-ish, hence just == not ===
            return '';
        }
        if (typeof(field.value) === 'number') {
            return field.value;
        }
        if (typeof(field.value) === 'boolean') {
            return (field.value ? 'TRUE' : 'FALSE');
        }
        if (typeof(field.value) === 'string') {
            return field.value.replace(/"/g,'""');
        }

        return JSON.stringify(field.value);
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

                if (typeof cell.v === 'object') {
                    if('value' in cell.v) {
                        cell.v = cell.v.value;
                    } else {
                        continue;
                    }
                }

                if (cell.v === null) {
                    continue;
                }

                if(Object.prototype.toString.call(cell.v) === '[object Array]') {
                    cell.v = cell.v.toString();
                }

                var cell_ref = XLSX.utils.encode_cell({ c: C, r: R });

                if (R > 0) {
                    cell.w = formatCell(columnDefs, xlsxFieldFormatter)(cell.v, C);
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

.directive('affix', function ($rootScope, $timeout, $window) {

    function _updateWidth($element) {
        // dynamically set width.
        var $parent = $element.parent();
        $element.width($parent.width());
    }

    return {
        strict: 'A',
        link: function ($scope, $element, $attrs) {
            function applyAffix() {
                $timeout(function () {
                    $element.affix({
                        top: $attrs.offsetTop,
                        bottom: $attrs.offsetBottom,
                        target: $attrs.target
                    });

                    _updateWidth($element);
                });
            }

            $rootScope.$on('$stateChangeSuccess', function () {
                $element.removeData('bs.affix').removeClass('affix affix-top affix-bottom');
                applyAffix();
            });

            // Update width on window dimension changed.
            $(window).resize(function () {
                _updateWidth($element);
            });

            applyAffix();
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
            isOffsetBottom = false,
            windowHeight = $($window).height(),
            elemTop = $element.offset().top;

        if (angular.isString(value) && value.indexOf('%')) {
            isPercent = true;
        }
        // support offset bottom.
        if (angular.isString(value) && value[0] == '-') {
            isOffsetBottom = true;
        }
        value = Math.abs(parseFloat(value));

        if (isPercent && !isOffsetBottom) {
            $element.css('max-height', '' + ( windowHeight * (value/100.0) ) + 'px' );
        }
        else if (isOffsetBottom) {
            $element.css('max-height', '' + ( windowHeight - elemTop - value ) + 'px');
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

.filter('default', function () {
    return function (text, defaultValue) {
        return text || defaultValue;
    };
})

.filter('slug', function () {
    return function (text) {
        var _text = text;
        _text = _text.replace(/\s/g, '-');
        _text = _text.toLowerCase();

        return _text;
    };
})

.filter('renderMention', function () {
    return function (text) {
        return text.replace(/\@\[([\w\-\.]+)\]/g, '<span class="label label-info">@$1</span>');
    };
})

.filter('renderTelephone', function () {
    return function (text) {
        return text.replace(/\@\[tel:(.*?)\]/g, '<span class="label label-telephone">tel:$1</span>');
    };
})

.filter('renderEmail', function () {
    return function (text) {
        return text.replace(/\@\[email:([\w\-\.\@]+)\]/g, '<span class="label label-email">$1</span>');
    };
})

.filter('renderLine', function () {
    return function (text) {
        return text.replace(/\@\[line:(.+)\]/g, '<span class="label label-email">Line: $1</span>');
    };
})

.filter('renderTag', function () {
    return function (text) {
        return text.replace(/\[tag:([^\]]+)\]/g, '<span class="label label-tag">$1</span>');
    };
})

.filter('renderReportTag', function ($state) {
    return function (text) {
        var href = '#/reports/$1';

        var regexp = /\#(\d+)/;
        var reportId = null;
        if (!regexp.test(text)) {
          return text;
        }
        else {
          reportId = regexp.exec(text)[1];
        }

        if ($state.is('home')) {
            href = $state.href('home', { reportId: reportId });
        }

        return text.replace(/\#(\d+)/g, '<a class="label label-report" href="' + href + '">#$1</a>');
    };
})

.filter('renderPlanReportTag', function () {
    return function (text) {
        return text.replace(/\[plan-report:(\d+)\]/g, '<span class="label label-plan-report" data-plan-report-id="$1" data="xx$1">Plan: $1</span>');
    };
})

.filter('renderTemplate', function () {
    return function (text) {
        if (typeof(text) === 'undefined') return '';
        return text.replace(/\@\[template:([\w\-\.\@]+)\]/g, '<span class="label label-info">ใช้การแจ้งเตือนร่วมกับรหัส #$1</span>');
    };
})

.filter('renderContact', function () {
    return function (text) {
        return text.replace(/\@\[([\w\-\.\@\:]+)\]/g, '<span class="label label-info">ใช้การแจ้งเตือนร่วมกับรหัส #$1</span>');
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
