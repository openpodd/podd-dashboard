"use strict";

angular
  .module("poddDashboardApp")

  .factory("LineGroupNotify", function ($resource, mockApiResponse) {
    return $resource(
      config.API_BASEPATH + "/lineMessageGroups/",
      { messageGroupId: "@id" },
      {
        list: {
          //   [
          //     {
          //         "id": 1,
          //         "invite_number": "9039443",
          //         "remark": null,
          //         "is_cancelled": false,
          //         "cancelled_at": null,
          //         "group_linked_at": null,
          //         "authority_id": 365
          //     }
          // ]
          method: "GET",
          isArray: true,
        },
        create: {
          // post nothing but {}
          method: "POST",
        },
        update: {
          // put only
          // {
          //    "id": 1,
          //    "is_cancelled": true,
          //    "remark": "remark...",
          // }
          url: config.API_BASEPATH + "/lineMessageGroups/:messageGroupId",
          method: "PUT",
        },
      }
    );
  });
