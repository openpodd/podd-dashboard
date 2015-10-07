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
            var user = storage.get('user');
            return storage.get('menuPermissions').indexOf(menu) >= 0 ||
                   (user && (
                     user.isStaff ||
                     user.isSupervisor ||
                     user.authorityAdmins.length > 0)
                   );
        }
    };
});
