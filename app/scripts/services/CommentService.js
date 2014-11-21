'use strict';

angular.module('poddDashboardApp')

.factory('Comments', function ($resource) {
    return $resource(config.API_BASEPATH + '/reportComments/', {}, {
        list: {
            method: 'GET',
            isArray: true
        },
        post: {
            method: 'POST',
            headers: {'Content-Type': undefined},
            transformRequest: function(data) {
                var form_data = new FormData();
                angular.forEach(data, function(value, key) {
                    if(key == 'file') {
                        if(data.file)
                            form_data.append(key, data.file[0], data.file[0].name);
                    }else{
                        form_data.append(key, value);
                    }
                    console.log(key, value);
                });
                return form_data;
            },
        }
    });
});
