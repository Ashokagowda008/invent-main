sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("yokogawaMap.Main", {
        onInit: function () {
            // this.initializeMap();
            this.subscribeToFilterEvents();
            this.loadDataAndMap();
        },

        onAfterRendering: function () {
            var me = this;
            this.loadGoogleMaps("https://maps.googleapis.com/maps/api/js?key=AIzaSyCeo6XWYuid31zLEFTm_XeW3jdTtN7ETYw&libraries=places", me.setMapData.bind(me));
            // this.initializeMap();
        },

        onApplyFilter: function (sChannel, sEvent, oData) {
            if (sChannel === "GlobalFilter") {
                var that = this;
                var i=0;
                var sPlantID = oData.PlantSelected;
                var oPlant = this._findObjectById(sPlantID);

                var value = this.getView().getModel().getProperty("/Plant_Info_Entity");
                var maxEmissionID = value.reduce(function (prev, current) {
                    return (prev.emission > current.emission) ? prev.id : current.id;
                });
                var minEmissionID = value.reduce(function (prev, current) {
                    return (prev.emission < current.emission) ? prev.id : current.id;
                });

                // Clear the array of previous circles
                this._removeCircles(this.previousCircles);
                if(sPlantID == "" || sPlantID == "All"){
                    value.forEach(function (plant) {
                        if (plant.id !== "All") {
                            i++;
                            let cityCircle = new google.maps.Circle({
                                strokeColor: plant.id == maxEmissionID ? "#800000" : plant.id == minEmissionID ? "#FF6347" : "#FF0000",
                                strokeOpacity: 0.8,
                                strokeWeight: 2,
                                fillColor: plant.id == maxEmissionID ? "#800000" : plant.id == minEmissionID ? "#FF6347" : "#FF0000",
                                fillOpacity: 0.35,
                                map: that.map,
                                center: { lat: Number(plant.lattitude), lng: Number(plant.longitude) },
                                radius: Math.sqrt(plant.emission) * 100,
                            });
        
                            that.previousCircles.push(cityCircle);
                        }
                    });
                }
                else{
                    value.forEach(function (plant) {
                        if (plant.id !== "All" && plant.id !== oPlant.id) {
                            i++;
                            let cityCircle = new google.maps.Circle({
                                strokeColor: plant.id == maxEmissionID ? "#800000" : plant.id == minEmissionID ? "#FF6347" : "#FF0000",
                                strokeOpacity: 0.8,
                                strokeWeight: 2,
                                fillColor: plant.id == maxEmissionID ? "#800000" : plant.id == minEmissionID ? "#FF6347" : "#FF0000",
                                fillOpacity: 0.35,
                                map: that.map,
                                center: { lat: Number(plant.lattitude), lng: Number(plant.longitude) },
                                radius: Math.sqrt(plant.emission) * 100,
                            });
        
                            that.previousCircles.push(cityCircle);
                        }
                    });
                    
                    // Implement filter logic
                    let cityCircle = new google.maps.Circle({
                        strokeColor: '#0000FF',
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                        fillColor: '#0000FF',
                        fillOpacity: 0.35,
                        map: that.map,
                        center: { lat: Number(oPlant.lattitude), lng: Number(oPlant.longitude) },
                        radius: Math.sqrt(oPlant.emission) * 100,
                    });
                    
                    this.previousCircles.push(cityCircle);
                }
            }
        },

        // Function to remove previously drawn circles
        _removeCircles: function(previousCircles) {
            // Iterate over the array of previous circles and remove each one from the map
            previousCircles.forEach(function(circle) {
                circle.setMap(null);
            });
            this.previousCircles = [];
        },

        _findObjectById: function(sPlantID){
            return this.getView().getModel().getProperty("/Plant_Info_Entity").find(obj => obj.id == sPlantID);
        },

        initializeMap: function () {
            this.getView().byId("map_canvas").addStyleClass("myMap");
            this.geocoder = new google.maps.Geocoder();
            window.mapOptions = {
                zoom: 3,
                center: { lat: 35.902782, lng: 12.496366 },
                streetViewControl: false,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
            };
        },

        subscribeToFilterEvents: function () {
            var oEventBus = sap.ui.getCore().getEventBus();
            oEventBus.subscribe("GlobalFilter", "ApplyFilter", this.onApplyFilter, this);
        },

        loadDataAndMap: function () {
            var oCard = this.getOwnerComponent().oCard;
            var that = this;
            var oData = { "Plant_Info_Entity": [] };
            that.getView().setModel(new JSONModel(oData));

            var promises = [
                oCard.getHostInstance().getContextValue("sap.yokogawa/oFilters/YearSelected"),
                oCard.getHostInstance().getContextValue("sap.yokogawa/oFilters/PeriodSelected"),
                oCard.getHostInstance().getContextValue("sap.yokogawa/oFilters/EquipmentSelected"),
            ];

            Promise.all(promises).then(function (values) {
				var sYear = values[0] || 2023;
                var sPeriod = values[1] || '';
                var sEquip = values[2] || '';

				// Plant_Info_Entity
				oCard.request({
					"url": "{{destinations.myDestination}}/odata/v2/Sustainability/Plant_Info_Entity",
					"method": "GET",
					"withCredentials": true,
					"headers": {
						"Accept": "application/json"
					}
				}).then(function (aData) {
                    // Use the filter method to remove the object with id equal to 2
                    var aPlantDetails = aData.d.results.filter(function(plant) {
                        return plant.id !== 'All';
                    });
                    that.getView().getModel().setProperty("/Plant_Info_Entity", aPlantDetails);
					var resolve = that.fetchEmissionData(aPlantDetails, sYear, sEquip, sPeriod, oCard);
					resolve.then(function (values) {
						that.renderMap(values, that);
					}).catch(function(error) {
						console.log("Error fetching data in Map Card " + error);
					});

				}).catch(function(error) {
					console.log("Error fetching context values in Map Card " + error);
				});

            }).catch(function (error) {
				console.log("Map Card " + error);
                // Handle error in any of the promises
            });
            
        },

        fetchEmissionData: function (data, sYear, sEquip, sPeriod, oCard) {
            var plantEmissionPromise = [];
            data.forEach(function (plant) {
                if (plant.id !== "All") {
                    var sUrl = "/getTotalCEValue(year='" + sYear + "',plantid='" + plant.id + "',EquipmentTypeid='" + sEquip + "',period='" + sPeriod + "')";
                    var encodedUrl = encodeURI(sUrl);
                    plantEmissionPromise.push(
                        oCard.request({
                            "url": "{{destinations.myDestination}}/Sustainability" + encodedUrl,
                            "method": "GET",
                            "withCredentials": true,
                            "headers": { "Accept": "application/json" },
                        })
                    );
                }
            });
            return Promise.all(plantEmissionPromise);
        },

        renderMap: function (values, that) {
            var i = 0;
            var me = this;
            this.emissionValues = values;
            this.previousCircles = [];
            var value = this.getView().getModel().getProperty("/Plant_Info_Entity");
            var oModel = this.getView().getModel();
            // var map = new google.maps.Map(this.getView().byId("map_canvas").getDomRef(), mapOptions);
            var maxEmissionID = value.reduce(function (prev, current) {
                return (prev.emission > current.emission) ? prev.id : current.id;
            });

            var minEmissionID = value.reduce(function (prev, current) {
                return (prev.emission < current.emission) ? prev.id : current.id;
            });
            value.forEach(function (plant) {
                if (plant.id !== "All") {
                    oModel.setProperty("/Plant_Info_Entity/i/emission", values[i].TotalCEValue.TotalCeValueinGrams);
                    plant.emission = values[i].TotalCEValue.TotalCeValueinGrams;
                    i++;
                    let cityCircle = new google.maps.Circle({
                        strokeColor: plant.id == maxEmissionID ? "#800000" : plant.id == minEmissionID ? "#FF6347" : "#FF0000",
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                        fillColor: plant.id == maxEmissionID ? "#800000" : plant.id == minEmissionID ? "#FF6347" : "#FF0000",
                        fillOpacity: 0.35,
                        map: that.map,
                        center: { lat: Number(plant.lattitude), lng: Number(plant.longitude) },
                        radius: Math.sqrt(plant.emission) * 100,
                    });

                    me.previousCircles.push(cityCircle);

                    let marker = new google.maps.Marker({
                        position: { lat: Number(plant.lattitude), lng: Number(plant.longitude) },
                        map: that.map,
                        title: plant.desc,
                    });

                    marker.addListener("click", function (e) {
                        that.map.setZoom(3);
                        let matchingLocation = value.find(function (location) {
                            return location.lattitude == e.latLng.lat() && location.longitude == e.latLng.lng();
                        });

                        var oFilterObj = {
                            PlantSelected: matchingLocation ? matchingLocation.id : null,
                        };
                        var oEventBus = sap.ui.getCore().getEventBus();
                        oEventBus.publish("GlobalMapFilter", "ApplyFilter", oFilterObj);
                    });
                }
            });
        },

        loadGoogleMaps: function (scriptUrl, callbackFn) {
            var script = document.createElement("script");
            script.onload = function () {
                callbackFn();
            };
            script.src = scriptUrl;
            document.body.appendChild(script);
        },

        setMapData: function () {
            if (!this.initialized) {
                var that = this;
                this.initialized = true;
                this.geocoder = new google.maps.Geocoder();
                window.mapOptions = {
                    zoom: 3,
                    center: { lat: 35.902782, lng: 12.496366 },
                    streetViewControl: false,
                    mapTypeId: google.maps.MapTypeId.ROADMAP,
                };

                this.map = new google.maps.Map(this.getView().byId("map_canvas").getDomRef(), mapOptions);

                var value = this.getView().getModel().getProperty("/Plant_Info_Entity");

                // value = [
                //     {
                //       center: { lat: 41.878, lng: -87.629 },
                //       emission: 52785570.62,
                //       lattitude: 41.878,
                //       longitude: -87.629,
                //       desc: "Hi1",
                //       id: 1
                //     },
                //     {
                //       center: { lat: 40.714, lng: -74.005 },
                //       emission: 24596176.53,
                //       lattitude: 40.714,
                //       longitude: -74.005,
                //       desc: "Hi2",
                //       id: 2
                //     },
                //     {
                //       center: { lat: 34.052, lng: -118.243 },
                //       emission: 2342680.36,
                //       lattitude: 34.052,
                //       longitude: -118.243,
                //       desc: "Hi3",
                //       id: 3
                //     }
                // ];

                // Assuming 'value' is your array of objects
                if(value.length>0){
                    var maxEmissionID = value.reduce(function (prev, current) {
                        return (prev.emission > current.emission) ? prev.id : current.id;
                    });
    
                    var minEmissionID = value.reduce(function (prev, current) {
                        return (prev.emission < current.emission) ? prev.id : current.id;
                    });
    
                    value.forEach(function (plant) {
                        if (plant.id != "All") {
                            const cityCircle = new google.maps.Circle({
                                strokeColor: plant.id == maxEmissionID ? "#800000" : plant.id == minEmissionID ? "#FF6347" : "#FF0000",
                                strokeOpacity: 0.8,
                                strokeWeight: 2,
                                fillColor: plant.id == maxEmissionID ? "#800000" : plant.id == minEmissionID ? "#FF6347" : "#FF0000",
                                fillOpacity: 0.35,
                                map: that.map,
                                center: { lat: Number(plant.lattitude), lng: Number(plant.longitude) },
                                radius: Math.sqrt(plant.emission) * 100,
                                // radius: Math.sqrt(52785570.62) * 100
                            });
    
                            const marker = new google.maps.Marker({
                                position: { lat: Number(plant.lattitude), lng: Number(plant.longitude) },
                                map: that.map,
                                title: plant.desc,
                            });
    
                            marker.addListener("click", function (e) {
                                that.map.setZoom(3);
                                const matchingLocation = value.find(function (location) {
                                    return location.lattitude == e.latLng.lat() && location.longitude == e.latLng.lng();
                                });
    
                                var oFilterObj = {
                                    "PlantSelected": matchingLocation ? matchingLocation.id : null,
                                };
                                var oEventBus = sap.ui.getCore().getEventBus();
                                oEventBus.publish("GlobalMapFilter", "ApplyFilter", oFilterObj);
                            });
                        }
                    });
                }
                
            }
        },

        onExit: function() {
            var oEventBus = sap.ui.getCore().getEventBus();
            oEventBus.unsubscribe("GlobalFilter", "ApplyFilter", this.onApplyFilter, this);
        }
    });
});
