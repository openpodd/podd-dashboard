/*global moment:false */
'use strict';

/**
 * Try to quick fix library scripts here.
 */

if (moment) {
    // TODO: discuss library creator to have more options like abbreviation name
    // instead of short name.
    moment.defineLocale('th', {
        monthsShort : 'ม.ค._ก.พ._มี.ค._เม.ย._พ.ค._มิ.ย._ก.ค._ส.ค._ก.ย._ต.ค._พ.ย._ธ.ค.'.split('_'),
    });
}


$(document).ready(function () {
    $.fn.weekpicker.WeekPicker.prototype.format = function (date) {
        // Format a Date into a string as specified by RFC 3339.
        var month = (date.getMonth() + 1).toString(),
            dom = date.getDate().toString();
        if (month.length === 1) {
            month = '0' + month;
        }

        if (dom.length === 1) {
            dom = '0' + dom;
        }

        return dom + "/" + month + '/' + date.getFullYear().toString();
    }
});