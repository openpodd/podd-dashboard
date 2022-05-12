"use strict";

angular
  .module("poddDashboardApp")

  .factory("FormConfig", function ($resource) {
    return $resource(
      config.API_BASEPATH + "/:code/config/letter/",
      { code: "@code", id: "@id" },
      {
        query: {
          method: "GET",
          isArray: true,
        },
        create: {
          url: config.API_BASEPATH + "/:code/config/letter/",
          method: "POST",
        },
        update: {
          url: config.API_BASEPATH + "/:code/config/letter/:id/",
          method: "PUT",
        },
      }
    );
  });
