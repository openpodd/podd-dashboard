'use strict';

angular.module('poddDashboardApp')

.controller('CalendarModeCtrl', function (Menu) {
    Menu.setActiveMenu('calendar');
    $('#warning').hide();
    
    var img = new Image();
    img.onerror = function () {
       $('#warning').show();
    }
    img.src = "https://accounts.google.com/CheckCookie?continue=https%3A%2F%2Fwww.google.com%2Fintl%2Fen%2Fimages%2Flogos%2Faccounts_logo.png&followup=https%3A%2F%2Fwww.google.com%2Fintl%2Fen%2Fimages%2Flogos%2Faccounts_logo.png&chtml=LoginDoneHtml&checkedDomains=youtube&checkConnection=youtube%3A291%3A1";
    
});
