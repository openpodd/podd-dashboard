'use strict';

angular.module('poddDashboardApp')

.factory('Menu', function (shared) {
    return {
        setActiveMenu: function (name) {
            shared.activeMenuName = name;
        },

        isActiveMenu: function (name) {
            return shared.activeMenuName === name;
        },

        hasPermissionOnMenu: function (menu) {
            return shared.menuPermissions && shared.menuPermissions.indexOf(menu) >= 0;
        }
    };
});
