'use strict';

angular.module('poddDashboardApp')

    .factory('AnalyticMap', function ($resource) {
        // mock
        return {
            list: function () {
                return [
                    {
                        name: 'Chiang Mai PODD Area',
                        code: 'podd-cnx'
                    }
                ]
            },
            get: function (query) {
                switch (query.code) {
                    case 'podd-cnx':
                        return {
                            name: 'PODD Chiang Mai Area',
                            code: 'cnx-podd',
                            layers: [
                                {
                                    name: 'Amphor',
                                    code: 'amphor',
                                    type: 'geojson',
                                    popupPropertyName: 'name',
                                    style: {
                                        color: '#ff7800',
                                        'weight': 5,
                                        'opacity': 0.65
                                    },
                                    url: 'https://analytic.cmonehealth.org/summary/geojson/cnx-authority.json'
                                },
                                {
                                    name: 'Restricted Area',
                                    code: 'restricted-area',
                                    type: 'geojson',
                                    url: 'https://gist.githubusercontent.com/noomz/bc700fd532f727fe1513db369add2a3b/raw/fc3d05dcaf4c71b841080e602c59d70565f38f52/map.geojson'
                                },
                                {
                                    name: 'Report : Animal Sick/Death',
                                    code: 'report-1',
                                    type: 'report',
                                    color: '#f00',
                                    radius: 100,
                                    fillColor: '#f90',
                                    filter: {
                                        since: '2017-10-01',
                                        to: '2017-11-01'
                                    }
                                }
                            ]
                        };
                }
            }
        }
    })

    .factory('AnalyticMapLayerRenderer', function () {

    })

    .factory('AnalyticMapDataLayer', ['dashboard', 'Search', function (dashboard, Search) {
        function LayerDataProcessor(metaLayer) {
            return {
                'geojson': function () {
                    return {
                        $data: function () {
                            return dashboard.getViaProxy({url: metaLayer.url}).$promise
                        }
                    }
                },
                'report': function () {
                    return {
                        $data: function () {
                            return Promise.resolve({}) // replace here.
                        }
                    }
                }
            }[metaLayer.type]
        }

        return function (layer) {
            return {
                meta: {
                    layer: layer
                },
                $data: function $data() {
                    return LayerDataProcessor(layer)().$data()
                }
            }
        }
    }])

    .factory('AnalyticMapRenderer', [function () {
        return function (type, config) {
            var func = {
                'geojson': {
                    $render: function (data) {
                        return Promise.resolve(L.geoJson(data, {
                            style: config.style,
                            onEachFeature: function onEachFeature(feature, layer) {
                                if (feature.properties && feature.properties[config.popupPropertyName]) {
                                    layer.bindPopup(feature.properties[config.popupPropertyName]);
                                }
                            }
                        }));
                    }
                },
                'report': {
                    $render: function (data) {
                        var group = new L.FeatureGroup();

                        angular.forEach(data.results, function (item) {
                            if (!item.reportLocation) {
                                return;
                            }

                            var loc = [parseFloat(item.reportLocation[1]), parseFloat(item.reportLocation[0])];
                            if (!loc[0] || !loc[1]) {
                                return;
                            }

                            var layer = L.circle(loc, config.radius).bindPopup(item.formDataExplanation + '<br><br>Go to: <a target="_blank" href="#/home?reportId=' + item.id + '">Report #' + item.id + '</a>');
                            layer.addTo(group);
                        });

                        return Promise.resolve(group);
                    }
                }
            }[type];

            if (func) {
                return func;
            }
            else {
                return function () {};
            }
        }
    }]);
