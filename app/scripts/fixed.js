/*global moment:false */
'use strict';

// Production steps of ECMA-262, Edition 5, 15.4.4.17
// Reference: http://es5.github.io/#x15.4.4.17
if (!Array.prototype.some) {
  Array.prototype.some = function(fun /*, thisArg*/) {
    if (this === null) {
      throw new TypeError('Array.prototype.some called on null or undefined');
    }

    if (typeof fun !== 'function') {
      throw new TypeError();
    }

    var t = Object(this);
    var len = t.length || 0;

    var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
    for (var i = 0; i < len; i++) {
      if (i in t && fun.call(thisArg, t[i], i, t)) {
        return true;
      }
    }

    return false;
  };
}

function encodeUriQuery(val, pctEncodeSpaces) {
  return encodeURIComponent(val).
  replace(/%40/gi, '@').
  replace(/%3A/gi, ':').
  replace(/%24/g, '$').
  replace(/%2C/gi, ',').
  replace(/%3B/gi, ';').
  replace(/%20/g, (pctEncodeSpaces ? '%20' : '+'));
}

function toKeyValue(obj) {
  var parts = [];
  jQuery.each(obj, function(key, value) {
    if (Array.isArray(value)) {
      forEach(value, function(arrayValue) {
        parts.push(encodeUriQuery(key, true) +
          (arrayValue === true ? '' : '=' + encodeUriQuery(arrayValue, true)));
      });
    } else {
      parts.push(encodeUriQuery(key, true) +
        (value === true ? '' : '=' + encodeUriQuery(value, true)));
    }
  });
  return parts.length ? parts.join('&') : '';
}

/**
 * Try to quick fix library scripts here.
 */

if (moment) {
    // TODO: discuss library creator to have more options like abbreviation name
    // instead of short name.
    moment.defineLocale('th', {
        monthsShort : 'ม.ค._ก.พ._มี.ค._เม.ย._พ.ค._มิ.ย._ก.ค._ส.ค._ก.ย._ต.ค._พ.ย._ธ.ค.'.split('_'),
        calendar: {
          sameElse: 'DD/MM/YYYY HH:mm'
        }
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

        return dom + '/' + month + '/' + date.getFullYear().toString();
    };
});
