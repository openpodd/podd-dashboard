"use strict";

angular.module("poddDashboardApp").factory("NcdService", function ($resource) {
  return $resource(
    config.NCD_API_BASEPATH + "/ncd/",
    {},
    {
      exportAll: {
        url: config.NCD_API_BASEPATH + "/ncd/export_all/",
        method: "GET",
        responseType: "arraybuffer",
        transformResponse: function (data, headersGetter) {
          return { data: data };
        },
      },
      exportHealth: {
        url: config.NCD_API_BASEPATH + "/ncd/export_health/",
        method: "GET",
        responseType: "arraybuffer",
        transformResponse: function (data, headersGetter) {
          return { data: data };
        },
      },
      exportNcd: {
        url: config.NCD_API_BASEPATH + "/ncd/export_ncd/",
        method: "GET",
        responseType: "arraybuffer",
        transformResponse: function (data, headersGetter) {
          return { data: data };
        },
      },
    }
  );
});
