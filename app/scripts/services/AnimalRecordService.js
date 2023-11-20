"use strict";


angular.module("poddDashboardApp")
    .factory("AnimalRecordService", function ($resource) {
        return $resource(config.API_BASEPATH + "/animals/", {}, {
            export: {
                url: config.API_BASEPATH + "/animals/export/",
                method: "GET",
                responseType: "arraybuffer",
                transformResponse: function (data, headersGetter) {
                    return { data: data };
                },
            }
        });
    });