sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/core/UIComponent",
    "sap/base/Log",
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/m/BusyDialog", "sap/ui/core/format/DateFormat"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, MessageToast, UIComponent, Log, JSONModel, Device, MessageBox, Fragment, BusyDialog, DateFormat) {
        "use strict";

        return Controller.extend("bookinglist.controller.bookinglist", {
            onInit: function () {
                this.getBookingList(new Date());
            },
            handleCalendarSelect: function (oEvent) {
                var oCalendar = oEvent.getSource();
                let oCalendarDate = oCalendar.getSelectedDates()[0].getStartDate()
                this.getBookingList(oCalendarDate);
            },
            getBookingList: function (oCalendarDate) {
                var that = this;
                // var EmailId = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
                var EmailId = "ranjith.kumar@sap.com";
                let appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                let appPath = appId.replaceAll(".", "/");
                var appModulePath = jQuery.sap.getModulePath(appPath);
                sap.ui.core.BusyIndicator.show(0);
                var aSelectedDates = oCalendarDate;
                $.ajax({
                    url: appModulePath + "/service/car_pool_entity?$filter=Email eq '" + EmailId + "' and StatuCode eq 'C'",
                    method: "GET",
                    async: false,
                    headers: {
                        'Accept': 'application/json',
                        "Content-Type": "application/json"
                    },
                    success: function (result, xhr, data) {
                        var Data = result.value;
                        if (Data.length > 0) {
                            let PostITID = Data[0].Post_IT_ID;
                            var aDate = new Date(oCalendarDate)
                            var userTimezoneOffset = aDate.getTimezoneOffset() * 60000;
                            aDate = new Date(aDate.getTime() - userTimezoneOffset).toISOString();
                            var comFil = "Post_IT_ID eq '" + PostITID + "' and BookingDate gt " + aDate.split("T")[0] + "T00:00:00Z and BookingDate lt " + aDate.split("T")[0] + "T23:59:59Z";
                            var getBookedURL = appModulePath + "/service/Booking_entity?$filter=" + comFil;
                            // var sUrl = appModulePath + "/service/car_pool_entity?$filter=Post_IT_ID eq '" + PostITID + "'";
                            $.ajax({
                                url: getBookedURL,
                                method: "GET",
                                async: false,
                                headers: {
                                    'Accept': 'application/json',
                                    "Content-Type": "application/json"
                                },
                                success: function (result, xhr, data) {
                                    var BookingData = result.value;
                                    var oModel = new sap.ui.model.json.JSONModel();
                                    BookingData = BookingData ? BookingData : [];
                                    // let sUploadURL = that.getView().byId("fileUploader").getUploadUrl();
                                    // if (Data.length > 0) {
                                    // var Bookedcount = $.ajax({ type: "GET", url: getBookedURL, async: false }).responseText;

                                    // }
                                    if(BookingData.length > 0) {
                                        BookingData.forEach(element => {
                                            element.Pickup_Point = Data[0].Pickup_Point
                                           
                                        }); 
                                    }
                                   
                                    oModel.setData(BookingData);
                                    that.getView().setModel(oModel, "BookingList");
                                    sap.ui.core.BusyIndicator.hide();
                                },
                                error: function (request, status, error) {
                                    sap.ui.core.BusyIndicator.hide();
                                    MessageBox.error("Technical error please contact system administrator.");
                                }
                            });
                        } else {
                            MessageBox.error("Register Car Details not available for this User.");
                        }
                    }

                });
            },
            dateFormatter: function (val) {
                if (val) {
                    jQuery.sap.require("sap.ui.core.format.DateFormat");
                    var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
                        source: {
                            pattern: "dd/MM/yyyy"
                        },
                        pattern: "dd/MM/yyyy"
                    });
                    return oDateFormat.format(new Date(val));
                }
                else {
                    return null;
                }
            },
        });
    });
