"use strict";

angular
  .module("poddDashboardApp")

  .factory("FormConfig", function ($resource) {
    return $resource(
      config.API_BASEPATH + "/civicletterconfig/",
      { code: "@code", id: "@id" },
      {
        query: {
          method: "GET",
          isArray: true,
        },
        create: {
          url: config.API_BASEPATH + "/civicletterconfig/",
          method: "POST",
        },
        update: {
          url: config.API_BASEPATH + "/civicletterconfig/:id/",
          method: "PUT",
        },
      }
    );
  });
