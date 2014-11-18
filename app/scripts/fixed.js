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
