/*global L, swal */
"use strict";

angular
  .module("poddDashboardApp")

  .config(function (LightboxProvider) {
    // set a custom template
    LightboxProvider.templateUrl = "/views/lightbox.html";

    LightboxProvider.getImageUrl = function (image) {
      return image.imageUrl;
    };

    LightboxProvider.getImageCaption = function (image) {
      return image.note;
    };
  })

  .controller(
    "ReportViewCtrl",
    function (
      $scope,
      streaming,
      Flags,
      Lightbox,
      $modal,
      Search,
      Reports,
      ReportState,
      $state,
      Tag,
      PlanReport,
      storage,
      shared,
      $timeout
    ) {
      $scope.userAlreadyClickImage = false;
      $scope.reportFlag = {};
      $scope.modes = {
        accomplishmentEdit: false,
      };
      $scope.accomplishment = {};

      $scope.reportStateName = ReportState.translateReportStateName;

      function reloadReportStatesLogs() {
        if ($scope.report) {
          if ($scope.report.$promise) {
            $scope.report.$promise.then(function () {
              $scope.reportStatesLogs = Reports.statesLogs({
                reportId: $scope.report.id,
              });
            });
          } else {
            $scope.reportStatesLogs = Reports.statesLogs({
              reportId: $scope.report.id,
            });
          }
        }
      }

      function reloadReportAccomplishment() {
        if ($scope.report) {
          if ($scope.report.$promise) {
            $scope.report.$promise.then(function () {
              $scope.accomplishment = Reports.getAccomplishment({
                reportId: $scope.report.id,
              });
            });
          } else {
            $scope.accomplishment = Reports.getAccomplishment({
              reportId: $scope.report.id,
            });
          }
        }
      }

      $scope.report = $scope.$parent.report;
      $scope.$watch("$parent.report", function (newValue) {
        $scope.report = newValue;
        if (newValue) {
          reloadReportStatesLogs();
          loadPlanReport();
          reloadReportAccomplishment();

          $timeout(function () {
            addMarker($scope.report);
          }, 0);
        }

        if (newValue) {
          $scope.userAlreadyClickImage = false;
          $scope.activeImage = null;
          console.log("report.change");

          $scope.tags = $scope.report.tags;
        }
      });

      $scope.clickThumbnail = function (image) {
        $scope.userAlreadyClickImage = true;
        $scope.viewReportImage(image);
      };

      $scope.setActiveImage = function (image) {
        $scope.activeImage = image;
      };

      $scope.isActiveImage = function (image) {
        return $scope.activeImage === image;
      };

      $scope.viewReportImage = function (image) {
        var index = 0,
          images = $scope.$parent.report.images;

        images.some(function (item, i) {
          if (item === image) {
            index = i;
            return true;
          }
        });

        Lightbox.openModal($scope.$parent.report.images, index);
      };

      streaming.on("report:image:new", function (data) {
        console.log("got new report image", data);

        data = angular.fromJson(data);

        if ($scope.$parent.report && data.report === $scope.$parent.report.id) {
          $scope.$parent.report.images.splice(0, 0, data);

          // set as active image if this is the first one, or user has not
          // intentionally click the thumbnail to view image. This will show
          // new image as streaming.
          if (
            !$scope.userAlreadyClickImage ||
            $scope.$parent.report.images.length === 1
          ) {
            $scope.setActiveImage(data);
          }
        }
      });

      $scope.tags = [];
      $scope.loadTags = function (query) {
        return Tag.get({ q: query }).$promise.then(function (data) {
          var results = [];
          data.forEach(function (item) {
            results.push({ text: item.name });
          });
          return results;
        });
      };

      $scope.tagsChanged = false;
      $scope.updateTags = function () {
        $scope.tagsChanged = true;
      };

      $scope.saveTags = function () {
        Reports.tags(
          { reportId: $scope.report.id },
          {
            tags: $scope.tags,
          }
        )
          .$promise.then(function () {
            swal({
              title: "",
              type: "success",
              text: "บันทึกเรียบร้อยแล้ว",
              confirmButtonText: "ตกลง",
              confirmButtonClass: "btn-success",
            });
            $scope.tagsChanged = false;
          })
          .catch(function (err) {
            $scope.showWarning(err);
          });
      };

      $scope.saveAccomplishment = function () {
        if (
          $scope.accomplishment.publicShowcase === null ||
          typeof $scope.accomplishment.publicShowcase === "undefined"
        ) {
          $scope.accomplishment.publicShowcase = false;
        }
        $scope.accomplishment = $scope.accomplishment.id
          ? Reports.saveAccomplishment(
              { id: $scope.accomplishment.id },
              $scope.accomplishment
            )
          : Reports.insertAccomplishment(
              { reportId: $scope.report.id },
              $scope.accomplishment
            );

        $scope.accomplishment.$promise
          .then(function (resp) {
            swal({
              title: "",
              type: "success",
              text: "บันทึกเรียบร้อยแล้ว",
              confirmButtonText: "ตกลง",
              confirmButtonClass: "btn-success",
            });
            $scope.modes.accomplishmentEdit = false;
          })
          .catch(function (err) {
            $scope.showWarning(err);
          });
      };

      $scope.printAccomplishment = function () {
        var report_id = $scope.report.id;
        window.open(config.API_BASEPATH + "/civic/success_report/" + report_id + "/", "_blank");
      };

      $scope.printLetter = function () {
        var report_id = $scope.report.id;
        window.open(config.API_BASEPATH + "/civic/letter/" + report_id + "/", "_blank");
      }

      $scope.showWarning = function (err) {
        if (err.status === 403) {
          swal({
            title: "",
            type: "warning",
            text: "คุณไม่มีสิทธิเปลี่ยนค่าระดับความสำคัญได้",
            confirmButtonText: "ตกลง",
            confirmButtonClass: "btn-danger",
          });
        } else {
          swal({
            title: "",
            type: "warning",
            text: "เกิดข้อผิดพลาด กรุณาลองใหม่",
            confirmButtonText: "ตกลง",
            confirmButtonClass: "btn-danger",
          });
        }
      };

      $scope.printDiv = function () {
        if ($scope.report.reportTypeCode === 'civic') {
          window.open(config.API_BASEPATH + "/civic/report/" + $scope.report.id + "/", "_blank");
        } else {
          var printContents = $(".report-print").html();
          var popupWin = window.open("", "_blank");
          popupWin.document.open();
          popupWin.document.write(
            '<html><head><link rel="stylesheet" type="text/css" href="' +
            window.location.origin +
            '/styles/app.css" /></head><body onload="window.print()">' +
            printContents +
            "</html>"
          );
          popupWin.document.close();
        }
      };

      function showConfirm(text, confirm, cancel) {
        swal(
          {
            title: "",
            type: "warning",
            text: text,
            confirmButtonText: "ตกลง",
            confirmButtonClass: "btn-danger",
            showCancelButton: true,
            cancelButtonText: "ยกเลิก",
          },
          function (isConfirm) {
            if (isConfirm) {
              confirm && confirm();
            } else {
              cancel && cancel();
            }
          }
        );
      }

      $scope.markAsTest = function markAsTest(report) {
        showConfirm("คุณต้องการปรับเป็นรายงานทดสอบหรือไม่", function () {
          Reports.markAsTest({ id: report.id }).$promise.then(function () {
            report.testFlag = true;
          });
        });
      };
      $scope.markAsNotTest = function markAsNotTest(report) {
        showConfirm(
          "คุณต้องการปรับให้รายงานนี้ไม่ใช่รายงานทดสอบหรือไม่",
          function () {
            Reports.markAsNotTest({ id: report.id }).$promise.then(function () {
              report.testFlag = false;
            });
          }
        );
      };

      $scope.submitState = function () {};
      $scope.submitStateSuccess = function (newState) {
        $scope.report.stateId = newState.id;
        $scope.report.stateCode = newState.code;
        $scope.report.stateName = newState.name;
      };
      $scope.onStateSelect = function (state) {
        $scope.futureState = state;
      };
      $scope.isStateChange = function () {
        return (
          $scope.report &&
          $scope.futureState &&
          $scope.futureState.id !== $scope.report.stateId
        );
      };
      // listen to new state.
      streaming.on("report:state:new", function (data) {
        console.log("got new state", data);
        data = angular.fromJson(data);

        if ($scope.report) {
          if (data.reportId === $scope.report.id) {
            $scope.reportStatesLogs.push(data);
            $scope.$apply();
          }
        }
      });

      /* Plan */
      function loadPlanReport() {
        $scope.report.$promise.then(function () {
          Reports.plans({ reportId: $scope.report.id }).$promise.then(function (
            resp
          ) {
            $scope.currentPlan = resp[0];
          });
        });
      }

      $scope.viewPlanReport = function (planReportId) {
        PlanReport.get({ id: planReportId }).$promise.then(function (resp) {
          $scope._viewResponseMap(resp);
        });
      };

      $scope._viewResponseMap = function (planReport) {
        var scope = $scope.$new();
        scope.planReport = planReport;
        scope.isShowMap = true;

        var modalInstance = $modal.open({
          templateUrl: "views/plan-report.html",
          scope: scope,
          size: "lg",
          controller: "PlanReportModalCtrl",
        });
      };

      var user = storage.get("user");
      $scope.isStaff = user && (user.isStaff || user.isSupervisor);

      $scope.publish = function (report) {
        showConfirm(
          "คุณต้องการให้รายงานนี้แสดงในแอป ดูดีดี หรือไม่",
          function () {
            Reports.publish({ id: report.id }).$promise.then(function (resp) {
              report.isCurated = true;
            });
          }
        );
      };

      $scope.unpublish = function (report) {
        showConfirm(
          "คุณต้องการไม่ให้รายงานนี้แสดงในแอป ดูดีดี หรือไม่",
          function () {
            Reports.unpublish({ id: report.id }).$promise.then(function (resp) {
              report.isCurated = false;
            });
          }
        );
      };

      $scope.showReport = function (reportId) {
        shared.reportWatchId = reportId;
      };

      $scope.getCtMapArea = function () {
        var returnItem;
        $scope.report.originalFormData.forEach(function (item) {
          if (item.name === "ct_map_area") {
            returnItem = item;
            return true;
          }
        });
        return returnItem && returnItem.value;
      };

      $scope.getCtDataRadius = function () {
        var returnItem;
        $scope.report.originalFormData.forEach(function (item) {
          if (item.name === "ct_data_radius") {
            returnItem = item;
            return true;
          }
        });
        return returnItem && returnItem.value;
      };

      var $mapPopup = $(".report-map-popup");
      var mapPopupLeafletMap;
      var mapPopupDrawnItems = new L.FeatureGroup();

      function addMapPopupMarker(location) {
        L.marker(location, {
          icon: L.AwesomeMarkers.icon({
            icon: "",
            markerColor: "red",
          }),
        }).addTo(mapPopupDrawnItems);
      }

      L.mapbox.accessToken = config.MAPBOX_ACCESS_TOKEN;
      var satellite = L.mapbox.tileLayer("mapbox.satellite");

      var baseLayers = {
        ดาวเทียม: satellite,
      };

      $scope.showMapPopup = function () {
        $mapPopup.removeClass("hidden");

        var options = {
          center: [18.781516724349704, 98.98681640625],
          zoomControl: false,
          zoomLevel: 10,
        };

        if (!mapPopupLeafletMap) {
          if (config.USE_GOOGLE_LAYER) {
            mapPopupLeafletMap = L.map("report-popup-map", options);
            var ggl = new L.Google("ROADMAP"); // Possible types: SATELLITE, ROADMAP, HYBRID, TERRAIN
            mapPopupLeafletMap.addLayer(ggl);

            var gsat = new L.Google("HYBRID");
            baseLayers["ดาวเทียม"] = gsat;
          } else {
            mapPopupLeafletMap = config.MAPBOX_MAP_ID
              ? L.mapbox.map("report-popup-map", config.MAPBOX_MAP_ID, options)
              : L.map("report-popup-map", options);
          }

          L.control
            .layers(null, baseLayers, { position: "topleft", collapsed: false })
            .addTo(mapPopupLeafletMap);
          L.control.zoom().addTo(mapPopupLeafletMap);
          L.control.locate().addTo(mapPopupLeafletMap);

          L.control
            .scale({ metric: true, imperial: false })
            .addTo(mapPopupLeafletMap);
        }

        mapPopupDrawnItems.clearLayers();

        // report location.
        var location = [
          $scope.report.reportLocation.coordinates[1],
          $scope.report.reportLocation.coordinates[0],
        ];
        addMapPopupMarker(location);

        try {
          var loc = $scope.getCtMapArea();
          if (loc) {
            L.geoJson(loc)
              .bindLabel(
                "พื้นทีในรัศมี " +
                  $scope.getCtDataRadius().toString() +
                  "  เมตร"
              )
              .addTo(mapPopupDrawnItems);
          }
          mapPopupDrawnItems.addTo(mapPopupLeafletMap);

          // image location.
          var imageCluster = L.markerClusterGroup();
          $scope.report.images.forEach(function (item) {
            if (!item.location || !item.location.latitude) {
              return;
            }

            var location = [item.location.latitude, item.location.longitude];

            var icon = L.divIcon({
              html:
                '<div class="map-popup-image-marker"><img src="' +
                item.thumbnailUrl +
                '"></div>',
              className: "map-popup-image-marker-divicon",
              iconSize: L.point(64, 64),
              iconAnchor: L.point(32, 32),
            });
            var marker = L.marker(location, { icon: icon, clickable: true });
            marker.on("click", function () {
              $scope.viewReportImage(item);
            });
            marker.addTo(imageCluster);
          });
          imageCluster.addTo(mapPopupDrawnItems);
        } catch (e) {
          console.log(e);
        }
        mapPopupLeafletMap.setView(new L.LatLng(location[0], location[1]), 18);
      };

      $scope.closeMapPopup = function () {
        $mapPopup.addClass("hidden");
      };

      var isInternalFormDataKey = function (key) {
        return key.match(/^ct_/);
      };

      $scope.getViewableFormData = function () {
        var _items = [];
        $scope.report.originalFormData.forEach(function (item) {
          if (!isInternalFormDataKey(item.name)) {
            _items.push(item);
          }
        });
        return _items;
      };

      var leafletMap;
      var drawnItems = new L.FeatureGroup();

      function addMarker(item) {
        L.mapbox.accessToken = config.MAPBOX_ACCESS_TOKEN;
        var options = {
          center: [18.781516724349704, 98.98681640625],
          zoomLevel: 13,
          // zoomControl: false,
          // dragging: false,
          touchZoom: false,
          scrollWheelZoom: false,
          doubleClickZoom: false,
        };

        if (!leafletMap) {
          if (config.USE_GOOGLE_LAYER) {
            leafletMap = L.map("report-marker-map");
            var ggl = new L.Google("ROADMAP"); // Possible types: SATELLITE, ROADMAP, HYBRID, TERRAIN
            leafletMap.addLayer(ggl);

            // layerControl.addLayer(gsat);
          } else {
            leafletMap = config.MAPBOX_MAP_ID
              ? L.mapbox.map("report-marker-map", config.MAPBOX_MAP_ID, options)
              : L.map("report-marker-map", options);

            var controller = L.control.scale({
              metric: true,
              imperial: false,
              maxWidth: 200,
            });
            controller.addTo(leafletMap);
          }
        }

        drawnItems.clearLayers();

        var location = [
          item.reportLocation.coordinates[1],
          item.reportLocation.coordinates[0],
        ];

        L.marker(location, {
          icon: L.AwesomeMarkers.icon({
            icon: "",
            markerColor: "red",
          }),
        }).addTo(drawnItems);

        // render polygons if exists.
        item.originalFormData.forEach(function (item) {
          if (item.name === "ct_map_area") {
            L.geoJson(item.value).addTo(drawnItems);
          }
        });

        drawnItems.addTo(leafletMap);
        leafletMap.setView(
          new L.LatLng(
            item.reportLocation.coordinates[1],
            item.reportLocation.coordinates[0]
          ),
          13
        );
        leafletMap.fitBounds(drawnItems.getBounds());
      }
    }
  )

  .controller("ReportImageLightboxCtrl", function ($scope, Map) {
    // Init map.
    var center = [13.791177699, 100.58814079],
      zoomLevel = 9,
      map = false;

    L.AwesomeMarkers.Icon.prototype.options.prefix = "fa";
    var iconRed = L.AwesomeMarkers.icon({
      icon: "medkit",
      markerColor: "red",
    });

    $scope.unshowMap = function () {
      $scope.showMap = false;
    };

    $scope.toggleImageMapView = function (location) {
      $scope.showMap = !$scope.showMap;

      var newCenter = [location.latitude, location.longitude];

      var mapOptions = {
        attributionControl: false,
      };

      var leafletMap = null;
      if (config.USE_GOOGLE_LAYER) {
        leafletMap = L.map("image-position-map");
        var ggl = new L.Google("ROADMAP"); // Possible types: SATELLITE, ROADMAP, HYBRID, TERRAIN
        leafletMap.addLayer(ggl);
        // layerControl.addLayer(gsat);
      } else {
        leafletMap = config.MAPBOX_MAP_ID
          ? L.mapbox.map("image-position-map", config.MAPBOX_MAP_ID, mapOptions)
          : L.map("image-position-map", mapOptions);
      }

      if (!map) {
        map = new Map(leafletMap.setView(center, zoomLevel));
      }
      if ($scope.showMap && location) {
        map.leaflet.setView(newCenter);

        L.marker(newCenter, {
          icon: iconRed,
        }).addTo(map.leaflet);

        map.leaflet.invalidateSize();
      }
    };
  });
