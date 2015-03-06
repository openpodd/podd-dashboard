'use strict';

angular.module('poddDashboardApp')

.factory('Menu', function (shared, storage) {
    return {
        setActiveMenu: function (name) {
            shared.activeMenuName = name;
        },

        isActiveMenu: function (name) {
            return shared.activeMenuName === name;
        },

        hasPermissionOnMenu: function (menu) {
            return storage.get('menuPermissions').indexOf(menu) >= 0;
        }
    };
});
